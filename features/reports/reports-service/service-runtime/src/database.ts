/**
 * Reports Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';

export async function getProductionReport(filters: {
  start_date: string;
  end_date: string;
  machine_id?: number;
  shift_id?: number;
}) {
  let where = 'WHERE pp.plan_date BETWEEN $1 AND $2';
  const params: any[] = [filters.start_date, filters.end_date];
  let idx = 3;

  if (filters.machine_id) { where += ` AND pp.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters.shift_id) { where += ` AND pp.shift_id = $${idx++}`; params.push(filters.shift_id); }

  const result = await query(
    `SELECT pp.plan_date, m.machine_name, m.machine_code, s.shift_name,
            pp.product_name, pp.target_quantity,
            COALESCE(SUM(pl.quantity_produced), 0) as actual_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as actual_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as actual_rejected
     FROM production_plans pp
     JOIN machines m ON m.machine_id = pp.machine_id
     JOIN shifts s ON s.shift_id = pp.shift_id
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id
     ${where}
     GROUP BY pp.plan_id, pp.plan_date, m.machine_name, m.machine_code, s.shift_name, s.start_time, pp.product_name, pp.target_quantity
     ORDER BY pp.plan_date DESC, m.machine_code, s.start_time`,
    params,
  );
  return result.rows;
}

export async function getMachineWiseReport(startDate: string, endDate: string) {
  const result = await query(
    `SELECT m.machine_id, m.machine_name, m.machine_code,
            COUNT(DISTINCT pp.plan_id) as total_plans,
            COALESCE(SUM(pp.target_quantity), 0) as total_target,
            COALESCE(SUM(pl.quantity_produced), 0) as total_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as total_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as total_rejected,
            COALESCE(SUM(dl.duration_min), 0) as total_downtime_min
     FROM machines m
     LEFT JOIN production_plans pp ON pp.machine_id = m.machine_id AND pp.plan_date BETWEEN $1 AND $2
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id
     LEFT JOIN downtime_logs dl ON dl.machine_id = m.machine_id AND DATE(dl.started_at) BETWEEN $1 AND $2
     GROUP BY m.machine_id, m.machine_name, m.machine_code
     ORDER BY m.machine_code`,
    [startDate, endDate],
  );
  return result.rows;
}

export async function getShiftWiseReport(startDate: string, endDate: string) {
  const result = await query(
    `SELECT s.shift_id, s.shift_name,
            COUNT(DISTINCT pp.plan_id) as total_plans,
            COALESCE(SUM(pp.target_quantity), 0) as total_target,
            COALESCE(SUM(pl.quantity_produced), 0) as total_produced,
            COALESCE(SUM(pl.quantity_ok), 0) as total_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as total_rejected
     FROM shifts s
     LEFT JOIN production_plans pp ON pp.shift_id = s.shift_id AND pp.plan_date BETWEEN $1 AND $2
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id
     WHERE s.is_active = true
     GROUP BY s.shift_id, s.shift_name
     ORDER BY s.start_time`,
    [startDate, endDate],
  );
  return result.rows;
}

export async function getRejectionReport(startDate: string, endDate: string) {
  const result = await query(
    `SELECT pl.rejection_reason, m.machine_name, s.shift_name,
            SUM(pl.quantity_rejected) as total_rejected,
            COUNT(*) as occurrences
     FROM production_logs pl
     JOIN machines m ON m.machine_id = pl.machine_id
     JOIN shifts s ON s.shift_id = pl.shift_id
     WHERE pl.quantity_rejected > 0
       AND DATE(pl.logged_at) BETWEEN $1 AND $2
     GROUP BY pl.rejection_reason, m.machine_name, s.shift_name
     ORDER BY total_rejected DESC`,
    [startDate, endDate],
  );
  return result.rows;
}
