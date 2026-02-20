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
  /** Required: the tenant's workspace slug (e.g. 'acme-manufacturing') */
  tenant_slug: string;
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
  admin_phone?: string;
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

  // tenant_slug is required — every login must be scoped to a workspace
  if (!tenant_slug) {
    throw new Error('Workspace ID is required');
  }

  // Find user scoped to the specified tenant in one query
  // This is the correct SaaS approach: username uniqueness is per-tenant
  const userResult = await query(
    `SELECT u.*, tu.is_tenant_admin, t.tenant_id as t_id, t.company_name, t.tenant_slug, t.plan, t.status as tenant_status, t.trial_ends_at, t.is_platform_admin
     FROM users u
     JOIN tenant_users tu ON tu.user_id = u.user_id
     JOIN tenants t ON t.tenant_id = tu.tenant_id
     WHERE u.username = $1
       AND t.tenant_slug = $2
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [username, tenant_slug],
  );
  const userRow = userResult.rows[0];
  if (!userRow || !userRow.is_active) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const valid = await bcrypt.compare(password, userRow.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Rebuild user and tenant from joined row
  const user = userRow;

  // Resolve tenant for SaaS mode
  let tenantInfo: { tenant_id: number; company_name: string; slug: string; plan: string } | undefined;
  let tenantId: number | undefined;
  let isPlatformAdmin = false;

  if (SAAS_MODE) {
    // Use the tenant resolved from the scoped lookup
    let tenantRow = userRow;
    tenantRow.tenant_id = userRow.t_id; // alias fix

    tenantId = tenantRow.t_id;
    isPlatformAdmin = tenantRow.is_platform_admin === true;

    // Check tenant is active (using data already fetched from the join)
    const t = { status: tenantRow.tenant_status, trial_ends_at: tenantRow.trial_ends_at };
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
        // Update the plan info so the JWT reflects FREE
        userRow.plan = 'FREE';
        console.log(`[CloudAuth] Trial expired for tenant ${tenantId} — downgraded to FREE plan`);
      } catch (downgradeErr) {
        console.error('[CloudAuth] Failed to downgrade tenant:', downgradeErr);
        throw new Error('Trial has expired and auto-downgrade failed. Contact support.');
      }
    }

    tenantInfo = {
      tenant_id: tenantId,
      company_name: userRow.company_name,
      slug: userRow.tenant_slug,
      plan: userRow.plan,
    };
  }

  // Generate JWT with tenant context
  const payload: JwtPayload = {
    user_id: userRow.user_id,
    username: userRow.username,
    role: userRow.role,
    full_name: userRow.full_name,
  };

  if (tenantId !== undefined) payload.tenant_id = tenantId;
  if (isPlatformAdmin) payload.is_platform_admin = true;

  const token = generateToken(payload);

  return {
    success: true,
    token,
    user: {
      user_id: userRow.user_id,
      username: userRow.username,
      full_name: userRow.full_name,
      role: userRow.role,
      tenant_id: tenantId,
      is_platform_admin: isPlatformAdmin || undefined,
    },
    tenant: tenantInfo,
  };
}

// ─── Self-Onboarding / Signup ─────────────────

export async function selfSignup(req: SignupRequest): Promise<SignupResponse> {
  const { company_name, slug, admin_username, admin_password, admin_full_name, admin_email, admin_phone, plan_code = 'enterprise', custom_domain } = req;

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

  // Note: username uniqueness is now enforced per-tenant at the DB level
  // (UNIQUE INDEX on users(tenant_id, username) WHERE deleted_at IS NULL)
  // No global check needed — the same username can exist across different tenants.

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
    admin_email,
    admin_phone,
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
