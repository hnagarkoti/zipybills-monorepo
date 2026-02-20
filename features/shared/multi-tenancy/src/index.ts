/**
 * FactoryOS Multi-Tenancy Core
 *
 * Provides tenant management, provisioning, and data isolation for SaaS mode.
 *
 * Tables:
 *   tenants       – Tenant organizations
 *   tenant_users  – Mapping of users to tenants (one user can belong to one tenant)
 *
 * Strategy:
 *   - Shared database, schema-per-tenant approach via tenant_id column
 *   - All data tables get a tenant_id FK for row-level isolation
 *   - Middleware injects tenant context into every request
 */

import { query, transaction } from '@zipybills/factory-database-config';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
export type TenantPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type LicenseType = 'saas' | 'onprem';

export interface Tenant {
  tenant_id: number;
  tenant_slug: string;
  company_name: string;
  domain: string | null;
  logo_url: string | null;
  status: TenantStatus;
  plan: TenantPlan;
  license_type: LicenseType;
  max_users: number;
  max_machines: number;
  is_active: boolean;
  is_platform_admin: boolean;
  settings: TenantSettings;
  trial_ends_at: string | null;
  expires_at: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

/** G1-G5: Typed tenant settings stored in settings JSONB */
export interface TenantSettings {
  /** G1: Branding */
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    favicon?: string;
    appName?: string;
  };
  /** G2: Per-tenant feature flag overrides (featureId → enabled) */
  featureOverrides?: Record<string, boolean>;
  /** G3: Per-tenant shift configuration */
  shiftConfig?: {
    maxShiftsPerDay?: number;
    minShiftDurationHours?: number;
    maxShiftDurationHours?: number;
    allowOverlapping?: boolean;
  };
  /** G4: Locale/language configuration */
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  /** G5: Per-tenant backup settings */
  backup?: {
    enabled?: boolean;
    scheduleHour?: number; // 0-23 UTC
    retentionDays?: number;
    includeActivityLog?: boolean;
  };
  /** Arbitrary custom settings */
  [key: string]: any;
}

export interface TenantUser {
  tenant_user_id: number;
  tenant_id: number;
  user_id: number;
  is_tenant_admin: boolean;
  joined_at: string;
}

// ─── Plan Limits ──────────────────────────────
// Read from PLAN_* env vars to stay in sync with subscription-billing seed.
// Hardcoded values below are fallbacks only.

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v !== undefined ? parseInt(v, 10) : fallback;
}

function envFeatures(key: string, fallback: string[]): string[] {
  const v = process.env[key];
  return v ? v.split(',').map((f) => f.trim()) : fallback;
}

export const PLAN_LIMITS: Record<TenantPlan, { maxUsers: number; maxMachines: number; features: string[] }> = {
  FREE: {
    maxUsers: envInt('PLAN_FREE_MAX_USERS', 3),
    maxMachines: envInt('PLAN_FREE_MAX_MACHINES', 2),
    features: envFeatures('PLAN_FREE_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'dashboard']),
  },
  STARTER: {
    maxUsers: envInt('PLAN_STARTER_MAX_USERS', 10),
    maxMachines: envInt('PLAN_STARTER_MAX_MACHINES', 10),
    features: envFeatures('PLAN_STARTER_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports']),
  },
  PROFESSIONAL: {
    maxUsers: envInt('PLAN_PROFESSIONAL_MAX_USERS', 50),
    maxMachines: envInt('PLAN_PROFESSIONAL_MAX_MACHINES', 30),
    features: envFeatures('PLAN_PROFESSIONAL_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme']),
  },
  ENTERPRISE: {
    maxUsers: envInt('PLAN_ENTERPRISE_MAX_USERS', -1),
    maxMachines: envInt('PLAN_ENTERPRISE_MAX_MACHINES', -1),
    features: envFeatures('PLAN_ENTERPRISE_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme', 'backups', 'admin', 'license', 'permissions']),
  },
};

// ─── Schema ───────────────────────────────────

export async function initializeMultiTenancySchema(): Promise<void> {
  console.log('[Multi-Tenancy] Initializing schema...');

  await query(`
    CREATE TABLE IF NOT EXISTS tenants (
      tenant_id      SERIAL PRIMARY KEY,
      tenant_slug    VARCHAR(100) UNIQUE NOT NULL,
      company_name   VARCHAR(300) NOT NULL,
      domain         VARCHAR(255),
      logo_url       TEXT,
      status         VARCHAR(20) DEFAULT 'TRIAL'
                     CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED')),
      plan           VARCHAR(20) DEFAULT 'FREE'
                     CHECK (plan IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
      license_type   VARCHAR(10) DEFAULT 'saas'
                     CHECK (license_type IN ('saas', 'onprem')),
      max_users      INT DEFAULT 3,
      max_machines   INT DEFAULT 2,
      is_active      BOOLEAN DEFAULT true,
      is_platform_admin BOOLEAN DEFAULT false,
      settings       JSONB DEFAULT '{}',
      trial_ends_at  TIMESTAMPTZ,
      expires_at     TIMESTAMPTZ,
      locale         VARCHAR(10) DEFAULT 'en',
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      updated_at     TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // A4/A6/A7/G4: Add missing columns idempotently for existing installs
  for (const col of [
    { name: 'license_type', def: "VARCHAR(10) DEFAULT 'saas'" },
    { name: 'is_active', def: 'BOOLEAN DEFAULT true' },
    { name: 'expires_at', def: 'TIMESTAMPTZ' },
    { name: 'locale', def: "VARCHAR(10) DEFAULT 'en'" },
    { name: 'contact_email', def: 'VARCHAR(255)' },
    { name: 'contact_phone', def: 'VARCHAR(50)' },
  ]) {
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = '${col.name}') THEN
          ALTER TABLE tenants ADD COLUMN ${col.name} ${col.def};
        END IF;
      END $$;
    `);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS tenant_users (
      tenant_user_id  SERIAL PRIMARY KEY,
      tenant_id       INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      is_tenant_admin BOOLEAN DEFAULT false,
      joined_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (tenant_id, user_id)
    );
  `);

  // Add tenant_id columns to existing tables (idempotent)
  const tablesToTenantize: Array<{ table: string; pk: string }> = [
    { table: 'users', pk: 'user_id' },
    { table: 'machines', pk: 'machine_id' },
    { table: 'shifts', pk: 'shift_id' },
    { table: 'production_plans', pk: 'plan_id' },
    { table: 'production_logs', pk: 'log_id' },
    { table: 'downtime_logs', pk: 'downtime_id' },
    { table: 'activity_log', pk: 'activity_id' },
  ];

  for (const { table } of tablesToTenantize) {
    // Add tenant_id column
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'tenant_id') THEN
          ALTER TABLE ${table} ADD COLUMN tenant_id INT REFERENCES tenants(tenant_id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // J5: Add soft delete column
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'deleted_at') THEN
          ALTER TABLE ${table} ADD COLUMN deleted_at TIMESTAMPTZ;
        END IF;
      END $$;
    `);
  }

  // ─── Backfill Migration (A9-A15) ────────────────────
  // Ensure a default tenant exists for on-prem / pre-existing data
  await query(`
    INSERT INTO tenants (tenant_slug, company_name, plan, status, license_type, max_users, max_machines, is_active)
    VALUES ('default', 'Default Organization', 'ENTERPRISE', 'ACTIVE', 'onprem', -1, -1, true)
    ON CONFLICT (tenant_slug) DO NOTHING;
  `);

  const defaultTenantResult = await query<{ tenant_id: number }>(
    `SELECT tenant_id FROM tenants WHERE tenant_slug = 'default' LIMIT 1`,
  );
  const defaultTenantId = defaultTenantResult.rows[0]?.tenant_id;

  if (defaultTenantId) {
    // Backfill all rows that have NULL tenant_id
    for (const { table } of tablesToTenantize) {
      await query(`UPDATE ${table} SET tenant_id = $1 WHERE tenant_id IS NULL`, [defaultTenantId]);
    }
  }

  // Set NOT NULL on tenant_id (safe after backfill)
  // activity_log is excluded — platform-level events (login, signup) have no tenant context
  const tablesRequiringNotNull = tablesToTenantize.filter(t => t.table !== 'activity_log');
  for (const { table } of tablesRequiringNotNull) {
    await query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = '${table}' AND column_name = 'tenant_id' AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE ${table} ALTER COLUMN tenant_id SET NOT NULL;
        END IF;
      END $$;
    `);
  }

  // ─── Indexes ──────────────────────────────────────
  // Single-column tenant index
  for (const { table } of tablesToTenantize) {
    await query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id);`);
  }

  // Composite indexes: (tenant_id, pk) and (tenant_id, created_at)
  for (const { table, pk } of tablesToTenantize) {
    await query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant_pk ON ${table}(tenant_id, ${pk});`);
    // created_at exists on all tables (logged_at on production_logs is the equivalent)
    const timeCol = table === 'production_logs' ? 'logged_at' : 'created_at';
    await query(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant_time ON ${table}(tenant_id, ${timeCol});`);
  }

  // Soft-delete partial index for fast non-deleted queries
  for (const { table } of tablesToTenantize) {
    await query(`CREATE INDEX IF NOT EXISTS idx_${table}_not_deleted ON ${table}(tenant_id) WHERE deleted_at IS NULL;`);
  }

  await query(`CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(tenant_slug);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);`);

  // Ensure is_platform_admin column exists (for pre-existing tables)
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'is_platform_admin') THEN
        ALTER TABLE tenants ADD COLUMN is_platform_admin BOOLEAN DEFAULT false;
      END IF;
    END $$;
  `);

  // ─── Per-Tenant Username Uniqueness ───────────────────
  // Drop the old global UNIQUE(username) constraint so two different tenants
  // can both have a user named "admin". Replace with a per-tenant unique index
  // that only applies to non-deleted rows (soft-delete friendly).
  await query(`
    DO $$ BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username
      ON users(tenant_id, username)
      WHERE deleted_at IS NULL;
  `);

  // ─── User Preferred Locale ────────────────────────
  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_locale') THEN
        ALTER TABLE users ADD COLUMN preferred_locale VARCHAR(10) DEFAULT 'en';
      END IF;
    END $$;
  `);

  console.log('[Multi-Tenancy] ✅ Schema initialized');
}

// ─── Tenant CRUD ──────────────────────────────

function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
    + '-' + crypto.randomBytes(3).toString('hex');
}

export async function createTenant(
  companyName: string,
  plan: TenantPlan = 'FREE',
  domain?: string,
): Promise<Tenant> {
  const slug = generateSlug(companyName);
  const limits = PLAN_LIMITS[plan];

  const trialEndsAt = plan === 'FREE'
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14-day trial
    : null;

  const result = await query<Tenant>(
    `INSERT INTO tenants (tenant_slug, company_name, domain, plan, max_users, max_machines, status, trial_ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [slug, companyName, domain ?? null, plan, limits.maxUsers, limits.maxMachines,
     plan === 'FREE' ? 'TRIAL' : 'ACTIVE', trialEndsAt],
  );

  return result.rows[0];
}

export async function getTenantById(tenantId: number): Promise<Tenant | null> {
  const result = await query<Tenant>(`SELECT * FROM tenants WHERE tenant_id = $1`, [tenantId]);
  return result.rows[0] ?? null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const result = await query<Tenant>(`SELECT * FROM tenants WHERE tenant_slug = $1`, [slug]);
  return result.rows[0] ?? null;
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const result = await query<Tenant>(`SELECT * FROM tenants WHERE domain = $1`, [domain]);
  return result.rows[0] ?? null;
}

export async function getAllTenants(page = 1, limit = 25): Promise<{ tenants: Tenant[]; total: number }> {
  const offset = (page - 1) * limit;
  const [tenantsResult, countResult] = await Promise.all([
    query<Tenant>(`SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
    query<{ total: string }>(`SELECT COUNT(*) as total FROM tenants`),
  ]);
  return {
    tenants: tenantsResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? '0', 10),
  };
}

export async function updateTenant(
  tenantId: number,
  updates: Partial<Pick<Tenant, 'company_name' | 'domain' | 'logo_url' | 'status' | 'plan' | 'max_users' | 'max_machines' | 'settings' | 'is_active' | 'license_type' | 'expires_at'>>,
): Promise<Tenant | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(key === 'settings' ? JSON.stringify(value) : value);
      idx++;
    }
  }

  if (fields.length === 0) return getTenantById(tenantId);

  fields.push(`updated_at = NOW()`);
  values.push(tenantId);

  const result = await query<Tenant>(
    `UPDATE tenants SET ${fields.join(', ')} WHERE tenant_id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteTenant(tenantId: number, hard = false): Promise<boolean> {
  if (hard) {
    const result = await query(`DELETE FROM tenants WHERE tenant_id = $1`, [tenantId]);
    return (result.rowCount ?? 0) > 0;
  }
  // Soft delete: mark inactive and set status to CANCELLED
  const result = await query(
    `UPDATE tenants SET status = 'CANCELLED', is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND status != 'CANCELLED'`,
    [tenantId],
  );
  return (result.rowCount ?? 0) > 0;
}

// ─── Tenant-User Association ──────────────────

export async function addUserToTenant(
  tenantId: number,
  userId: number,
  isTenantAdmin = false,
): Promise<TenantUser> {
  // Also stamp the tenant_id on the users table row
  await query(`UPDATE users SET tenant_id = $1 WHERE user_id = $2`, [tenantId, userId]);

  const result = await query<TenantUser>(
    `INSERT INTO tenant_users (tenant_id, user_id, is_tenant_admin)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id) DO UPDATE SET is_tenant_admin = $3
     RETURNING *`,
    [tenantId, userId, isTenantAdmin],
  );
  return result.rows[0];
}

export async function removeUserFromTenant(tenantId: number, userId: number): Promise<void> {
  await query(`DELETE FROM tenant_users WHERE tenant_id = $1 AND user_id = $2`, [tenantId, userId]);
  await query(`UPDATE users SET tenant_id = NULL WHERE user_id = $1 AND tenant_id = $2`, [userId, tenantId]);
}

export async function getTenantUsers(tenantId: number): Promise<any[]> {
  const result = await query(
    `SELECT u.user_id, u.username, u.full_name, u.role, u.is_active, tu.is_tenant_admin, tu.joined_at
     FROM tenant_users tu
     JOIN users u ON u.user_id = tu.user_id
     WHERE tu.tenant_id = $1
     ORDER BY tu.joined_at`,
    [tenantId],
  );
  return result.rows;
}

export async function getUserTenant(userId: number): Promise<Tenant | null> {
  const result = await query<Tenant>(
    `SELECT t.* FROM tenants t
     JOIN tenant_users tu ON tu.tenant_id = t.tenant_id
     WHERE tu.user_id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function getTenantUsage(tenantId: number): Promise<{
  usersCount: number;
  machinesCount: number;
  plansCount: number;
  logsCount: number;
}> {
  const [users, machines, plans, logs] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT COUNT(*) as count FROM machines WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT COUNT(*) as count FROM production_plans WHERE tenant_id = $1`, [tenantId]),
    query(`SELECT COUNT(*) as count FROM production_logs WHERE tenant_id = $1`, [tenantId]),
  ]);

  return {
    usersCount: parseInt(users.rows[0]?.count ?? '0', 10),
    machinesCount: parseInt(machines.rows[0]?.count ?? '0', 10),
    plansCount: parseInt(plans.rows[0]?.count ?? '0', 10),
    logsCount: parseInt(logs.rows[0]?.count ?? '0', 10),
  };
}

// ─── Provisioning ─────────────────────────────
// Creates a tenant, first admin user, and default shifts

export async function provisionTenant(
  companyName: string,
  adminUsername: string,
  adminPassword: string,
  adminFullName: string,
  plan: TenantPlan = 'FREE',
  domain?: string,
  slug?: string,
  trialDays?: number,
  contactEmail?: string,
  contactPhone?: string,
): Promise<{ tenant: Tenant; adminUserId: number }> {
  return transaction(async (client) => {
    // 1. Create tenant
    // If trialDays is provided (e.g. from plan config), use it; otherwise read from TRIAL_DAYS env var
    const defaultTrialDays = parseInt(process.env.TRIAL_DAYS || '14', 10);
    const effectiveTrialDays = trialDays ?? (plan === 'FREE' ? defaultTrialDays : 0);
    const isTrial = effectiveTrialDays > 0;
    const trialEndsAt = isTrial
      ? new Date(Date.now() + effectiveTrialDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const tenantResult = await client.query<Tenant>(
      `INSERT INTO tenants (tenant_slug, company_name, domain, plan, max_users, max_machines, status, trial_ends_at, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        slug || generateSlug(companyName),
        companyName,
        domain ?? null,
        plan,
        PLAN_LIMITS[plan].maxUsers,
        PLAN_LIMITS[plan].maxMachines,
        isTrial ? 'TRIAL' : 'ACTIVE',
        trialEndsAt,
        contactEmail ?? null,
        contactPhone ?? null,
      ],
    );
    const tenant = tenantResult.rows[0];

    // 2. Hash password (bcryptjs)
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // 3. Create admin user
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash, full_name, role, tenant_id)
       VALUES ($1, $2, $3, 'ADMIN', $4)
       RETURNING user_id`,
      [adminUsername, passwordHash, adminFullName, tenant.tenant_id],
    );
    const adminUserId = userResult.rows[0].user_id;

    // 4. Link user to tenant
    await client.query(
      `INSERT INTO tenant_users (tenant_id, user_id, is_tenant_admin) VALUES ($1, $2, true)`,
      [tenant.tenant_id, adminUserId],
    );

    // 5. Shifts are NOT auto-created — the user chooses 2 or 3 shifts from the Shifts page.

    return { tenant, adminUserId };
  });
}

// ─── Tenant Validation ────────────────────────

export async function validateTenantLimits(
  tenantId: number,
  resource: 'users' | 'machines',
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return { allowed: false, current: 0, limit: 0 };

  const maxField = resource === 'users' ? 'max_users' : 'max_machines';
  const limit = tenant[maxField];

  // -1 = unlimited
  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const table = resource === 'users' ? 'tenant_users' : 'machines';
  const countResult = await query(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = $1`, [tenantId]);
  const current = parseInt(countResult.rows[0]?.count ?? '0', 10);

  return { allowed: current < limit, current, limit };
}

export async function isTenantActive(tenantId: number): Promise<boolean> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return false;

  // Explicit is_active flag takes priority
  if (tenant.is_active === false) return false;

  // Check subscription / license expiry
  if (tenant.expires_at && new Date(tenant.expires_at) <= new Date()) return false;

  if (tenant.status === 'ACTIVE') return true;
  if (tenant.status === 'TRIAL' && tenant.trial_ends_at) {
    return new Date(tenant.trial_ends_at) > new Date();
  }
  return false;
}

// ─── G6: In-Memory Tenant Settings Cache ──────

interface CacheEntry {
  tenant: Tenant;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const tenantCache = new Map<number, CacheEntry>();

/** Get tenant by ID with in-memory caching (G6) */
export async function getCachedTenant(tenantId: number): Promise<Tenant | null> {
  const cached = tenantCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const tenant = await getTenantById(tenantId);
  if (tenant) {
    tenantCache.set(tenantId, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
  } else {
    tenantCache.delete(tenantId);
  }
  return tenant;
}

/** Invalidate a specific tenant's cache (call after updates) */
export function invalidateTenantCache(tenantId: number): void {
  tenantCache.delete(tenantId);
}

/** Clear the entire tenant cache */
export function clearTenantCache(): void {
  tenantCache.clear();
}

// ─── DB-Backed Plan Features Cache ────────────

interface PlanFeaturesCache {
  data: Record<string, string[]>;
  expiresAt: number;
}

let planFeaturesCache: PlanFeaturesCache | null = null;
const PLAN_FEATURES_CACHE_TTL = 30_000; // 30 seconds

/**
 * Fetch plan features from subscription_plans table with caching.
 * Falls back to hardcoded PLAN_LIMITS if the table doesn't exist yet.
 */
export async function getDbPlanFeatures(): Promise<Record<string, string[]>> {
  if (planFeaturesCache && planFeaturesCache.expiresAt > Date.now()) {
    return planFeaturesCache.data;
  }

  try {
    const result = await query(
      `SELECT tenant_plan, features FROM subscription_plans WHERE is_active = true ORDER BY base_price_monthly`,
    );
    if (result.rows.length > 0) {
      const data: Record<string, string[]> = {};
      for (const row of result.rows) {
        const features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features;
        data[row.tenant_plan] = Array.isArray(features) ? features : [];
      }
      planFeaturesCache = { data, expiresAt: Date.now() + PLAN_FEATURES_CACHE_TTL };
      return data;
    }
  } catch {
    // Table may not exist yet during bootstrap
  }

  // Fallback to hardcoded
  const fallback: Record<string, string[]> = {};
  for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
    fallback[plan] = limits.features;
  }
  return fallback;
}

/** Invalidate the plan features cache (call after admin updates a plan). */
export function invalidatePlanFeaturesCache(): void {
  planFeaturesCache = null;
}

/**
 * Get features for a specific plan, reading from DB first, falling back to hardcoded.
 */
export async function getPlanFeaturesForPlan(plan: string): Promise<string[]> {
  const allPlans = await getDbPlanFeatures();
  return allPlans[plan] ?? PLAN_LIMITS[plan as TenantPlan]?.features ?? [];
}

// ─── G2: Per-Tenant Feature Flag Overrides ────

/**
 * Check if a feature is enabled for a specific tenant.
 * Uses tenant's `settings.featureOverrides` for per-tenant overrides,
 * falls back to plan-level feature list from DB, then hardcoded PLAN_LIMITS.
 */
export async function isTenantFeatureEnabled(tenant: Tenant, featureId: string): Promise<boolean> {
  // Check per-tenant override first
  const overrides = (tenant.settings as TenantSettings)?.featureOverrides;
  if (overrides && featureId in overrides) {
    return overrides[featureId];
  }

  // Fall back to DB-backed plan features, then hardcoded
  const planFeatures = await getPlanFeaturesForPlan(tenant.plan);
  return planFeatures.includes(featureId);
}