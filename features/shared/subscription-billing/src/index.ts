/**
 * FactoryOS Subscription Billing Core
 *
 * Manages SaaS subscription plans, billing cycles, invoices, and usage metering.
 *
 * Tables:
 *   subscription_plans   — Available plan tiers & pricing
 *   subscriptions        — Active tenant subscriptions
 *   invoices             — Billing history / invoices
 *   usage_records        — Monthly usage snapshots for metering
 *
 * Pricing model (from master plan):
 *   ₹999/machine/month
 *   ₹299/user/month
 *   Annual plans with discount
 */

import { query, transaction } from '@zipybills/factory-database-config';
import { getTenantById, updateTenant, getTenantUsage, type TenantPlan } from '@zipybills/factory-multi-tenancy';

// ─── Types ────────────────────────────────────

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED' | 'TRIAL';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';

export interface SubscriptionPlan {
  plan_id: number;
  plan_code: string;
  plan_name: string;
  tenant_plan: TenantPlan;
  base_price_monthly: number;
  price_per_machine: number;
  price_per_user: number;
  max_machines: number;
  max_users: number;
  features: string[];
  is_active: boolean;
  trial_days: number;
  description: string;
  created_at: string;
}

export interface Subscription {
  subscription_id: number;
  tenant_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  auto_renew: boolean;
  payment_method: string | null;
  external_subscription_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  invoice_id: number;
  tenant_id: number;
  subscription_id: number | null;
  invoice_number: string;
  status: InvoiceStatus;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
  line_items: any[];
  notes: string | null;
  created_at: string;
}

export interface UsageRecord {
  usage_id: number;
  tenant_id: number;
  month: string;
  machines_count: number;
  users_count: number;
  plans_count: number;
  logs_count: number;
  api_calls: number;
  storage_mb: number;
  recorded_at: string;
}

// ─── Schema ───────────────────────────────────

export async function initializeSubscriptionSchema(): Promise<void> {
  console.log('[Subscription] Initializing schema...');

  await query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      plan_id              SERIAL PRIMARY KEY,
      plan_code            VARCHAR(50) UNIQUE NOT NULL,
      plan_name            VARCHAR(200) NOT NULL,
      tenant_plan          VARCHAR(20) NOT NULL
                           CHECK (tenant_plan IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
      base_price_monthly   NUMERIC(10,2) DEFAULT 0,
      price_per_machine    NUMERIC(10,2) DEFAULT 999,
      price_per_user       NUMERIC(10,2) DEFAULT 299,
      max_machines         INT DEFAULT 2,
      max_users            INT DEFAULT 3,
      features             JSONB DEFAULT '[]',
      is_active            BOOLEAN DEFAULT true,
      trial_days           INT DEFAULT 14,
      description          TEXT,
      created_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      subscription_id          SERIAL PRIMARY KEY,
      tenant_id                INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      plan_id                  INT NOT NULL REFERENCES subscription_plans(plan_id),
      status                   VARCHAR(20) DEFAULT 'TRIAL'
                               CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED', 'TRIAL')),
      billing_cycle            VARCHAR(20) DEFAULT 'MONTHLY'
                               CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
      current_period_start     TIMESTAMPTZ DEFAULT NOW(),
      current_period_end       TIMESTAMPTZ,
      amount                   NUMERIC(12,2) DEFAULT 0,
      currency                 VARCHAR(10) DEFAULT 'INR',
      auto_renew               BOOLEAN DEFAULT true,
      payment_method           VARCHAR(100),
      external_subscription_id VARCHAR(255),
      cancelled_at             TIMESTAMPTZ,
      created_at               TIMESTAMPTZ DEFAULT NOW(),
      updated_at               TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoice_id           SERIAL PRIMARY KEY,
      tenant_id            INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      subscription_id      INT REFERENCES subscriptions(subscription_id),
      invoice_number       VARCHAR(50) UNIQUE NOT NULL,
      status               VARCHAR(20) DEFAULT 'DRAFT'
                           CHECK (status IN ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED')),
      amount               NUMERIC(12,2) NOT NULL,
      tax_amount            NUMERIC(12,2) DEFAULT 0,
      total_amount         NUMERIC(12,2) NOT NULL,
      currency             VARCHAR(10) DEFAULT 'INR',
      billing_period_start TIMESTAMPTZ,
      billing_period_end   TIMESTAMPTZ,
      due_date             TIMESTAMPTZ NOT NULL,
      paid_at              TIMESTAMPTZ,
      line_items           JSONB DEFAULT '[]',
      notes                TEXT,
      created_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usage_records (
      usage_id        SERIAL PRIMARY KEY,
      tenant_id       INT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      month           VARCHAR(7) NOT NULL,
      machines_count  INT DEFAULT 0,
      users_count     INT DEFAULT 0,
      plans_count     INT DEFAULT 0,
      logs_count      INT DEFAULT 0,
      api_calls       INT DEFAULT 0,
      storage_mb      NUMERIC(10,2) DEFAULT 0,
      recorded_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (tenant_id, month)
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_usage_records_tenant ON usage_records(tenant_id);`);

  // Seed default plans if not exists
  await seedDefaultPlans();

  console.log('[Subscription] ✅ Schema initialized');
}

// ─── Default Plans ────────────────────────────

// ─── Env-configurable plan defaults ───────────
// Override any plan limit/feature via environment variables so DB resets
// don't lose configuration.  Format:
//   PLAN_<TIER>_MAX_MACHINES, PLAN_<TIER>_MAX_USERS, PLAN_<TIER>_BASE_PRICE,
//   PLAN_<TIER>_PRICE_MACHINE, PLAN_<TIER>_PRICE_USER,
//   PLAN_<TIER>_FEATURES (comma-separated)
//   TRIAL_DAYS — shared trial period for FREE & ENTERPRISE plans
// e.g. PLAN_FREE_MAX_MACHINES=5  TRIAL_DAYS=14

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v !== undefined ? parseInt(v, 10) : fallback;
}

function envFeatures(key: string, fallback: string[]): string[] {
  const v = process.env[key];
  return v ? v.split(',').map((f) => f.trim()) : fallback;
}

async function seedDefaultPlans(): Promise<void> {
  const existing = await query(`SELECT COUNT(*) as count FROM subscription_plans`);
  if (parseInt(existing.rows[0].count, 10) > 0) return;

  const plans = [
    {
      code: 'free',
      name: 'Free Trial',
      tenantPlan: 'FREE',
      basePrice: envInt('PLAN_FREE_BASE_PRICE', 0),
      priceMachine: envInt('PLAN_FREE_PRICE_MACHINE', 0),
      priceUser: envInt('PLAN_FREE_PRICE_USER', 0),
      maxMachines: envInt('PLAN_FREE_MAX_MACHINES', 2),
      maxUsers: envInt('PLAN_FREE_MAX_USERS', 3),
      features: envFeatures('PLAN_FREE_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'dashboard']),
      trialDays: envInt('TRIAL_DAYS', 14),
      desc: 'Get started with basic production monitoring. 2 machines, 3 users, 14-day trial.',
    },
    {
      code: 'starter',
      name: 'Starter',
      tenantPlan: 'STARTER',
      basePrice: envInt('PLAN_STARTER_BASE_PRICE', 4999),
      priceMachine: envInt('PLAN_STARTER_PRICE_MACHINE', 499),
      priceUser: envInt('PLAN_STARTER_PRICE_USER', 199),
      maxMachines: envInt('PLAN_STARTER_MAX_MACHINES', 10),
      maxUsers: envInt('PLAN_STARTER_MAX_USERS', 10),
      features: envFeatures('PLAN_STARTER_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports']),
      trialDays: envInt('PLAN_STARTER_TRIAL_DAYS', 0),
      desc: 'For small factories. Up to 10 machines with downtime tracking and reports.',
    },
    {
      code: 'professional',
      name: 'Professional',
      tenantPlan: 'PROFESSIONAL',
      basePrice: envInt('PLAN_PROFESSIONAL_BASE_PRICE', 14999),
      priceMachine: envInt('PLAN_PROFESSIONAL_PRICE_MACHINE', 999),
      priceUser: envInt('PLAN_PROFESSIONAL_PRICE_USER', 299),
      maxMachines: envInt('PLAN_PROFESSIONAL_MAX_MACHINES', 30),
      maxUsers: envInt('PLAN_PROFESSIONAL_MAX_USERS', 50),
      features: envFeatures('PLAN_PROFESSIONAL_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme']),
      trialDays: envInt('PLAN_PROFESSIONAL_TRIAL_DAYS', 0),
      desc: 'Full production monitoring suite with export, audit, and theming.',
    },
    {
      code: 'enterprise',
      name: 'Enterprise',
      tenantPlan: 'ENTERPRISE',
      basePrice: envInt('PLAN_ENTERPRISE_BASE_PRICE', 49999),
      priceMachine: envInt('PLAN_ENTERPRISE_PRICE_MACHINE', 799),
      priceUser: envInt('PLAN_ENTERPRISE_PRICE_USER', 249),
      maxMachines: envInt('PLAN_ENTERPRISE_MAX_MACHINES', -1),
      maxUsers: envInt('PLAN_ENTERPRISE_MAX_USERS', -1),
      features: envFeatures('PLAN_ENTERPRISE_FEATURES', ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme', 'backups', 'admin', 'license', 'permissions']),
      trialDays: envInt('TRIAL_DAYS', 14),
      desc: 'Unlimited machines and users with all features. Priority support. 14-day free trial.',
    },
  ];

  for (const p of plans) {
    await query(
      `INSERT INTO subscription_plans (plan_code, plan_name, tenant_plan, base_price_monthly, price_per_machine, price_per_user, max_machines, max_users, features, trial_days, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (plan_code) DO NOTHING`,
      [p.code, p.name, p.tenantPlan, p.basePrice, p.priceMachine, p.priceUser, p.maxMachines, p.maxUsers, JSON.stringify(p.features), p.trialDays, p.desc],
    );
  }
}

// ─── Plan Queries ─────────────────────────────

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const result = await query<SubscriptionPlan>(
    `SELECT * FROM subscription_plans WHERE is_active = true ORDER BY base_price_monthly`,
  );
  return result.rows;
}

export async function getPlanByCode(code: string): Promise<SubscriptionPlan | null> {
  const result = await query<SubscriptionPlan>(
    `SELECT * FROM subscription_plans WHERE plan_code = $1`,
    [code],
  );
  return result.rows[0] ?? null;
}

// ─── Subscription CRUD ────────────────────────

export async function createSubscription(
  tenantId: number,
  planId: number,
  billingCycle: BillingCycle = 'MONTHLY',
): Promise<Subscription> {
  const plan = await query<SubscriptionPlan>(
    `SELECT * FROM subscription_plans WHERE plan_id = $1`,
    [planId],
  );
  if (!plan.rows[0]) throw new Error('Plan not found');

  const p = plan.rows[0];

  // Calculate amount based on billing cycle
  let amount = p.base_price_monthly;
  const cycleMult = billingCycle === 'ANNUAL' ? 10 : billingCycle === 'QUARTERLY' ? 2.7 : 1;
  const months = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
  amount = Math.round(p.base_price_monthly * cycleMult * 100) / 100; // annual = 10 months price (2 free)

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const status: SubscriptionStatus = p.trial_days > 0 ? 'TRIAL' : 'ACTIVE';

  const result = await query<Subscription>(
    `INSERT INTO subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_end, amount, currency)
     VALUES ($1, $2, $3, $4, $5, $6, 'INR')
     RETURNING *`,
    [tenantId, planId, status, billingCycle, periodEnd.toISOString(), amount],
  );

  // Update tenant with plan limits
  await updateTenant(tenantId, {
    plan: p.tenant_plan as any,
    max_users: p.max_users,
    max_machines: p.max_machines,
  });

  return result.rows[0];
}

export async function getSubscription(tenantId: number): Promise<(Subscription & { plan?: SubscriptionPlan }) | null> {
  const result = await query(
    `SELECT s.*, sp.plan_code, sp.plan_name, sp.base_price_monthly, sp.price_per_machine,
            sp.price_per_user, sp.max_machines as plan_max_machines, sp.max_users as plan_max_users,
            sp.features, sp.description as plan_description
     FROM subscriptions s
     LEFT JOIN subscription_plans sp ON sp.plan_id = s.plan_id
     WHERE s.tenant_id = $1
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [tenantId],
  );
  return result.rows[0] ?? null;
}

export async function cancelSubscription(tenantId: number): Promise<Subscription | null> {
  const result = await query<Subscription>(
    `UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW()
     WHERE tenant_id = $1 AND status IN ('ACTIVE', 'TRIAL', 'PAST_DUE')
     RETURNING *`,
    [tenantId],
  );

  if (result.rows[0]) {
    await updateTenant(tenantId, { status: 'CANCELLED' });
  }

  return result.rows[0] ?? null;
}

export async function changePlan(
  tenantId: number,
  newPlanCode: string,
  billingCycle?: BillingCycle,
): Promise<Subscription> {
  const plan = await getPlanByCode(newPlanCode);
  if (!plan) throw new Error(`Plan "${newPlanCode}" not found`);

  // Cancel existing subscription
  await query(
    `UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = NOW() WHERE tenant_id = $1 AND status IN ('ACTIVE', 'TRIAL')`,
    [tenantId],
  );

  // Create new subscription
  return createSubscription(tenantId, plan.plan_id, billingCycle);
}

// ─── Invoice Management ──────────────────────

function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${dateStr}-${rand}`;
}

export async function generateInvoice(
  tenantId: number,
  subscriptionId: number,
): Promise<Invoice> {
  const sub = await query<Subscription>(
    `SELECT s.*, sp.* FROM subscriptions s
     JOIN subscription_plans sp ON sp.plan_id = s.plan_id
     WHERE s.subscription_id = $1`,
    [subscriptionId],
  );

  if (!sub.rows[0]) throw new Error('Subscription not found');
  const s = sub.rows[0] as any;

  // Get current usage for metered billing
  const usage = await getTenantUsage(tenantId);

  // Calculate line items
  const lineItems = [
    { description: `${s.plan_name} - Base fee`, quantity: 1, unitPrice: parseFloat(s.base_price_monthly), amount: parseFloat(s.base_price_monthly) },
  ];

  // Per-machine billing
  if (parseFloat(s.price_per_machine) > 0 && usage.machinesCount > 0) {
    const machineCharge = usage.machinesCount * parseFloat(s.price_per_machine);
    lineItems.push({
      description: `Machine usage (${usage.machinesCount} machines × ₹${s.price_per_machine}/mo)`,
      quantity: usage.machinesCount,
      unitPrice: parseFloat(s.price_per_machine),
      amount: machineCharge,
    });
  }

  // Per-user billing
  if (parseFloat(s.price_per_user) > 0 && usage.usersCount > 0) {
    const userCharge = usage.usersCount * parseFloat(s.price_per_user);
    lineItems.push({
      description: `User licenses (${usage.usersCount} users × ₹${s.price_per_user}/mo)`,
      quantity: usage.usersCount,
      unitPrice: parseFloat(s.price_per_user),
      amount: userCharge,
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0.18; // 18% GST
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15); // Net-15

  const result = await query<Invoice>(
    `INSERT INTO invoices (tenant_id, subscription_id, invoice_number, status, amount, tax_amount, total_amount, currency, billing_period_start, billing_period_end, due_date, line_items)
     VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, 'INR', $7, $8, $9, $10)
     RETURNING *`,
    [
      tenantId, subscriptionId, generateInvoiceNumber(),
      subtotal, taxAmount, totalAmount,
      s.current_period_start, s.current_period_end,
      dueDate.toISOString(), JSON.stringify(lineItems),
    ],
  );

  return result.rows[0];
}

export async function getInvoices(tenantId: number, page = 1, limit = 20): Promise<{ invoices: Invoice[]; total: number }> {
  const offset = (page - 1) * limit;
  const [invoicesResult, countResult] = await Promise.all([
    query<Invoice>(
      `SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    ),
    query<{ total: string }>(`SELECT COUNT(*) as total FROM invoices WHERE tenant_id = $1`, [tenantId]),
  ]);
  return {
    invoices: invoicesResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? '0', 10),
  };
}

export async function markInvoicePaid(invoiceId: number): Promise<Invoice | null> {
  const result = await query<Invoice>(
    `UPDATE invoices SET status = 'PAID', paid_at = NOW() WHERE invoice_id = $1 RETURNING *`,
    [invoiceId],
  );
  return result.rows[0] ?? null;
}

// ─── Usage Metering ───────────────────────────

export async function recordUsage(tenantId: number): Promise<UsageRecord> {
  const usage = await getTenantUsage(tenantId);
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const result = await query<UsageRecord>(
    `INSERT INTO usage_records (tenant_id, month, machines_count, users_count, plans_count, logs_count)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, month) DO UPDATE SET
       machines_count = GREATEST(usage_records.machines_count, $3),
       users_count = GREATEST(usage_records.users_count, $4),
       plans_count = $5,
       logs_count = $6,
       recorded_at = NOW()
     RETURNING *`,
    [tenantId, month, usage.machinesCount, usage.usersCount, usage.plansCount, usage.logsCount],
  );

  return result.rows[0];
}

export async function getUsageHistory(tenantId: number, months = 12): Promise<UsageRecord[]> {
  const result = await query<UsageRecord>(
    `SELECT * FROM usage_records WHERE tenant_id = $1 ORDER BY month DESC LIMIT $2`,
    [tenantId, months],
  );
  return result.rows;
}
