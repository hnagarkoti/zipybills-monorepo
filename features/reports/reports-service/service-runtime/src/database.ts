/**
 * Reports Service – Database Operations
 *
 * All queries are tenant-scoped. tenantId = null means on-prem / unscoped.
 */

import { query } from '@zipybills/factory-database-config';

export async function getProductionReport(filters: {
  start_date: string;
  end_date: string;
  machine_id?: number;
  shift_id?: number;
}, tenantId?: number | null) {
  let where = 'WHERE pp.plan_date BETWEEN $1 AND $2';
  const params: any[] = [filters.start_date, filters.end_date];
  let idx = 3;

  if (filters.machine_id) { where += ` AND pp.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters.shift_id) { where += ` AND pp.shift_id = $${idx++}`; params.push(filters.shift_id); }
  if (tenantId != null) { where += ` AND pp.tenant_id = $${idx++}`; params.push(tenantId); }

  const result = await query(
    `SELECT pp.plan_date, m.machine_name, m.machine_code, s.shift_name,
            pp.product_name, pp.target_quantity,
            COALESCE(SUM(pl.quantity_produced), 0) as total_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as total_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as total_rejected
     FROM production_plans pp
     JOIN machines m ON m.machine_id = pp.machine_id
     JOIN shifts s ON s.shift_id = pp.shift_id
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id AND pl.deleted_at IS NULL
     ${where}
     GROUP BY pp.plan_id, pp.plan_date, m.machine_name, m.machine_code, s.shift_name, s.start_time, pp.product_name, pp.target_quantity
     ORDER BY pp.plan_date DESC, m.machine_code, s.start_time`,
    params,
  );
  return result.rows;
}

export async function getMachineWiseReport(startDate: string, endDate: string, tenantId?: number | null) {
  const tWhere = tenantId != null ? ' AND m.tenant_id = $3' : '';
  const tSubWhere = tenantId != null ? ' AND pp.tenant_id = $3' : '';
  const tSubWhereDl = tenantId != null ? ' AND dl.tenant_id = $3' : '';
  const params = tenantId != null ? [startDate, endDate, tenantId] : [startDate, endDate];

  const result = await query(
    `SELECT m.machine_id, m.machine_name, m.machine_code,
            COUNT(DISTINCT pp.plan_id) as plan_count,
            COALESCE(SUM(pp.target_quantity), 0) as target_quantity,
            COALESCE(SUM(pl.quantity_produced), 0) as total_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as total_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as total_rejected,
            COALESCE(SUM(dl.duration_min), 0) as total_downtime_min
     FROM machines m
     LEFT JOIN production_plans pp ON pp.machine_id = m.machine_id AND pp.plan_date BETWEEN $1 AND $2${tSubWhere} AND pp.deleted_at IS NULL
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id AND pl.deleted_at IS NULL
     LEFT JOIN downtime_logs dl ON dl.machine_id = m.machine_id AND DATE(dl.started_at) BETWEEN $1 AND $2${tSubWhereDl}
     WHERE m.deleted_at IS NULL${tWhere}
     GROUP BY m.machine_id, m.machine_name, m.machine_code
     ORDER BY m.machine_code`,
    params,
  );
  return result.rows;
}

export async function getShiftWiseReport(startDate: string, endDate: string, tenantId?: number | null) {
  const tWhere = tenantId != null ? ' AND s.tenant_id = $3' : '';
  const tSubWhere = tenantId != null ? ' AND pp.tenant_id = $3' : '';
  const params = tenantId != null ? [startDate, endDate, tenantId] : [startDate, endDate];

  const result = await query(
    `SELECT s.shift_id, s.shift_name,
            COUNT(DISTINCT pp.plan_id) as plan_count,
            COALESCE(SUM(pp.target_quantity), 0) as target_quantity,
            COALESCE(SUM(pl.quantity_produced), 0) as total_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as total_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as total_rejected
     FROM shifts s
     LEFT JOIN production_plans pp ON pp.shift_id = s.shift_id AND pp.plan_date BETWEEN $1 AND $2${tSubWhere} AND pp.deleted_at IS NULL
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id AND pl.deleted_at IS NULL
     WHERE s.is_active = true AND s.deleted_at IS NULL${tWhere}
     GROUP BY s.shift_id, s.shift_name
     ORDER BY s.start_time`,
    params,
  );
  return result.rows;
}

export async function getRejectionReport(startDate: string, endDate: string, tenantId?: number | null) {
  const tWhere = tenantId != null ? ' AND pl.tenant_id = $3' : '';
  const params = tenantId != null ? [startDate, endDate, tenantId] : [startDate, endDate];

  const result = await query(
    `SELECT pp.plan_date, pp.product_name, m.machine_name, s.shift_name,
            pl.quantity_produced, pl.quantity_ok, pl.quantity_rejected, pl.rejection_reason
     FROM production_logs pl
     JOIN production_plans pp ON pp.plan_id = pl.plan_id
     JOIN machines m ON m.machine_id = pl.machine_id
     JOIN shifts s ON s.shift_id = pl.shift_id
     WHERE pl.quantity_rejected > 0
       AND pl.deleted_at IS NULL
       AND pp.plan_date BETWEEN $1 AND $2${tWhere}
     ORDER BY pp.plan_date DESC, pl.quantity_rejected DESC`,
    params,
  );
  return result.rows;
}
