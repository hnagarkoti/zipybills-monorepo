/**
 * FactoryOS Super Admin Panel — Enterprise Module
 *
 * Platform-level administration for multi-tenant SaaS:
 * - Multi-tenant overview dashboard
 * - Revenue & usage analytics
 * - Tenant lifecycle management (create, suspend, activate, archive)
 * - Admin impersonation (login as tenant)
 * - Usage metering & limits
 * - Infrastructure health monitoring
 * - Global announcements & notifications
 * - Platform configuration
 */

import { Router } from 'express';
import { query, getPool } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export const superAdminRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'factoryos-secret';

// ─── Middleware ────────────────────────────────

function requirePlatformAdmin(req: any, res: any, next: any) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.is_platform_admin) {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
}

const platformGuard = [requireAuth, requirePlatformAdmin];

// ─── Schema ───────────────────────────────────

export async function initializeSuperAdminSchema(): Promise<void> {
  // Tenant usage metering
  await query(`
    CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
      metric_id     SERIAL PRIMARY KEY,
      tenant_id     INT NOT NULL,
      metric_type   VARCHAR(50) NOT NULL,
      metric_value  NUMERIC DEFAULT 0,
      period_start  DATE NOT NULL,
      period_end    DATE NOT NULL,
      recorded_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(tenant_id, metric_type, period_start)
    );
  `);

  // Platform announcements
  await query(`
    CREATE TABLE IF NOT EXISTS platform_announcements (
      announcement_id  SERIAL PRIMARY KEY,
      title            VARCHAR(255) NOT NULL,
      message          TEXT NOT NULL,
      severity         VARCHAR(20) DEFAULT 'INFO'
                       CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'MAINTENANCE')),
      target_tenants   INT[] DEFAULT '{}',
      is_active        BOOLEAN DEFAULT true,
      starts_at        TIMESTAMPTZ DEFAULT NOW(),
      expires_at       TIMESTAMPTZ,
      created_by       INT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Admin impersonation log (security-critical audit)
  await query(`
    CREATE TABLE IF NOT EXISTS impersonation_log (
      impersonation_id  SERIAL PRIMARY KEY,
      admin_user_id     INT NOT NULL,
      target_tenant_id  INT NOT NULL,
      target_user_id    INT,
      reason            TEXT NOT NULL,
      ip_address        VARCHAR(45),
      started_at        TIMESTAMPTZ DEFAULT NOW(),
      ended_at          TIMESTAMPTZ,
      actions_taken     JSONB DEFAULT '[]'
    );
  `);

  // Tenant limits
  await query(`
    CREATE TABLE IF NOT EXISTS tenant_limits (
      tenant_id          INT PRIMARY KEY,
      max_users          INT DEFAULT 50,
      max_machines       INT DEFAULT 100,
      max_storage_mb     INT DEFAULT 5120,
      max_api_calls_day  INT DEFAULT 10000,
      custom_limits      JSONB DEFAULT '{}',
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant ON tenant_usage_metrics(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_usage_metrics_period ON tenant_usage_metrics(period_start, period_end);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON impersonation_log(admin_user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_announcements_active ON platform_announcements(is_active) WHERE is_active = true;`);

  console.log('[SuperAdmin] ✅ Super admin schema initialized');
}

// ─── Platform Overview Dashboard ──────────────

superAdminRouter.get('/super-admin/dashboard', ...platformGuard, async (_req, res) => {
  try {
    const [
      tenantStats,
      revenueStats,
      userStats,
      systemHealth,
      recentActivity,
    ] = await Promise.all([
      // Tenant overview
      query(`
        SELECT
          COUNT(*) as total_tenants,
          COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
          COUNT(*) FILTER (WHERE status = 'trial') as trial_tenants,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_tenants_30d
        FROM tenants
      `).catch(() => ({ rows: [{ total_tenants: 0, active_tenants: 0, suspended_tenants: 0, trial_tenants: 0, new_tenants_30d: 0 }] })),

      // Revenue
      query(`
        SELECT
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as revenue_30d,
          COALESCE(AVG(amount), 0) as avg_revenue_per_tenant
        FROM billing_invoices
        WHERE status = 'paid'
      `).catch(() => ({ rows: [{ total_revenue: 0, revenue_30d: 0, avg_revenue_per_tenant: 0 }] })),

      // Platform-wide user stats
      query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(DISTINCT tenant_id) as tenants_with_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_7d
        FROM users
      `),

      // System health
      query(`SELECT pg_database_size(current_database()) as db_size`),

      // Recent tenant activity (last 24h)
      query(`
        SELECT tenant_id, COUNT(*) as action_count
        FROM activity_log
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY tenant_id
        ORDER BY action_count DESC
        LIMIT 10
      `).catch(() => ({ rows: [] })),
    ]);

    res.json({
      success: true,
      dashboard: {
        tenants: tenantStats.rows[0],
        revenue: revenueStats.rows[0],
        users: userStats.rows[0],
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          dbSizeBytes: parseInt(systemHealth.rows[0]?.db_size ?? '0', 10),
        },
        topActiveTenants: recentActivity.rows,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[SuperAdmin] Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load super admin dashboard' });
  }
});

// ─── Tenant Management ────────────────────────

/** List all tenants with details */
superAdminRouter.get('/super-admin/tenants', ...platformGuard, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let where = `WHERE t.tenant_slug NOT IN ('default', 'platform')`;
    const params: any[] = [];

    if (status) {
      params.push(status);
      where += ` AND t.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (t.company_name ILIKE $${params.length} OR t.subdomain ILIKE $${params.length})`;
    }

    const [tenantsResult, countResult] = await Promise.all([
      query(`
        SELECT t.*,
          (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.tenant_id) as user_count,
          (SELECT COUNT(*) FROM machines m WHERE m.tenant_id = t.tenant_id) as machine_count,
          (SELECT MAX(al.created_at) FROM activity_log al WHERE al.tenant_id = t.tenant_id) as last_activity
        FROM tenants t
        ${where}
        ORDER BY t.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) as total FROM tenants t ${where}`, params),
    ]);

    res.json({
      success: true,
      tenants: tenantsResult.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0]?.total ?? '0', 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total ?? '0', 10) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

/** Get detailed tenant info */
superAdminRouter.get('/super-admin/tenants/:tenantId', ...platformGuard, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId!, 10);

    const [tenant, users, usage, limits, loginActivity, recentErrors, featureFlags] = await Promise.all([
      query(`SELECT * FROM tenants WHERE tenant_id = $1`, [tenantId]),
      query(`
        SELECT user_id, username, full_name, role, is_active, created_at,
               (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = u.user_id AND al.action = 'LOGIN') as last_login
        FROM users u WHERE tenant_id = $1 ORDER BY created_at DESC
      `, [tenantId]),
      query(`
        SELECT metric_type, SUM(metric_value) as total_value
        FROM tenant_usage_metrics 
        WHERE tenant_id = $1 AND period_start >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY metric_type
      `, [tenantId]),
      query(`SELECT * FROM tenant_limits WHERE tenant_id = $1`, [tenantId]),
      // Login activity for this tenant's users (last 30 days)
      query(`
        SELECT al.activity_id, al.action, al.details, al.created_at, al.ip_address,
               u.username, u.full_name
        FROM activity_log al
        JOIN users u ON al.user_id = u.user_id
        WHERE u.tenant_id = $1 AND al.action IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'FORCE_LOGOUT')
        ORDER BY al.created_at DESC
        LIMIT 50
      `, [tenantId]),
      // Recent errors (activity_log entries with error-like actions)
      query(`
        SELECT al.activity_id, al.action, al.details, al.entity_type, al.entity_id, al.created_at,
               u.username
        FROM activity_log al
        JOIN users u ON al.user_id = u.user_id
        WHERE u.tenant_id = $1
          AND (al.action ILIKE '%ERROR%' OR al.action ILIKE '%FAIL%' OR al.action ILIKE '%DENIED%')
        ORDER BY al.created_at DESC
        LIMIT 30
      `, [tenantId]),
      // Feature flags for this tenant
      query(`
        SELECT * FROM tenant_feature_flags WHERE tenant_id = $1
      `, [tenantId]).catch(() => ({ rows: [] })),
    ]);

    if (!tenant.rows[0]) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      success: true,
      tenant: tenant.rows[0],
      users: users.rows,
      usage: usage.rows,
      limits: limits.rows[0] ?? null,
      login_activity: loginActivity.rows,
      recent_errors: recentErrors.rows,
      feature_flags: featureFlags.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tenant details' });
  }
});

/** Suspend a tenant */
superAdminRouter.post('/super-admin/tenants/:tenantId/suspend', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = parseInt(req.params.tenantId!, 10);
    const { reason } = req.body;

    await query(`
      UPDATE tenants SET status = 'SUSPENDED', updated_at = NOW() WHERE tenant_id = $1
    `, [tenantId]);

    await logActivity(
      authReq.user!.userId, 'TENANT_SUSPENDED', 'tenant', tenantId,
      `Tenant ${tenantId} suspended. Reason: ${reason || 'Not specified'}`,
    );

    res.json({ success: true, message: 'Tenant suspended' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend tenant' });
  }
});

/** Activate a tenant */
superAdminRouter.post('/super-admin/tenants/:tenantId/activate', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = parseInt(req.params.tenantId!, 10);

    await query(`
      UPDATE tenants SET status = 'ACTIVE', updated_at = NOW() WHERE tenant_id = $1
    `, [tenantId]);

    await logActivity(
      authReq.user!.userId, 'TENANT_ACTIVATED', 'tenant', tenantId,
      `Tenant ${tenantId} activated`,
    );

    res.json({ success: true, message: 'Tenant activated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate tenant' });
  }
});

/** Extend / modify trial period for a specific tenant */
superAdminRouter.post('/super-admin/tenants/:tenantId/extend-trial', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = parseInt(req.params.tenantId as string, 10);
    const { days, trial_ends_at } = req.body;

    if (!days && !trial_ends_at) {
      return res.status(400).json({ error: 'Provide "days" (number to add) or "trial_ends_at" (ISO date)' });
    }

    // Fetch current tenant
    const current = await query(`SELECT tenant_id, company_name, status, trial_ends_at FROM tenants WHERE tenant_id = $1`, [tenantId]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Tenant not found' });

    let newTrialEnd: string;
    if (trial_ends_at) {
      // Absolute date
      newTrialEnd = new Date(trial_ends_at).toISOString();
    } else {
      // Relative: add N days from current trial_ends_at or NOW
      const base = current.rows[0].trial_ends_at ? new Date(current.rows[0].trial_ends_at) : new Date();
      base.setDate(base.getDate() + parseInt(days, 10));
      newTrialEnd = base.toISOString();
    }

    // Update trial_ends_at and ensure status is TRIAL if it was previously cancelled/suspended
    await query(`
      UPDATE tenants SET
        trial_ends_at = $1,
        status = CASE WHEN status IN ('CANCELLED', 'SUSPENDED') THEN 'TRIAL' ELSE status END,
        is_active = true,
        updated_at = NOW()
      WHERE tenant_id = $2
    `, [newTrialEnd, tenantId]);

    await logActivity(
      authReq.user!.user_id, 'TRIAL_EXTENDED', 'tenant', tenantId,
      `Trial extended for ${current.rows[0].company_name}. New trial end: ${new Date(newTrialEnd).toLocaleDateString()}. ${days ? `Added ${days} days` : `Set to ${trial_ends_at}`}`,
    );

    res.json({
      success: true,
      message: `Trial extended until ${new Date(newTrialEnd).toLocaleDateString()}`,
      trial_ends_at: newTrialEnd,
    });
  } catch (err) {
    console.error('[SuperAdmin] Extend trial error:', err);
    res.status(500).json({ error: 'Failed to extend trial' });
  }
});

/** Update tenant limits (syncs to tenants table + tenant_limits table) */
superAdminRouter.put('/super-admin/tenants/:tenantId/limits', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = parseInt(req.params.tenantId as string, 10);
    const { max_users, max_machines, max_storage_mb, max_api_calls_day, custom_limits } = req.body;

    // Sync to tenant_limits table
    await query(`
      INSERT INTO tenant_limits (tenant_id, max_users, max_machines, max_storage_mb, max_api_calls_day, custom_limits)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id) DO UPDATE SET
        max_users = COALESCE($2, tenant_limits.max_users),
        max_machines = COALESCE($3, tenant_limits.max_machines),
        max_storage_mb = COALESCE($4, tenant_limits.max_storage_mb),
        max_api_calls_day = COALESCE($5, tenant_limits.max_api_calls_day),
        custom_limits = COALESCE($6, tenant_limits.custom_limits),
        updated_at = NOW()
    `, [tenantId, max_users ?? 50, max_machines ?? 100, max_storage_mb ?? 5120, max_api_calls_day ?? 10000, custom_limits ? JSON.stringify(custom_limits) : '{}']);

    // ALSO sync max_users and max_machines to the tenants table (this is what the actual enforcement reads)
    if (max_users !== undefined || max_machines !== undefined) {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (max_users !== undefined) { updates.push(`max_users = $${idx++}`); params.push(max_users); }
      if (max_machines !== undefined) { updates.push(`max_machines = $${idx++}`); params.push(max_machines); }
      updates.push('updated_at = NOW()');
      params.push(tenantId);
      await query(`UPDATE tenants SET ${updates.join(', ')} WHERE tenant_id = $${idx}`, params);
    }

    await logActivity(
      authReq.user!.user_id, 'LIMITS_UPDATED', 'tenant', tenantId,
      `Limits updated: users=${max_users ?? 'unchanged'}, machines=${max_machines ?? 'unchanged'}`,
    );

    res.json({ success: true, message: 'Tenant limits updated and synced' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tenant limits' });
  }
});

/** Export tenant data as CSV */
superAdminRouter.get('/super-admin/tenants/:tenantId/export-csv', ...platformGuard, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId as string, 10);
    const dataType = (req.query.type as string) || 'users';

    let rows: any[] = [];
    let headers: string[] = [];
    let filename = '';

    switch (dataType) {
      case 'users': {
        const result = await query(`
          SELECT u.user_id, u.username, u.full_name, u.role, u.is_active, u.created_at,
                 (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = u.user_id AND al.action = 'LOGIN') as last_login
          FROM users u WHERE u.tenant_id = $1 ORDER BY u.created_at
        `, [tenantId]);
        rows = result.rows;
        headers = ['user_id', 'username', 'full_name', 'role', 'is_active', 'created_at', 'last_login'];
        filename = `tenant_${tenantId}_users.csv`;
        break;
      }
      case 'machines': {
        const result = await query(`SELECT * FROM machines WHERE tenant_id = $1 ORDER BY created_at`, [tenantId]).catch(() => ({ rows: [] }));
        rows = result.rows;
        headers = rows.length > 0 ? Object.keys(rows[0]) : ['machine_id', 'name', 'status'];
        filename = `tenant_${tenantId}_machines.csv`;
        break;
      }
      case 'activity': {
        const result = await query(`
          SELECT al.activity_id, u.username, al.action, al.entity_type, al.details, al.created_at
          FROM activity_log al LEFT JOIN users u ON al.user_id = u.user_id
          WHERE al.tenant_id = $1 ORDER BY al.created_at DESC LIMIT 1000
        `, [tenantId]).catch(() => ({ rows: [] }));
        rows = result.rows;
        headers = ['activity_id', 'username', 'action', 'entity_type', 'details', 'created_at'];
        filename = `tenant_${tenantId}_activity.csv`;
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown export type: ${dataType}. Use: users, machines, activity` });
    }

    // Build CSV
    const escapeCsv = (val: any) => {
      if (val == null) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvLines.join('\n'));
  } catch (err) {
    console.error('[SuperAdmin] CSV export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/** Platform admin: list all backups across all tenants */
superAdminRouter.get('/super-admin/backups', ...platformGuard, async (_req, res) => {
  try {
    const result = await query(`
      SELECT bh.*, u.username, u.full_name
      FROM backup_history bh
      LEFT JOIN users u ON bh.created_by = u.user_id
      ORDER BY bh.created_at DESC
      LIMIT 100
    `);

    const humanFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const backups = result.rows.map((r: any) => ({
      id: r.backup_id,
      filename: r.filename,
      createdAt: r.created_at,
      sizeBytes: parseInt(r.size_bytes || '0', 10),
      sizeHuman: humanFileSize(parseInt(r.size_bytes || '0', 10)),
      type: r.backup_type,
      createdBy: r.full_name || r.username || null,
      status: r.status,
      notes: r.notes,
    }));

    // Backup system status
    const [totalResult, totalSizeResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM backup_history WHERE status = 'completed'`),
      query(`SELECT COALESCE(SUM(size_bytes), 0) as total_size FROM backup_history WHERE status = 'completed'`),
    ]);

    res.json({
      success: true,
      backups,
      stats: {
        totalBackups: parseInt(totalResult.rows[0]?.total ?? '0', 10),
        totalSize: humanFileSize(parseInt(totalSizeResult.rows[0]?.total_size ?? '0', 10)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// E4: Change tenant plan directly (updates plan + limits from PLAN_LIMITS)
superAdminRouter.patch('/super-admin/tenants/:tenantId/plan', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = parseInt(req.params.tenantId!, 10);
    const { plan } = req.body;

    const validPlans = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({
        error: `plan is required and must be one of: ${validPlans.join(', ')}`,
      });
    }

    // Plan limits from central config
    const PLAN_LIMITS: Record<string, { maxUsers: number; maxMachines: number }> = {
      FREE: { maxUsers: 3, maxMachines: 2 },
      STARTER: { maxUsers: 10, maxMachines: 10 },
      PROFESSIONAL: { maxUsers: 50, maxMachines: 30 },
      ENTERPRISE: { maxUsers: -1, maxMachines: -1 },
    };

    const limits = PLAN_LIMITS[plan]!;

    // Get current plan for audit
    const current = await query(`SELECT plan FROM tenants WHERE tenant_id = $1`, [tenantId]);
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    const oldPlan = current.rows[0].plan;

    // Update plan, limits, and auto-activate if upgrading from trial
    await query(`
      UPDATE tenants SET
        plan = $1,
        max_users = $2,
        max_machines = $3,
        status = CASE WHEN status = 'TRIAL' THEN 'ACTIVE' ELSE status END,
        is_active = true,
        updated_at = NOW()
      WHERE tenant_id = $4
    `, [plan, limits.maxUsers, limits.maxMachines, tenantId]);

    // Also sync tenant_limits table if it exists
    await query(`
      INSERT INTO tenant_limits (tenant_id, max_users, max_machines)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id) DO UPDATE SET
        max_users = $2,
        max_machines = $3,
        updated_at = NOW()
    `, [tenantId, limits.maxUsers, limits.maxMachines]).catch(() => { /* tenant_limits table may not exist */ });

    await logActivity(
      authReq.user!.userId, 'PLAN_CHANGED', 'tenant', tenantId,
      `Plan changed from ${oldPlan} to ${plan}`,
    );

    res.json({ success: true, message: `Plan changed from ${oldPlan} to ${plan}`, limits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change tenant plan' });
  }
});

// ─── Impersonation ────────────────────────────

/** Start impersonation session (login as a tenant user) */
superAdminRouter.post('/super-admin/impersonate', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { target_tenant_id, target_user_id, reason } = req.body;

    if (!target_tenant_id || !reason) {
      return res.status(400).json({ error: 'target_tenant_id and reason are required' });
    }

    // Find target user (or first admin of tenant)
    let targetUser;
    if (target_user_id) {
      const result = await query(
        `SELECT * FROM users WHERE user_id = $1 AND tenant_id = $2`,
        [target_user_id, target_tenant_id],
      );
      targetUser = result.rows[0];
    } else {
      const result = await query(
        `SELECT * FROM users WHERE tenant_id = $1 AND role = 'ADMIN' AND is_active = true LIMIT 1`,
        [target_tenant_id],
      );
      targetUser = result.rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Log impersonation (security-critical)
    const impResult = await query(`
      INSERT INTO impersonation_log (admin_user_id, target_tenant_id, target_user_id, reason, ip_address)
      VALUES ($1, $2, $3, $4, $5) RETURNING impersonation_id
    `, [authReq.user!.userId, target_tenant_id, targetUser.user_id, reason, req.ip]);

    // Generate impersonation token with flag
    const impersonationToken = jwt.sign(
      {
        userId: targetUser.user_id,
        username: targetUser.username,
        role: targetUser.role,
        tenant_id: target_tenant_id,
        is_impersonation: true,
        impersonation_id: impResult.rows[0].impersonation_id,
        actual_admin_id: authReq.user!.userId,
      },
      JWT_SECRET,
      { expiresIn: '1h' }, // Short-lived for security
    );

    await logActivity(
      authReq.user!.userId, 'IMPERSONATION_START', 'security', target_tenant_id,
      `Admin ${authReq.user!.userId} impersonating user ${targetUser.user_id} in tenant ${target_tenant_id}. Reason: ${reason}`,
    );

    res.json({
      success: true,
      impersonation_id: impResult.rows[0].impersonation_id,
      token: impersonationToken,
      target_user: {
        user_id: targetUser.user_id,
        username: targetUser.username,
        role: targetUser.role,
        tenant_id: target_tenant_id,
      },
      expires_in: '1h',
    });
  } catch (err) {
    console.error('[SuperAdmin] Impersonation error:', err);
    res.status(500).json({ error: 'Failed to start impersonation' });
  }
});

/** End impersonation session */
superAdminRouter.post('/super-admin/impersonate/:impersonationId/end', ...platformGuard, async (req, res) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId!, 10);

    await query(`
      UPDATE impersonation_log SET ended_at = NOW() WHERE impersonation_id = $1
    `, [impersonationId]);

    res.json({ success: true, message: 'Impersonation session ended' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end impersonation' });
  }
});

// ─── Usage Metering ───────────────────────────

/** Record usage metric for a tenant */
export async function recordUsageMetric(
  tenantId: number,
  metricType: string,
  value: number,
  periodStart?: Date,
  periodEnd?: Date,
): Promise<void> {
  const start = periodStart ?? new Date();
  const end = periodEnd ?? new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  await query(`
    INSERT INTO tenant_usage_metrics (tenant_id, metric_type, metric_value, period_start, period_end)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tenant_id, metric_type, period_start)
    DO UPDATE SET metric_value = tenant_usage_metrics.metric_value + $3, recorded_at = NOW()
  `, [tenantId, metricType, value, start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
}

/** Get usage metrics for all tenants */
superAdminRouter.get('/super-admin/usage', ...platformGuard, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const result = await query(`
      SELECT
        t.tenant_id,
        t.company_name,
        t.plan,
        um.metric_type,
        SUM(um.metric_value) as total_value,
        tl.max_users,
        tl.max_machines,
        tl.max_api_calls_day
      FROM tenants t
      LEFT JOIN tenant_usage_metrics um ON t.tenant_id = um.tenant_id
        AND um.period_start >= CURRENT_DATE - ($1 || ' days')::INTERVAL
      LEFT JOIN tenant_limits tl ON t.tenant_id = tl.tenant_id
      GROUP BY t.tenant_id, t.company_name, t.plan, um.metric_type, tl.max_users, tl.max_machines, tl.max_api_calls_day
      ORDER BY t.company_name
    `, [days]);

    res.json({ success: true, usage: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get usage metrics' });
  }
});

// ─── Announcements ────────────────────────────

/** Create platform announcement */
superAdminRouter.post('/super-admin/announcements', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, message, severity, target_tenants, expires_at } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const result = await query(`
      INSERT INTO platform_announcements (title, message, severity, target_tenants, expires_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [title, message, severity ?? 'INFO', target_tenants ?? [], expires_at ?? null, authReq.user!.userId]);

    res.json({ success: true, announcement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

/** Get active announcements (tenant-facing) */
superAdminRouter.get('/super-admin/announcements', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.tenant_id;

    const result = await query(`
      SELECT * FROM platform_announcements
      WHERE is_active = true
        AND (starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_tenants = '{}' OR $1 = ANY(target_tenants))
      ORDER BY created_at DESC
    `, [tenantId]);

    res.json({ success: true, announcements: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get announcements' });
  }
});

// ─── Revenue Analytics ────────────────────────

superAdminRouter.get('/super-admin/revenue', ...platformGuard, async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;

    const [mrrData, planDistribution, churnData] = await Promise.all([
      // Monthly Recurring Revenue
      query(`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue,
          COUNT(DISTINCT tenant_id) as paying_tenants
        FROM billing_invoices
        WHERE status = 'paid' AND created_at >= CURRENT_DATE - ($1 || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `, [months]).catch(() => ({ rows: [] })),

      // Plan distribution
      query(`
        SELECT plan, COUNT(*) as count FROM tenants
        WHERE status = 'active'
        GROUP BY plan ORDER BY count DESC
      `).catch(() => ({ rows: [] })),

      // Churn (suspended in last N months)
      query(`
        SELECT
          DATE_TRUNC('month', updated_at) as month,
          COUNT(*) as churned
        FROM tenants
        WHERE status = 'suspended' AND updated_at >= CURRENT_DATE - ($1 || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', updated_at)
        ORDER BY month
      `, [months]).catch(() => ({ rows: [] })),
    ]);

    res.json({
      success: true,
      revenue: {
        mrr: mrrData.rows,
        planDistribution: planDistribution.rows,
        churn: churnData.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  }
});

// ─── Impersonation History ────────────────────

superAdminRouter.get('/super-admin/impersonation-log', ...platformGuard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await query(`
      SELECT il.*, u.username as admin_username, u.full_name as admin_name
      FROM impersonation_log il
      JOIN users u ON il.admin_user_id = u.user_id
      ORDER BY il.started_at DESC
      LIMIT $1
    `, [limit]);

    res.json({ success: true, impersonations: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get impersonation log' });
  }
});

// ─── Cross-Tenant User Management (Platform Level) ────────────

/** List all users across all tenants with search & filters */
superAdminRouter.get('/super-admin/users', ...platformGuard, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const tenantId = req.query.tenant_id as string;
    const role = req.query.role as string;
    const status = req.query.status as string; // 'active' or 'inactive'

    let where = 'WHERE t.is_platform_admin = false';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.username ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR t.company_name ILIKE $${params.length})`;
    }
    if (tenantId) {
      params.push(parseInt(tenantId, 10));
      where += ` AND u.tenant_id = $${params.length}`;
    }
    if (role) {
      params.push(role);
      where += ` AND u.role = $${params.length}`;
    }
    if (status === 'active') {
      where += ' AND u.is_active = true';
    } else if (status === 'inactive') {
      where += ' AND u.is_active = false';
    }

    const [usersResult, countResult] = await Promise.all([
      query(`
        SELECT u.user_id, u.username, u.full_name, u.role, u.is_active, u.created_at,
               u.tenant_id, t.company_name, t.plan as tenant_plan, t.status as tenant_status,
               (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = u.user_id AND al.action = 'LOGIN') as last_login
        FROM users u
        JOIN tenants t ON u.tenant_id = t.tenant_id
        ${where}
        ORDER BY u.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]),
      query(`
        SELECT COUNT(*) as total
        FROM users u
        JOIN tenants t ON u.tenant_id = t.tenant_id
        ${where}
      `, params),
    ]);

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0]?.total ?? '0', 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total ?? '0', 10) / limit),
      },
    });
  } catch (err) {
    console.error('[SuperAdmin] User list error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/** Disable/enable a user across any tenant */
superAdminRouter.patch('/super-admin/users/:userId/status', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = parseInt(req.params.userId!, 10);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active (boolean) is required' });
    }

    await query(`UPDATE users SET is_active = $1 WHERE user_id = $2`, [is_active, userId]);

    await logActivity(
      authReq.user!.user_id, is_active ? 'USER_ENABLED' : 'USER_DISABLED',
      'user', userId,
      `Platform admin ${is_active ? 'enabled' : 'disabled'} user ${userId}`,
    );

    res.json({ success: true, message: `User ${is_active ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/** Reset a user's password (platform admin) */
superAdminRouter.post('/super-admin/users/:userId/reset-password', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = parseInt(req.params.userId!, 10);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'new_password is required (min 6 chars)' });
    }

    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    const hash = await bcrypt.hash(new_password, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [hash, userId]);

    await logActivity(
      authReq.user!.user_id, 'PASSWORD_RESET',
      'user', userId,
      `Platform admin reset password for user ${userId}`,
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('[SuperAdmin] Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/** Force logout a user */
superAdminRouter.post('/super-admin/users/:userId/force-logout', ...platformGuard, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = parseInt(req.params.userId!, 10);

    await logActivity(
      authReq.user!.user_id, 'FORCE_LOGOUT',
      'user', userId,
      `Platform admin forced logout for user ${userId}`,
    );

    res.json({ success: true, message: 'Force logout recorded. User must re-authenticate.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to force logout' });
  }
});

/** Get user login/activity history */
superAdminRouter.get('/super-admin/users/:userId/activity', ...platformGuard, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId!, 10);
    const limit = parseInt(req.query.limit as string) || 50;

    const [userResult, activityResult] = await Promise.all([
      query(`
        SELECT u.user_id, u.username, u.full_name, u.role, u.is_active, u.created_at,
               u.tenant_id, t.company_name
        FROM users u JOIN tenants t ON u.tenant_id = t.tenant_id
        WHERE u.user_id = $1
      `, [userId]),
      query(`
        SELECT activity_id, action, entity_type, entity_id, details, ip_address, created_at
        FROM activity_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]),
    ]);

    if (!userResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: userResult.rows[0],
      activity: activityResult.rows,
    });
  } catch (err) {
    console.error('[SuperAdmin] User activity error:', err);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
});
