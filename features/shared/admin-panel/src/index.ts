/**
 * FactoryOS Admin Panel — Backend API
 *
 * Aggregates system-wide status information into a single admin dashboard.
 * Provides endpoints for:
 * - System health overview (DB, feature flags, services)
 * - User management stats
 * - License info
 * - Database statistics
 * - Feature flag management
 * - System configuration
 */

import { Router } from 'express';
import { query, getPool } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';

export const adminRouter = Router();

// ─── System Dashboard ─────────────────────────

/** Full system overview for admin dashboard */
adminRouter.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenant_id;
    if (!tenantId) {
      res.status(403).json({ success: false, error: 'No tenant context' });
      return;
    }

    const [
      userStats,
      machineStats,
      productionStats,
      downtimeStats,
      shiftStats,
      activityStats,
      featureFlags,
    ] = await Promise.all([
      // User stats — scoped to tenant
      query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'ADMIN') as admins,
          COUNT(*) FILTER (WHERE role = 'SUPERVISOR') as supervisors,
          COUNT(*) FILTER (WHERE role = 'OPERATOR') as operators,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_users
        FROM users
        WHERE tenant_id = $1
      `, [tenantId]),

      // Machine stats — scoped to tenant
      query(`
        SELECT
          COUNT(*) as total_machines,
          COUNT(*) FILTER (WHERE status = 'running') as running,
          COUNT(*) FILTER (WHERE status = 'idle') as idle,
          COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
          COUNT(*) FILTER (WHERE status = 'offline') as offline_machines
        FROM machines
        WHERE tenant_id = $1
      `, [tenantId]).catch(() => ({ rows: [{ total_machines: 0, running: 0, idle: 0, maintenance: 0, offline_machines: 0 }] })),

      // Production stats (last 7 days) — scoped to tenant
      query(`
        SELECT
          COUNT(*) as total_plans,
          COUNT(*) FILTER (WHERE status = 'active') as active_plans,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_plans,
          COALESCE(SUM(actual_quantity), 0) as total_produced
        FROM production_plans
        WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      `, [tenantId]).catch(() => ({ rows: [{ total_plans: 0, active_plans: 0, completed_plans: 0, total_produced: 0 }] })),

      // Downtime stats (last 7 days) — scoped to tenant
      query(`
        SELECT
          COUNT(*) as total_events,
          COALESCE(SUM(duration_minutes), 0) as total_minutes
        FROM downtime_logs
        WHERE tenant_id = $1 AND start_time >= CURRENT_DATE - INTERVAL '7 days'
      `, [tenantId]).catch(() => ({ rows: [{ total_events: 0, total_minutes: 0 }] })),

      // Shift stats — scoped to tenant
      query(`SELECT COUNT(*) as total_shifts FROM shifts WHERE tenant_id = $1`, [tenantId])
        .catch(() => ({ rows: [{ total_shifts: 0 }] })),

      // Activity stats (last 24h) — scoped to tenant
      query(`
        SELECT COUNT(*) as events_24h
        FROM activity_log
        WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
      `, [tenantId]),

      // Feature flags (global — no tenant_id column)
      query(`SELECT feature_id, name, enabled, description FROM feature_flags ORDER BY name`)
        .catch(() => ({ rows: [] })),
    ]);

    res.json({
      success: true,
      dashboard: {
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
        },
        users: userStats.rows[0],
        machines: machineStats.rows[0],
        production: productionStats.rows[0],
        downtime: downtimeStats.rows[0],
        shifts: shiftStats.rows[0],
        activity: activityStats.rows[0],
        featureFlags: featureFlags.rows,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin dashboard' });
  }
});

// ─── User Management ──────────────────────────

/** Detailed user list for admin — scoped to tenant */
adminRouter.get('/admin/users', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenant_id;
    if (!tenantId) {
      res.status(403).json({ success: false, error: 'No tenant context' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    let whereClause = 'WHERE u.tenant_id = $1';
    const values: any[] = [tenantId];

    if (search) {
      whereClause += ` AND (u.username ILIKE $2 OR u.full_name ILIKE $2)`;
      values.push(`%${search}%`);
    }

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT u.user_id, u.username, u.full_name, u.role, u.is_active, u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM activity_log al WHERE al.user_id = u.user_id AND al.tenant_id = $1) as activity_count,
                (SELECT MAX(al.created_at) FROM activity_log al WHERE al.user_id = u.user_id AND al.tenant_id = $1) as last_activity
         FROM users u ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, limit, offset],
      ),
      query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, values),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/** Toggle user active status */
adminRouter.patch('/admin/users/:id/toggle-active', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id as string, 10);

    // Prevent self-deactivation
    if (userId === req.user!.user_id) {
      res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
      return;
    }

    const tenantId = req.user!.tenant_id;
    if (!tenantId) {
      res.status(403).json({ success: false, error: 'No tenant context' });
      return;
    }

    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE user_id = $1 AND tenant_id = $2 RETURNING user_id, username, is_active`,
      [userId, tenantId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    await logActivity(
      req.user!.user_id,
      user.is_active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'user',
      userId,
      `${user.username} ${user.is_active ? 'activated' : 'deactivated'}`,
      req.ip,
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle user status' });
  }
});

// ─── Feature Flags ────────────────────────────

/** Toggle a feature flag */
adminRouter.patch('/admin/features/:featureId/toggle', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user!.tenant_id) {
      res.status(403).json({ success: false, error: 'No tenant context' });
      return;
    }

    const result = await query(
      `UPDATE feature_flags SET enabled = NOT enabled WHERE feature_id = $1 RETURNING *`,
      [req.params.featureId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Feature flag not found' });
      return;
    }

    const feature = result.rows[0];
    await logActivity(
      req.user!.user_id,
      feature.enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
      'feature_flag',
      undefined,
      `Feature "${feature.name}" ${feature.enabled ? 'enabled' : 'disabled'}`,
      req.ip,
    );

    res.json({ success: true, feature });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle feature' });
  }
});

// ─── Database Stats ───────────────────────────

/** Get basic database statistics — tenant-safe (no raw table sizes exposed) */
adminRouter.get('/admin/db-stats', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = (req as AuthenticatedRequest).user!.tenant_id;
    if (!tenantId) {
      res.status(403).json({ success: false, error: 'No tenant context' });
      return;
    }

    // Return tenant-scoped record counts instead of raw pg_stat_user_tables
    const tenantStats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as users_count,
        (SELECT COUNT(*) FROM machines WHERE tenant_id = $1) as machines_count,
        (SELECT COUNT(*) FROM production_plans WHERE tenant_id = $1) as plans_count,
        (SELECT COUNT(*) FROM shifts WHERE tenant_id = $1) as shifts_count,
        (SELECT COUNT(*) FROM downtime_logs WHERE tenant_id = $1) as downtime_count,
        (SELECT COUNT(*) FROM activity_log WHERE tenant_id = $1) as activity_count
    `, [tenantId]);

    res.json({
      success: true,
      stats: tenantStats.rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch DB stats' });
  }
});

// ─── System Config ────────────────────────────

/** Get system configuration (non-sensitive) */
adminRouter.get('/admin/config', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  // Show DATABASE_URL presence without exposing credentials
  const dbConfig = process.env.DATABASE_URL
    ? { databaseUrl: 'configured (hidden)', usingCloudDb: true }
    : {
        dbHost: process.env.DB_HOST || 'localhost',
        dbPort: process.env.DB_PORT || '5432',
        dbName: process.env.DB_NAME || 'factory_os',
        usingCloudDb: false,
      };

  res.json({
    success: true,
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 4000,
      ...dbConfig,
      backupDir: process.env.BACKUP_DIR || 'backups',
      maxBackups: process.env.MAX_BACKUPS || '20',
      jwtExpiry: process.env.JWT_EXPIRY || '24h',
    },
  });
});

// ─── Health ───────────────────────────────────

/** Detailed health check */
adminRouter.get('/admin/health', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await query('SELECT 1');
    checks.database = { status: 'healthy', latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    checks.database = { status: 'unhealthy', latencyMs: Date.now() - dbStart, error: err.message };
  }

  // Pool stats
  try {
    const pool = getPool();
    checks.pool = {
      status: 'healthy',
      ...({
        totalCount: (pool as any).totalCount,
        idleCount: (pool as any).idleCount,
        waitingCount: (pool as any).waitingCount,
      }),
    };
  } catch {
    checks.pool = { status: 'unknown' };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Helpers ──────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Onboarding: Check Setup Status ──────────

adminRouter.get('/admin/setup-status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user!.tenant_id;
    const [machinesR, shiftsR, plansR, usersR, vendorsR, materialsR] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) FROM machines WHERE tenant_id = $1', [tenantId]),
      query<{ count: string }>('SELECT COUNT(*) FROM shifts WHERE tenant_id = $1', [tenantId]),
      query<{ count: string }>('SELECT COUNT(*) FROM production_plans WHERE tenant_id = $1', [tenantId]),
      query<{ count: string }>('SELECT COUNT(*) FROM tenant_users WHERE tenant_id = $1', [tenantId]),
      query<{ count: string }>('SELECT COUNT(*) FROM pt_vendors WHERE tenant_id = $1 AND deleted_at IS NULL', [tenantId]),
      query<{ count: string }>('SELECT COUNT(*) FROM pt_materials WHERE tenant_id = $1 AND deleted_at IS NULL', [tenantId]),
    ]);
    const machines = parseInt(machinesR.rows[0]?.count ?? '0', 10);
    const shifts = parseInt(shiftsR.rows[0]?.count ?? '0', 10);
    const plans = parseInt(plansR.rows[0]?.count ?? '0', 10);
    const users = parseInt(usersR.rows[0]?.count ?? '0', 10);
    const vendors = parseInt(vendorsR.rows[0]?.count ?? '0', 10);
    const materials = parseInt(materialsR.rows[0]?.count ?? '0', 10);
    // Show setup banner only when the tenant is completely empty.
    // If the admin has created ANY of: machines, shifts, additional users
    // (users > 1 because the tenant admin is always counted), vendors or
    // materials – the factory is no longer "empty" and the banner should hide.
    const hasAnyRealData = machines > 0 || shifts > 0 || users > 1 || vendors > 0 || materials > 0;
    const needsSetup = !hasAnyRealData;
    res.json({ success: true, setup: { machines, shifts, plans, users, vendors, materials, needsSetup } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check setup status' });
  }
});

// ─── Onboarding: Seed Sample Data (SSE streaming progress) ────────────

adminRouter.post('/admin/seed-sample-data', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  // Setup SSE headers for streaming progress
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  const sendProgress = (step: string, message: string, progress: number, detail?: Record<string, unknown>) => {
    const payload = JSON.stringify({ step, message, progress, ...(detail ?? {}) });
    res.write(`data: ${payload}\n\n`);
  };

  try {
    const tenantId = req.user!.tenant_id;
    const userId = req.user!.user_id;
    const pool = getPool();
    const client = await pool.connect();
    const created = { users: 0, machines: 0, shifts: 0, plans: 0, vendors: 0, projects: 0, materials: 0, payments: 0 };

    try {
      await client.query('BEGIN');
      sendProgress('init', 'Starting data generation...', 2);

      // 1. Create sample shifts
      sendProgress('shifts', 'Creating shifts (Morning, Afternoon, Night)...', 5);
      const shiftDefs = [
        { name: 'Morning', start: '06:00', end: '14:00' },
        { name: 'Afternoon', start: '14:00', end: '22:00' },
        { name: 'Night', start: '22:00', end: '06:00' },
      ];
      const shiftIds: number[] = [];
      for (const s of shiftDefs) {
        const exists = await client.query(
          'SELECT shift_id FROM shifts WHERE tenant_id = $1 AND shift_name = $2 AND deleted_at IS NULL',
          [tenantId, s.name],
        );
        if (exists.rows.length > 0) {
          shiftIds.push(exists.rows[0].shift_id);
        } else {
          // Un-soft-delete if a deleted version exists, otherwise create new
          const deleted = await client.query(
            'UPDATE shifts SET deleted_at = NULL, is_active = true WHERE tenant_id = $1 AND shift_name = $2 AND deleted_at IS NOT NULL RETURNING shift_id',
            [tenantId, s.name],
          );
          if (deleted.rows.length > 0) {
            shiftIds.push(deleted.rows[0].shift_id);
            created.shifts++;
          } else {
            const r = await client.query(
              'INSERT INTO shifts (tenant_id, shift_name, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, true) RETURNING shift_id',
              [tenantId, s.name, s.start, s.end],
            );
            shiftIds.push(r.rows[0].shift_id);
            created.shifts++;
          }
        }
      }
      sendProgress('shifts', `Created ${created.shifts} shifts ✓`, 10);

      // 2. Create sample machines
      sendProgress('machines', 'Creating machines (CNC, Lathe, Press, Assembly)...', 12);
      const machineDefs = [
        { name: 'CNC Machine A1', code: 'CNC-A1', type: 'CNC', department: 'Machining' },
        { name: 'CNC Machine A2', code: 'CNC-A2', type: 'CNC', department: 'Machining' },
        { name: 'Lathe L1', code: 'LAT-L1', type: 'Lathe', department: 'Turning' },
        { name: 'Press P1', code: 'PRS-P1', type: 'Press', department: 'Stamping' },
        { name: 'Assembly Line 1', code: 'ASM-01', type: 'Assembly', department: 'Assembly' },
      ];
      const machineIds: number[] = [];
      for (const m of machineDefs) {
        const exists = await client.query(
          'SELECT machine_id FROM machines WHERE tenant_id = $1 AND machine_code = $2 AND deleted_at IS NULL',
          [tenantId, m.code],
        );
        if (exists.rows.length > 0) {
          machineIds.push(exists.rows[0].machine_id);
        } else {
          // Restore soft-deleted machine if exists
          const deleted = await client.query(
            `UPDATE machines SET deleted_at = NULL, status = 'ACTIVE' WHERE tenant_id = $1 AND machine_code = $2 AND deleted_at IS NOT NULL RETURNING machine_id`,
            [tenantId, m.code],
          );
          if (deleted.rows.length > 0) {
            machineIds.push(deleted.rows[0].machine_id);
            created.machines++;
            continue;
          }
          const r = await client.query(
            `INSERT INTO machines (tenant_id, machine_name, machine_code, machine_type, department, status)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING machine_id`,
            [tenantId, m.name, m.code, m.type, m.department],
          );
          machineIds.push(r.rows[0].machine_id);
          created.machines++;
        }
      }
      sendProgress('machines', `Created ${created.machines} machines ✓`, 20);

      // 3. Create sample users (operator & supervisor)
      sendProgress('users', 'Creating sample users (operators, supervisor)...', 22);
      const bcryptModule = await import('bcryptjs');
      const bcrypt = bcryptModule.default || bcryptModule;
      const samplePassword = await bcrypt.hash('Test@1234', 10);
      const userDefs = [
        { username: 'operator1', full_name: 'Rajesh Kumar', role: 'OPERATOR' },
        { username: 'operator2', full_name: 'Priya Sharma', role: 'OPERATOR' },
        { username: 'supervisor1', full_name: 'Amit Patel', role: 'SUPERVISOR' },
      ];
      for (const u of userDefs) {
        // Check if user already exists globally
        const existingUser = await client.query(
          'SELECT user_id FROM users WHERE username = $1',
          [u.username],
        );
        let newUserId: number;
        if (existingUser.rows.length > 0) {
          newUserId = existingUser.rows[0].user_id;
        } else {
          // Insert into users table
          const r = await client.query(
            `INSERT INTO users (username, password_hash, full_name, role, tenant_id, is_active)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING user_id`,
            [u.username, samplePassword, u.full_name, u.role, tenantId],
          );
          newUserId = r.rows[0].user_id;
        }
        // Link user to tenant via tenant_users join table
        const linked = await client.query(
          'SELECT tenant_user_id FROM tenant_users WHERE tenant_id = $1 AND user_id = $2',
          [tenantId, newUserId],
        );
        if (linked.rows.length === 0) {
          await client.query(
            'INSERT INTO tenant_users (tenant_id, user_id, is_tenant_admin) VALUES ($1, $2, false)',
            [tenantId, newUserId],
          );
          created.users++;
        }
      }
      sendProgress('users', `Created ${created.users} users ✓`, 30);

      // 4. Create production plans for last 2 months + upcoming 1 month
      sendProgress('plans', 'Generating 3 months of production plans...', 32);
      const products = [
        { name: 'Gear Shaft A-200', code: 'GS-A200', target: 500 },
        { name: 'Bearing Housing B-100', code: 'BH-B100', target: 300 },
        { name: 'Piston Ring C-50', code: 'PR-C50', target: 800 },
        { name: 'Valve Body D-30', code: 'VB-D30', target: 400 },
        { name: 'Cam Follower E-10', code: 'CF-E10', target: 600 },
      ];

      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 2);
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);

      // Generate plans for ~every day to get realistic volume
      const current = new Date(startDate);
      let totalDays = 0;
      const tempDate = new Date(startDate);
      while (tempDate <= endDate) { totalDays++; tempDate.setDate(tempDate.getDate() + 1); }
      let dayCount = 0;

      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        dayCount++;

        // Send progress updates every ~10 days
        if (dayCount % 10 === 0) {
          const planProgress = 32 + Math.floor((dayCount / totalDays) * 28); // 32-60%
          sendProgress('plans', `Creating plans... (day ${dayCount}/${totalDays})`, Math.min(planProgress, 60));
        }

        // Skip Sundays
        if (dayOfWeek !== 0) {
          // 2-3 plans per day using different machines/shifts/products
          const plansPerDay = 2 + (dayOfWeek % 2);
          for (let p = 0; p < plansPerDay; p++) {
            const machId = machineIds[p % machineIds.length]!;
            const shiftId = shiftIds[p % shiftIds.length]!;
            const product = products[((current.getDate() + p) % products.length)]!;
            const targetVariation = product.target + Math.floor(Math.random() * 100) - 50;

            // Determine status based on date
            const isPast = current < today;
            const isToday = dateStr === today.toISOString().split('T')[0];
            const status = isPast ? (Math.random() > 0.1 ? 'COMPLETED' : 'CANCELLED')
              : isToday ? 'IN_PROGRESS'
              : 'PLANNED';

            // Calculate actuals for past/in-progress plans
            const actualQty = status === 'COMPLETED' ? Math.floor(targetVariation * (0.85 + Math.random() * 0.2))
              : status === 'IN_PROGRESS' ? Math.floor(targetVariation * (0.3 + Math.random() * 0.4))
              : 0;
            const rejectedQty = actualQty > 0 ? Math.floor(actualQty * (Math.random() * 0.05)) : 0;

            const planResult = await client.query(
              `INSERT INTO production_plans (tenant_id, machine_id, shift_id, plan_date, product_name, product_code, target_quantity, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING plan_id`,
              [tenantId, machId, shiftId, dateStr, product.name, product.code, targetVariation, status],
            );
            created.plans++;

            // Create corresponding production_logs for past/in-progress plans
            if (actualQty > 0) {
              const okQty = actualQty - rejectedQty;
              await client.query(
                `INSERT INTO production_logs (tenant_id, plan_id, machine_id, shift_id, quantity_produced, quantity_ok, quantity_rejected, logged_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [tenantId, planResult.rows[0].plan_id, machId, shiftId, actualQty, okQty, rejectedQty, `${dateStr}T12:00:00Z`],
              );
            }
          }
        }
        current.setDate(current.getDate() + 1);
      }
      sendProgress('plans', `Created ${created.plans} production plans ✓`, 62);

      // 5. PayTrack — Vendors, Projects, Materials & Payments with realistic positive data
      {
        // 5a. Vendors — diverse suppliers
        sendProgress('vendors', 'Creating PayTrack vendors...', 64);
        const vendorDefs = [
          { name: 'Shree Cement Suppliers', phone: '+91 98765 43210', email: 'sales@shreesupply.in', gstin: '09AADCS0472N1ZT', address: 'Plot 42, MIDC Phase II, Pune 411018', notes: 'Premium cement & building materials. Reliable delivery.' },
          { name: 'National Steel Traders', phone: '+91 87654 32109', email: 'orders@nationalsteel.co.in', gstin: '27AABCN5645F1ZO', address: '15-A, Industrial Area, Bhosari, Pune 411039', notes: 'TMT bars, plates, angles. Bulk discounts available.' },
          { name: 'Gupta Hardware & Electricals', phone: '+91 76543 21098', email: 'gupta.hw@gmail.com', gstin: '27AADPG8457K1ZR', address: 'Shop 7, Station Road, Chinchwad 411033', notes: 'Electrical fittings, wiring, switches. Quick supply.' },
          { name: 'Reliable Timber Works', phone: '+91 65432 10987', email: 'info@reliabletimber.in', gstin: '27AARFR9876L1ZA', address: 'Gat No. 28, Mahalunge, Pune 411045', notes: 'Plywood, shuttering material, teak & sal wood.' },
          { name: 'Apex Plumbing Solutions', phone: '+91 54321 09876', email: 'apex.plumbing@outlook.com', gstin: '27AABCA1234M1ZH', address: '3rd Floor, Trade Tower, Hinjawadi 411057', notes: 'PVC pipes, fittings, sanitary ware. GST compliant.' },
          { name: 'Bharat Paints & Chemicals', phone: '+91 93456 78901', email: 'sales@bharatpaints.co', gstin: '27AADCB6789N1ZP', address: '22, Chemical Zone, Taloja 410208', notes: 'Industrial paints, primers, waterproofing chemicals.' },
        ];
        const vendorIds: number[] = [];
        for (const v of vendorDefs) {
          const exists = await client.query(
            'SELECT id FROM pt_vendors WHERE tenant_id = $1 AND name = $2 AND deleted_at IS NULL',
            [tenantId, v.name],
          );
          if (exists.rows.length > 0) {
            vendorIds.push(exists.rows[0].id);
          } else {
            const r = await client.query(
              `INSERT INTO pt_vendors (tenant_id, name, phone, email, gstin, address, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
              [tenantId, v.name, v.phone, v.email, v.gstin, v.address, v.notes],
            );
            vendorIds.push(r.rows[0].id);
            created.vendors++;
          }
        }
        sendProgress('vendors', `Created ${created.vendors} vendors ✓`, 70);

        // 5b. Projects — active construction & industrial projects with budgets
        sendProgress('projects', 'Creating PayTrack projects...', 72);
        const projectDefs = [
          { name: 'Greenfield Factory Unit-3', client_name: 'Zipybills Manufacturing', description: 'New 15,000 sqft production unit with modern amenities', budget: 4500000, status: 'active' },
          { name: 'Office Block Renovation', client_name: 'Zipybills Corporate', description: 'Complete renovation of 2-floor admin office block', budget: 1800000, status: 'active' },
          { name: 'Warehouse Extension', client_name: 'Zipybills Logistics', description: 'Adding 8,000 sqft covered warehouse with loading bays', budget: 2200000, status: 'active' },
          { name: 'Staff Quarters Phase-2', client_name: 'Zipybills HR', description: '12-unit staff accommodation with parking', budget: 3200000, status: 'active' },
          { name: 'Solar Panel Installation', client_name: 'Zipybills Energy', description: '200 KW rooftop solar with battery storage', budget: 2800000, status: 'active' },
        ];
        const projectIds: number[] = [];
        for (const p of projectDefs) {
          const exists = await client.query(
            'SELECT id FROM pt_projects WHERE tenant_id = $1 AND name = $2 AND deleted_at IS NULL',
            [tenantId, p.name],
          );
          if (exists.rows.length > 0) {
            projectIds.push(exists.rows[0].id);
          } else {
            const r = await client.query(
              `INSERT INTO pt_projects (tenant_id, name, client_name, description, budget, status, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
              [tenantId, p.name, p.client_name, p.description, p.budget, p.status, userId],
            );
            projectIds.push(r.rows[0].id);
            created.projects++;
          }
        }
        sendProgress('projects', `Created ${created.projects} projects ✓`, 78);

        // 5c. Materials — realistic entries across projects, vendors and dates
        sendProgress('materials', 'Creating PayTrack materials (25 entries)...', 80);
        // We'll generate ~25 material entries spread over the last 45 days
        const materialDefs = [
          { name: 'Portland Cement (OPC 53)', qty: 200, unit: 'bags', amount: 72000, gst: 12960, inv: 'SC-2025-1042' },
          { name: 'TMT Steel Bars 12mm', qty: 5, unit: 'ton', amount: 285000, gst: 51300, inv: 'NST-8823' },
          { name: 'River Sand (Fine)', qty: 40, unit: 'cft', amount: 28000, gst: 1400, inv: 'SS-3344' },
          { name: 'Electrical Wiring 2.5mm', qty: 500, unit: 'mtr', amount: 15000, gst: 2700, inv: 'GHE-7701' },
          { name: 'Plywood 18mm BWR', qty: 30, unit: 'sheets', amount: 42000, gst: 7560, inv: 'RTW-4521' },
          { name: 'PVC Pipes 4 inch', qty: 100, unit: 'pcs', amount: 35000, gst: 6300, inv: 'APS-1122' },
          { name: 'TMT Steel Bars 8mm', qty: 3, unit: 'ton', amount: 168000, gst: 30240, inv: 'NST-8830' },
          { name: 'AAC Blocks 6 inch', qty: 2000, unit: 'pcs', amount: 96000, gst: 17280, inv: 'SC-2025-1098' },
          { name: 'Primer Paint (20L)', qty: 15, unit: 'drums', amount: 22500, gst: 4050, inv: 'BPC-3345' },
          { name: 'Aggregate 20mm', qty: 60, unit: 'cft', amount: 18000, gst: 900, inv: 'SS-3367' },
          { name: 'Modular Switches Set', qty: 50, unit: 'sets', amount: 62500, gst: 11250, inv: 'GHE-7756' },
          { name: 'Teak Wood Door Frames', qty: 8, unit: 'pcs', amount: 96000, gst: 17280, inv: 'RTW-4590' },
          { name: 'Sanitary Fittings Kit', qty: 12, unit: 'sets', amount: 84000, gst: 15120, inv: 'APS-1189' },
          { name: 'Waterproofing Chemical', qty: 200, unit: 'kg', amount: 46000, gst: 8280, inv: 'BPC-3390' },
          { name: 'Ready Mix Concrete M25', qty: 20, unit: 'cum', amount: 110000, gst: 19800, inv: 'SC-2025-1145' },
          { name: 'Solar Panels 400W', qty: 50, unit: 'pcs', amount: 750000, gst: 37500, inv: 'SE-5501' },
          { name: 'Inverter 50KW', qty: 4, unit: 'pcs', amount: 320000, gst: 57600, inv: 'SE-5502' },
          { name: 'Copper Wire 6mm', qty: 300, unit: 'mtr', amount: 45000, gst: 8100, inv: 'GHE-7789' },
          { name: 'Cement Bags (PPC)', qty: 150, unit: 'bags', amount: 52500, gst: 9450, inv: 'SC-2025-1180' },
          { name: 'Steel Channels', qty: 2, unit: 'ton', amount: 124000, gst: 22320, inv: 'NST-8901' },
          { name: 'Glass Panels 10mm', qty: 25, unit: 'pcs', amount: 87500, gst: 15750, inv: 'GW-2201' },
          { name: 'Bathroom Tiles 2x2', qty: 500, unit: 'sqft', amount: 45000, gst: 8100, inv: 'CT-1101' },
          { name: 'Floor Tiles 4x4', qty: 1200, unit: 'sqft', amount: 108000, gst: 19440, inv: 'CT-1155' },
          { name: 'MS Angle 50x50', qty: 1, unit: 'ton', amount: 58000, gst: 10440, inv: 'NST-8950' },
          { name: 'Battery Storage 10KWh', qty: 8, unit: 'pcs', amount: 480000, gst: 86400, inv: 'SE-5510' },
        ];

        // Status distribution: ~40% paid, ~20% approved, ~20% pending, ~12% payment_requested, ~8% rejected
        const statusWeights = [
          'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid',
          'approved', 'approved', 'approved', 'approved', 'approved',
          'pending', 'pending', 'pending', 'pending', 'pending',
          'payment_requested', 'payment_requested', 'payment_requested',
          'rejected', 'rejected',
        ];

        const paymentModes = ['upi', 'bank_transfer', 'cash', 'cheque', 'neft'];
        const materialIds: { id: number; status: string; total: number; date: string }[] = [];

        for (let i = 0; i < materialDefs.length; i++) {
          const m = materialDefs[i]!;
          const projectId = projectIds[i % projectIds.length]!;
          const vendorId = vendorIds[i % vendorIds.length]!;
          const status = statusWeights[i % statusWeights.length]!;
          const daysAgo = Math.floor(Math.random() * 42) + 3; // 3-45 days ago
          const entryDate = new Date(today);
          entryDate.setDate(entryDate.getDate() - daysAgo);
          const dateStr = entryDate.toISOString();
          const totalAmount = m.amount + m.gst;

          const exists = await client.query(
            'SELECT id FROM pt_materials WHERE tenant_id = $1 AND invoice_number = $2 AND deleted_at IS NULL',
            [tenantId, m.inv],
          );
          if (exists.rows.length > 0) {
            materialIds.push({ id: exists.rows[0].id, status, total: totalAmount, date: dateStr });
            continue;
          }

          const approvedBy = status !== 'pending' ? userId : null;
          const approvedAt = status !== 'pending' ? dateStr : null;

          const r = await client.query(
            `INSERT INTO pt_materials (tenant_id, project_id, vendor_id, material_name, quantity, unit,
               invoice_number, amount, gst_amount, total_amount, status, created_by, approved_by, approved_at, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15) RETURNING id`,
            [tenantId, projectId, vendorId, m.name, m.qty, m.unit,
             m.inv, m.amount, m.gst, totalAmount, status, userId, approvedBy, approvedAt, dateStr],
          );
          materialIds.push({ id: r.rows[0].id, status, total: totalAmount, date: dateStr });
          created.materials++;
        }
        sendProgress('materials', `Created ${created.materials} materials ✓`, 88);

        // 5d. Payments — create payments for all 'paid' materials
        sendProgress('payments', 'Processing payments for paid materials...', 90);
        for (const mat of materialIds) {
          if (mat.status !== 'paid') continue;

          const existsPay = await client.query(
            'SELECT id FROM pt_payments WHERE tenant_id = $1 AND material_id = $2',
            [tenantId, mat.id],
          );
          if (existsPay.rows.length > 0) continue;

          const mode = paymentModes[Math.floor(Math.random() * paymentModes.length)]!;
          const txnId = mode === 'upi' ? `UPI${Date.now()}${Math.floor(Math.random() * 9999)}`
            : mode === 'neft' || mode === 'bank_transfer' ? `NEFT${Math.floor(Math.random() * 9999999)}`
            : mode === 'cheque' ? `CHQ-${Math.floor(100000 + Math.random() * 899999)}`
            : null;

          // Payment date = 1–5 days after material entry
          const payDate = new Date(mat.date);
          payDate.setDate(payDate.getDate() + Math.floor(Math.random() * 5) + 1);

          await client.query(
            `INSERT INTO pt_payments (tenant_id, material_id, payment_mode, transaction_id, payment_date, paid_amount, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [tenantId, mat.id, mode, txnId, payDate.toISOString(), mat.total,
             `Payment for ${materialDefs[materialIds.indexOf(mat)]?.name ?? 'material'}`, userId],
          );
          created.payments++;
        }
        sendProgress('payments', `Created ${created.payments} payments ✓`, 95);
      }

      sendProgress('finalizing', 'Committing all data...', 97);
      await client.query('COMMIT');

      // Log this action
      try {
        await logActivity(
          userId,
          'SEED_SAMPLE_DATA',
          'system',
          undefined,
          `Created ${created.machines} machines, ${created.shifts} shifts, ${created.plans} plans, ${created.users} users, ${created.vendors} vendors, ${created.projects} projects, ${created.materials} materials, ${created.payments} payments`,
          req.ip,
        );
      } catch { /* ignore logging errors */ }

      // Send final completion event
      sendProgress('done', 'Sample data created successfully!', 100, {
        created,
        credentials: {
          operator: { username: 'operator1', password: 'Test@1234' },
          supervisor: { username: 'supervisor1', password: 'Test@1234' },
        },
      });
      res.end();
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[Admin] Seed sample data error:', err);
    sendProgress('error', 'Failed to seed sample data. Please try again.', -1);
    res.end();
  }
});
