/**
 * FactoryOS SaaS Dashboard – Core analytics
 *
 * Platform-wide metrics for the SaaS operator:
 *   - Total tenants, active/trial/churned
 *   - MRR / ARR calculations
 *   - User & machine counts across tenants
 *   - Growth trend (signups per month)
 *   - Feature adoption rates
 *   - System health overview
 */

import { query } from '@zipybills/factory-database-config';

// ─── Types ────────────────────────────────────

export interface PlatformOverview {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
  };
  users: {
    total: number;
    active: number;
  };
  machines: {
    total: number;
    active: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
  };
}

export interface TenantSummary {
  tenant_id: number;
  company_name: string;
  slug: string;
  plan: string;
  status: string;
  users_count: number;
  machines_count: number;
  created_at: string;
  last_activity: string | null;
}

export interface GrowthMetric {
  month: string;
  new_tenants: number;
  churned_tenants: number;
  new_users: number;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
}

// ─── Queries ──────────────────────────────────

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [tenantStats, userStats, machineStats, revenueStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'TRIAL') as trial,
        COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM tenants
      WHERE tenant_slug NOT IN ('default', 'platform')
    `),
    query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM users
    `),
    query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active
      FROM machines
    `),
    query(`
      SELECT
        COALESCE(SUM(amount), 0) as mrr
      FROM subscriptions
      WHERE status IN ('ACTIVE', 'TRIAL')
        AND billing_cycle = 'MONTHLY'
    `),
  ]);

  // Invoice totals
  const invoiceStats = await query(`
    SELECT
      COALESCE(SUM(total_amount), 0) as total_invoiced,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'PAID'), 0) as total_paid,
      COALESCE(SUM(total_amount) FILTER (WHERE status IN ('PENDING', 'OVERDUE')), 0) as outstanding
    FROM invoices
  `);

  const mrr = parseFloat(revenueStats.rows[0]?.mrr ?? '0');

  return {
    tenants: {
      total: parseInt(tenantStats.rows[0]?.total ?? '0', 10),
      active: parseInt(tenantStats.rows[0]?.active ?? '0', 10),
      trial: parseInt(tenantStats.rows[0]?.trial ?? '0', 10),
      suspended: parseInt(tenantStats.rows[0]?.suspended ?? '0', 10),
      cancelled: parseInt(tenantStats.rows[0]?.cancelled ?? '0', 10),
    },
    users: {
      total: parseInt(userStats.rows[0]?.total ?? '0', 10),
      active: parseInt(userStats.rows[0]?.active ?? '0', 10),
    },
    machines: {
      total: parseInt(machineStats.rows[0]?.total ?? '0', 10),
      active: parseInt(machineStats.rows[0]?.active ?? '0', 10),
    },
    revenue: {
      mrr,
      arr: mrr * 12,
      totalInvoiced: parseFloat(invoiceStats.rows[0]?.total_invoiced ?? '0'),
      totalPaid: parseFloat(invoiceStats.rows[0]?.total_paid ?? '0'),
      outstanding: parseFloat(invoiceStats.rows[0]?.outstanding ?? '0'),
    },
  };
}

export async function getTenantsSummary(page = 1, limit = 50): Promise<{ tenants: TenantSummary[]; total: number }> {
  const offset = (page - 1) * limit;

  const [tenantsResult, countResult] = await Promise.all([
    query<TenantSummary>(
      `SELECT
        t.tenant_id, t.company_name, t.tenant_slug as slug, t.plan, t.status, t.created_at,
        (SELECT COUNT(*) FROM tenant_users tu WHERE tu.tenant_id = t.tenant_id) as users_count,
        (SELECT COUNT(*) FROM machines m WHERE m.tenant_id = t.tenant_id) as machines_count,
        (SELECT MAX(al.created_at) FROM activity_log al
         WHERE al.user_id IN (SELECT tu2.user_id FROM tenant_users tu2 WHERE tu2.tenant_id = t.tenant_id)
        ) as last_activity
      FROM tenants t
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    query<{ total: string }>(`SELECT COUNT(*) as total FROM tenants`),
  ]);

  return {
    tenants: tenantsResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? '0', 10),
  };
}

export async function getGrowthMetrics(months = 12): Promise<GrowthMetric[]> {
  const result = await query<GrowthMetric>(
    `SELECT
      TO_CHAR(date_trunc('month', t.created_at), 'YYYY-MM') as month,
      COUNT(*) as new_tenants,
      0 as churned_tenants,
      COALESCE(
        (SELECT COUNT(*) FROM users u
         JOIN tenant_users tu ON tu.user_id = u.user_id AND tu.tenant_id = t.tenant_id
         WHERE TO_CHAR(u.created_at, 'YYYY-MM') = TO_CHAR(date_trunc('month', t.created_at), 'YYYY-MM')
        ), 0
      ) as new_users
    FROM tenants t
    WHERE t.created_at >= NOW() - INTERVAL '${months} months'
    GROUP BY month, t.tenant_id
    ORDER BY month DESC`,
  );

  // Aggregate by month
  const byMonth: Record<string, GrowthMetric> = {};
  for (const row of result.rows) {
    if (!byMonth[row.month]) {
      byMonth[row.month] = { month: row.month, new_tenants: 0, churned_tenants: 0, new_users: 0 };
    }
    byMonth[row.month].new_tenants += Number(row.new_tenants);
    byMonth[row.month].new_users += Number(row.new_users);
  }

  // Add churn data
  const churnResult = await query(
    `SELECT
      TO_CHAR(cancelled_at, 'YYYY-MM') as month,
      COUNT(*) as churned
    FROM subscriptions
    WHERE cancelled_at IS NOT NULL
      AND cancelled_at >= NOW() - INTERVAL '${months} months'
    GROUP BY month`,
  );

  for (const row of churnResult.rows) {
    if (byMonth[row.month]) {
      byMonth[row.month].churned_tenants = Number(row.churned);
    }
  }

  return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
}

export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const result = await query(
    `SELECT plan, COUNT(*) as count FROM tenants GROUP BY plan ORDER BY count DESC`,
  );

  const total = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count, 10), 0);

  return result.rows.map((row: any) => ({
    plan: row.plan,
    count: parseInt(row.count, 10),
    percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 1000) / 10 : 0,
  }));
}

export async function getSystemHealth(): Promise<Record<string, any>> {
  const [dbSize, tableStats, connectionStats] = await Promise.all([
    query(`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size`),
    query(`
      SELECT relname as table_name,
             n_live_tup as row_count
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 15
    `),
    query(`
      SELECT count(*) as active_connections,
             max_conn::int as max_connections
      FROM pg_stat_activity, (SELECT setting as max_conn FROM pg_settings WHERE name = 'max_connections') mc
      GROUP BY max_conn
    `),
  ]);

  return {
    database: {
      size: dbSize.rows[0]?.db_size,
      tables: tableStats.rows,
      connections: {
        active: parseInt(connectionStats.rows[0]?.active_connections ?? '0', 10),
        max: parseInt(connectionStats.rows[0]?.max_connections ?? '100', 10),
      },
    },
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
  };
}
