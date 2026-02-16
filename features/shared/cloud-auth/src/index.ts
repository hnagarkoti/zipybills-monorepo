/**
 * FactoryOS Cloud Auth – Core module
 *
 * Provides SaaS-aware authentication:
 *  - Tenant-scoped login (resolves user → tenant, includes tenant_id in JWT)
 *  - Self-service signup / onboarding (provision new tenant + admin user)
 *  - Platform admin helpers
 *
 * Works alongside existing auth-middleware.  In on-prem mode (SAAS_MODE != 'true'),
 * the standard auth router handles login without tenant context.
 */

import bcrypt from 'bcryptjs';
import { query, transaction } from '@zipybills/factory-database-config';
import { generateToken, type JwtPayload } from '@zipybills/factory-auth-middleware';
import { provisionTenant, getUserTenant, type TenantPlan } from '@zipybills/factory-multi-tenancy';
import { getPlanByCode, createSubscription } from '@zipybills/factory-subscription-billing';

const SAAS_MODE = process.env.SAAS_MODE === 'true';

// ─── Types ────────────────────────────────────

export interface SaaSLoginRequest {
  username: string;
  password: string;
  /** Optional: specify company domain or slug (for multi-tenant ambiguity resolution) */
  tenant_slug?: string;
}

export interface SaaSLoginResponse {
  success: boolean;
  token: string;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    tenant_id?: number;
    is_platform_admin?: boolean;
  };
  tenant?: {
    tenant_id: number;
    company_name: string;
    slug: string;
    plan: string;
  };
}

export interface SignupRequest {
  company_name: string;
  slug: string;
  admin_username: string;
  admin_password: string;
  admin_full_name: string;
  admin_email?: string;
  plan_code?: string;
  custom_domain?: string;
}

export interface SignupResponse {
  success: boolean;
  token: string;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
  };
  tenant: {
    tenant_id: number;
    company_name: string;
    slug: string;
    plan: string;
  };
}

// ─── SaaS Login ───────────────────────────────

export async function saasLogin(req: SaaSLoginRequest): Promise<SaaSLoginResponse> {
  const { username, password, tenant_slug } = req;

  // Find user
  const userResult = await query(
    `SELECT * FROM users WHERE username = $1`,
    [username],
  );
  const user = userResult.rows[0];
  if (!user || !user.is_active) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Resolve tenant for SaaS mode
  let tenantInfo: { tenant_id: number; company_name: string; slug: string; plan: string } | undefined;
  let tenantId: number | undefined;
  let isPlatformAdmin = false;

  if (SAAS_MODE) {
    // Check if user is a platform admin (check tenant_users for platform_admin flag)
    const platformCheck = await query(
      `SELECT tu.is_tenant_admin, t.tenant_id, t.company_name, t.tenant_slug, t.plan, t.is_platform_admin
       FROM tenant_users tu
       JOIN tenants t ON t.tenant_id = tu.tenant_id
       WHERE tu.user_id = $1
       ORDER BY tu.joined_at ASC`,
      [user.user_id],
    );

    if (platformCheck.rows.length === 0) {
      throw new Error('User not associated with any tenant');
    }

    // If tenant_slug provided, try to match it
    let tenantRow;
    if (tenant_slug) {
      tenantRow = platformCheck.rows.find((r: any) => r.tenant_slug === tenant_slug);
      if (!tenantRow) {
        throw new Error(`No access to tenant "${tenant_slug}"`);
      }
    } else {
      // Default to first tenant (or platform admin's primary tenant)
      tenantRow = platformCheck.rows[0];
    }

    tenantId = tenantRow.tenant_id;
    isPlatformAdmin = tenantRow.is_platform_admin === true;

    // Check tenant is active
    const tenantStatus = await query(
      `SELECT status, trial_ends_at FROM tenants WHERE tenant_id = $1`,
      [tenantId],
    );
    const t = tenantStatus.rows[0];
    if (!t || t.status === 'SUSPENDED' || t.status === 'CANCELLED') {
      throw new Error(`Tenant is ${t?.status || 'not found'}. Contact support.`);
    }
    if (t.status === 'TRIAL' && t.trial_ends_at && new Date(t.trial_ends_at) < new Date()) {
      // Trial expired → auto-downgrade to FREE plan instead of blocking login
      try {
        const freeLimits = { maxUsers: 3, maxMachines: 2 };
        await query(
          `UPDATE tenants SET plan = 'FREE', status = 'ACTIVE', max_users = $1, max_machines = $2 WHERE tenant_id = $3`,
          [freeLimits.maxUsers, freeLimits.maxMachines, tenantId],
        );
        // Update the tenantRow plan info so the JWT reflects FREE
        tenantRow.plan = 'FREE';
        console.log(`[CloudAuth] Trial expired for tenant ${tenantId} — downgraded to FREE plan`);
      } catch (downgradeErr) {
        console.error('[CloudAuth] Failed to downgrade tenant:', downgradeErr);
        throw new Error('Trial has expired and auto-downgrade failed. Contact support.');
      }
    }

    tenantInfo = {
      tenant_id: tenantId,
      company_name: tenantRow.company_name,
      slug: tenantRow.tenant_slug,
      plan: tenantRow.plan,
    };
  }

  // Generate JWT with tenant context
  const payload: JwtPayload = {
    user_id: user.user_id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
  };

  if (tenantId !== undefined) payload.tenant_id = tenantId;
  if (isPlatformAdmin) payload.is_platform_admin = true;

  const token = generateToken(payload);

  return {
    success: true,
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      tenant_id: tenantId,
      is_platform_admin: isPlatformAdmin || undefined,
    },
    tenant: tenantInfo,
  };
}

// ─── Self-Onboarding / Signup ─────────────────

export async function selfSignup(req: SignupRequest): Promise<SignupResponse> {
  const { company_name, slug, admin_username, admin_password, admin_full_name, plan_code = 'enterprise', custom_domain } = req;

  // Validate slug
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Invalid slug. Use only lowercase letters, numbers, and hyphens.');
  }
  if (!admin_username || !admin_password || admin_password.length < 6) {
    throw new Error('Username required. Password must be at least 6 characters.');
  }

  // Check if slug already exists
  const existing = await query(`SELECT tenant_id FROM tenants WHERE tenant_slug = $1`, [slug]);
  if (existing.rows[0]) {
    throw new Error(`Company slug "${slug}" is already taken`);
  }

  // Check if username already exists
  const existingUser = await query(`SELECT user_id FROM users WHERE username = $1`, [admin_username]);
  if (existingUser.rows[0]) {
    throw new Error(`Username "${admin_username}" is already taken`);
  }

  // Resolve the plan
  const plan = await getPlanByCode(plan_code);
  // Default to ENTERPRISE with trial for self-signup even if plan table is empty
  const defaultTrialDays = parseInt(process.env.TRIAL_DAYS || '14', 10);
  const tenantPlan: TenantPlan = (plan?.tenant_plan as TenantPlan) || 'ENTERPRISE';

  // Provision tenant + admin user in a transaction
  // Pass trial_days from the plan so the tenant starts in TRIAL status
  // Falls back to TRIAL_DAYS env var when plan is not found
  const result = await provisionTenant(
    company_name,
    admin_username,
    admin_password,
    admin_full_name,
    tenantPlan,
    custom_domain,
    slug,
    plan?.trial_days ?? defaultTrialDays,
  );

  // Create subscription if a plan was found
  if (plan) {
    try {
      await createSubscription(result.tenant.tenant_id, plan.plan_id, 'MONTHLY');
    } catch (err) {
      console.warn('[CloudAuth] Subscription creation failed (non-critical):', err);
    }
  }

  // Generate JWT with tenant context
  const token = generateToken({
    user_id: result.adminUserId,
    username: admin_username,
    role: 'ADMIN',
    full_name: admin_full_name,
    tenant_id: result.tenant.tenant_id,
  });

  return {
    success: true,
    token,
    user: {
      user_id: result.adminUserId,
      username: admin_username,
      full_name: admin_full_name,
      role: 'ADMIN',
    },
    tenant: {
      tenant_id: result.tenant.tenant_id,
      company_name: result.tenant.company_name,
      slug: result.tenant.tenant_slug,
      plan: result.tenant.plan,
    },
  };
}

// ─── Platform Admin Seed ──────────────────────

/**
 * Seeds a platform admin tenant and user on first SaaS startup.
 */
export async function seedPlatformAdmin(): Promise<void> {
  if (!SAAS_MODE) return;

  const check = await query(`SELECT tenant_id FROM tenants WHERE tenant_slug = 'platform'`);
  if (check.rows[0]) return;

  console.log('[CloudAuth] Seeding platform admin tenant...');

  try {
    const result = await provisionTenant(
      'Platform Admin',
      process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin',
      process.env.PLATFORM_ADMIN_PASSWORD || 'admin123!',
      'Platform Administrator',
      'ENTERPRISE',
      undefined, // domain
      'platform', // slug — must match the check above
    );

    // Mark as platform admin
    await query(
      `UPDATE tenants SET is_platform_admin = true WHERE tenant_id = $1`,
      [result.tenant.tenant_id],
    );

    console.log(`[CloudAuth] ✅ Platform admin created: ${process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin'} (tenant: ${result.tenant.tenant_id})`);
  } catch (err) {
    console.error('[CloudAuth] Failed to seed platform admin:', err);
  }
}
