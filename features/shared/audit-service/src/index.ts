/**
 * FactoryOS Audit Service
 *
 * Extends the basic activity_log with:
 * - Paginated query API with filters (user, action, entity, date range)
 * - Full-text search across details
 * - CSV/JSON export
 * - Log retention policies
 * - Auto-logging middleware for all API requests
 * - Audit statistics & analytics
 *
 * Routes:
 *   GET  /audit/logs          — paginated, filterable audit logs
 *   GET  /audit/logs/:id      — single log entry details
 *   GET  /audit/export        — export logs as CSV/JSON
 *   GET  /audit/stats         — audit statistics
 *   GET  /audit/actions       — list of unique action types
 *   POST /audit/retention     — set retention policy (ADMIN)
 */

import { Router } from 'express';
import { query } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';

export const auditRouter = Router();

// ─── Types ────────────────────────────────────

export interface AuditLogEntry {
  activity_id: number;
  user_id: number | null;
  username: string | null;
  full_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditQueryParams {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'action' | 'user_id';
  sortOrder?: 'asc' | 'desc';
}

// ─── Query Builder ────────────────────────────

/** Extract tenant_id from authenticated request JWT */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

function buildAuditQuery(params: AuditQueryParams, countOnly = false, tenantId?: number | null): { text: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  // Tenant isolation
  if (tenantId != null) {
    conditions.push(`al.tenant_id = $${idx++}`);
    values.push(tenantId);
  }

  if (params.userId) {
    conditions.push(`al.user_id = $${idx++}`);
    values.push(params.userId);
  }
  if (params.action) {
    conditions.push(`al.action = $${idx++}`);
    values.push(params.action);
  }
  if (params.entityType) {
    conditions.push(`al.entity_type = $${idx++}`);
    values.push(params.entityType);
  }
  if (params.entityId) {
    conditions.push(`al.entity_id = $${idx++}`);
    values.push(params.entityId);
  }
  if (params.search) {
    conditions.push(`(al.details ILIKE $${idx} OR al.action ILIKE $${idx} OR u.username ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }
  if (params.startDate) {
    conditions.push(`al.created_at >= $${idx++}`);
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push(`al.created_at <= $${idx++}`);
    values.push(params.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (countOnly) {
    return {
      text: `SELECT COUNT(*) as total FROM activity_log al LEFT JOIN users u ON al.user_id = u.user_id ${whereClause}`,
      values,
    };
  }

  const sortBy = params.sortBy ?? 'created_at';
  const sortOrder = params.sortOrder ?? 'desc';
  const limit = Math.min(params.limit ?? 50, 500);
  const offset = ((params.page ?? 1) - 1) * limit;

  return {
    text: `
      SELECT
        al.activity_id, al.user_id, u.username, u.full_name,
        al.action, al.entity_type, al.entity_id,
        al.details, al.ip_address, al.created_at
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.${sortBy} ${sortOrder}
      LIMIT $${idx++} OFFSET $${idx++}
    `,
    values: [...values, limit, offset],
  };
}

// ─── Routes ───────────────────────────────────

/** Paginated audit logs with filters */
auditRouter.get('/audit/logs', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const params: AuditQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    const dataQuery = buildAuditQuery(params, false, tenantId);
    const countQuery = buildAuditQuery(params, true, tenantId);

    const [dataResult, countResult] = await Promise.all([
      query(dataQuery.text, dataQuery.values),
      query(countQuery.text, countQuery.values),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);
    const limit = Math.min(params.limit ?? 50, 500);

    res.json({
      success: true,
      logs: dataResult.rows,
      pagination: {
        page: params.page ?? 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Audit] Query error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

/** Single log entry */
auditRouter.get('/audit/logs/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const tenantFilter = tenantId != null ? ' AND al.tenant_id = $2' : '';
    const params: any[] = [parseInt(req.params.id as string, 10)];
    if (tenantId != null) params.push(tenantId);

    const result = await query(
      `SELECT al.*, u.username, u.full_name
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.user_id
       WHERE al.activity_id = $1${tenantFilter}`,
      params,
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Log entry not found' });
      return;
    }

    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch log entry' });
  }
});

/** Export audit logs as CSV or JSON */
auditRouter.get('/audit/export', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const format = (req.query.format as string) || 'csv';
    const params: AuditQueryParams = {
      page: 1,
      limit: 10000,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    };

    const dataQuery = buildAuditQuery(params, false, tenantId);
    const result = await query(dataQuery.text, dataQuery.values);

    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'];
      const rows = result.rows.map((r: any) => [
        r.activity_id,
        r.created_at,
        r.full_name || r.username || 'System',
        r.action,
        r.entity_type || '',
        r.entity_id || '',
        (r.details || '').replace(/"/g, '""'),
        r.ip_address || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((r: any[]) => r.map((v) => `"${v}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
      res.json({ exportedAt: new Date().toISOString(), total: result.rows.length, logs: result.rows });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

/** Audit statistics */
auditRouter.get('/audit/stats', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const tWhere = tenantId != null ? 'WHERE tenant_id = $1' : '';
    const tAnd = tenantId != null ? 'AND al.tenant_id = $1' : '';
    const tParams = tenantId != null ? [tenantId] : [];

    const [totalResult, todayResult, topActionsResult, topUsersResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM activity_log ${tWhere}`, tParams),
      query(`SELECT COUNT(*) as today FROM activity_log WHERE created_at >= CURRENT_DATE ${tenantId != null ? 'AND tenant_id = $1' : ''}`, tParams),
      query(`SELECT action, COUNT(*) as count FROM activity_log ${tWhere} GROUP BY action ORDER BY count DESC LIMIT 10`, tParams),
      query(`
        SELECT u.username, u.full_name, COUNT(*) as count
        FROM activity_log al
        JOIN users u ON al.user_id = u.user_id
        WHERE al.created_at >= CURRENT_DATE - INTERVAL '7 days' ${tAnd}
        GROUP BY u.username, u.full_name
        ORDER BY count DESC
        LIMIT 10
      `, tParams),
    ]);

    res.json({
      success: true,
      stats: {
        totalLogs: parseInt(totalResult.rows[0]?.total ?? '0', 10),
        todayLogs: parseInt(todayResult.rows[0]?.today ?? '0', 10),
        topActions: topActionsResult.rows,
        topUsers: topUsersResult.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit stats' });
  }
});

/** List unique action types */
auditRouter.get('/audit/actions', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const tWhere = tenantId != null ? 'WHERE tenant_id = $1' : '';
    const tParams = tenantId != null ? [tenantId] : [];
    const result = await query(
      `SELECT DISTINCT action FROM activity_log ${tWhere} ORDER BY action`, tParams,
    );
    res.json({ success: true, actions: result.rows.map((r: any) => r.action) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch actions' });
  }
});

/** Set retention policy (delete old logs) */
auditRouter.post('/audit/retention', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { retainDays } = req.body;
    if (!retainDays || retainDays < 30) {
      res.status(400).json({
        success: false,
        error: 'retainDays is required and must be at least 30',
      });
      return;
    }

    const tenantId = getTenantId(req);
    const tenantFilter = tenantId != null ? ' AND tenant_id = $2' : '';
    const params: any[] = [retainDays];
    if (tenantId != null) params.push(tenantId);

    const result = await query(
      `DELETE FROM activity_log WHERE created_at < NOW() - INTERVAL '1 day' * $1${tenantFilter}`,
      params,
    );

    const { logActivity } = await import('@zipybills/factory-activity-log');
    await logActivity(
      req.user!.user_id,
      'AUDIT_RETENTION',
      'audit',
      undefined,
      `Deleted ${result.rowCount} logs older than ${retainDays} days`,
      req.ip,
      tenantId,
    );

    res.json({
      success: true,
      deleted: result.rowCount,
      message: `Deleted ${result.rowCount} logs older than ${retainDays} days`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to apply retention' });
  }
});

// ─── F6: Global Audit Search (Platform Super-Admin) ──────────

/**
 * Search audit logs across ALL tenants — requires SUPER_ADMIN role.
 * Returns tenant_id + tenant company_name for each entry.
 */
auditRouter.get('/audit/global', requireAuth, requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const params: AuditQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    // Pass tenantId = null explicitly → no tenant scoping
    const limit = Math.min(params.limit ?? 50, 500);
    const offset = ((params.page ?? 1) - 1) * limit;

    // Extended query that includes tenant info
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.userId) { conditions.push(`al.user_id = $${idx++}`); values.push(params.userId); }
    if (params.action) { conditions.push(`al.action = $${idx++}`); values.push(params.action); }
    if (params.entityType) { conditions.push(`al.entity_type = $${idx++}`); values.push(params.entityType); }
    if (params.entityId) { conditions.push(`al.entity_id = $${idx++}`); values.push(params.entityId); }
    if (params.search) {
      conditions.push(`(al.details ILIKE $${idx} OR al.action ILIKE $${idx} OR u.username ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }
    if (params.startDate) { conditions.push(`al.created_at >= $${idx++}`); values.push(params.startDate); }
    if (params.endDate) { conditions.push(`al.created_at <= $${idx++}`); values.push(params.endDate); }

    // Allow filtering by tenant_id via query param
    if (req.query.tenantId) {
      conditions.push(`al.tenant_id = $${idx++}`);
      values.push(parseInt(req.query.tenantId as string));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortBy = params.sortBy ?? 'created_at';
    const sortOrder = params.sortOrder ?? 'desc';

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT
           al.activity_id, al.user_id, u.username, u.full_name,
           al.action, al.entity_type, al.entity_id,
           al.details, al.ip_address, al.created_at,
           al.tenant_id, t.company_name AS tenant_name
         FROM activity_log al
         LEFT JOIN users u ON al.user_id = u.user_id
         LEFT JOIN tenants t ON al.tenant_id = t.tenant_id
         ${whereClause}
         ORDER BY al.${sortBy} ${sortOrder}
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset],
      ),
      query(
        `SELECT COUNT(*) as total FROM activity_log al LEFT JOIN users u ON al.user_id = u.user_id ${whereClause}`,
        values,
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    res.json({
      success: true,
      logs: dataResult.rows,
      pagination: {
        page: params.page ?? 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Audit] Global search error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch global audit logs' });
  }
});

// ─── J3: Cross-tenant attempt logs (Platform Super-Admin) ──────

/**
 * Query cross-tenant access attempts for security monitoring.
 */
auditRouter.get('/audit/cross-tenant-attempts', requireAuth, requireRole('SUPER_ADMIN'), async (_req: AuthenticatedRequest, res) => {
  try {
    const result = await query(
      `SELECT
         al.activity_id, al.user_id, u.username, u.full_name,
         al.entity_type, al.entity_id, al.details,
         al.ip_address, al.created_at, al.tenant_id,
         t.company_name AS tenant_name
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.user_id
       LEFT JOIN tenants t ON al.tenant_id = t.tenant_id
       WHERE al.action = 'CROSS_TENANT_ACCESS_ATTEMPT'
       ORDER BY al.created_at DESC
       LIMIT 200`,
    );

    res.json({ success: true, attempts: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch cross-tenant attempts' });
  }
});
