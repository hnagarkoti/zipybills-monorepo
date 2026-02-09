/**
 * Planning Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { ProductionPlan, ProductionLog } from '@zipybills/factory-planning-service-interface';

export async function getProductionPlans(filters?: {
  date?: string;
  machine_id?: number;
  status?: string;
}): Promise<ProductionPlan[]> {
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.date) { where += ` AND pp.plan_date = $${idx++}`; params.push(filters.date); }
  if (filters?.machine_id) { where += ` AND pp.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters?.status) { where += ` AND pp.status = $${idx++}`; params.push(filters.status); }

  const result = await query<ProductionPlan>(
    `SELECT pp.*,
            m.machine_name, m.machine_code,
            s.shift_name,
            COALESCE(SUM(pl.quantity_produced), 0) as actual_quantity,
            COALESCE(SUM(pl.quantity_ok), 0) as actual_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as actual_rejected
     FROM production_plans pp
     JOIN machines m ON m.machine_id = pp.machine_id
     JOIN shifts s ON s.shift_id = pp.shift_id
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id
     ${where}
     GROUP BY pp.plan_id, m.machine_name, m.machine_code, s.shift_name, s.start_time
     ORDER BY pp.plan_date DESC, s.start_time`,
    params,
  );
  return result.rows;
}

export async function getPlanById(planId: number): Promise<ProductionPlan | null> {
  const result = await query<ProductionPlan>(
    `SELECT pp.*,
            m.machine_name, m.machine_code,
            s.shift_name,
            COALESCE(SUM(pl.quantity_produced), 0) as actual_quantity,
            COALESCE(SUM(pl.quantity_ok), 0) as actual_ok,
            COALESCE(SUM(pl.quantity_rejected), 0) as actual_rejected
     FROM production_plans pp
     JOIN machines m ON m.machine_id = pp.machine_id
     JOIN shifts s ON s.shift_id = pp.shift_id
     LEFT JOIN production_logs pl ON pl.plan_id = pp.plan_id
     WHERE pp.plan_id = $1
     GROUP BY pp.plan_id, m.machine_name, m.machine_code, s.shift_name, s.start_time`,
    [planId],
  );
  return result.rows[0] || null;
}

export async function createProductionPlan(data: {
  machine_id: number;
  shift_id: number;
  plan_date: string;
  product_name: string;
  product_code?: string;
  target_quantity: number;
  created_by?: number;
}): Promise<ProductionPlan> {
  const result = await query<ProductionPlan>(
    `INSERT INTO production_plans (machine_id, shift_id, plan_date, product_name, product_code, target_quantity, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.machine_id, data.shift_id, data.plan_date, data.product_name, data.product_code || null, data.target_quantity, data.created_by || null],
  );
  return result.rows[0]!;
}

export async function updatePlanStatus(planId: number, status: string): Promise<ProductionPlan | null> {
  const result = await query<ProductionPlan>(
    `UPDATE production_plans SET status = $1, updated_at = NOW() WHERE plan_id = $2 RETURNING *`,
    [status, planId],
  );
  return result.rows[0] || null;
}

export async function updatePlan(
  planId: number,
  data: { machine_id?: number; shift_id?: number; plan_date?: string; product_name?: string; product_code?: string; target_quantity?: number },
): Promise<ProductionPlan | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.machine_id !== undefined) { sets.push(`machine_id = $${idx++}`); params.push(data.machine_id); }
  if (data.shift_id !== undefined) { sets.push(`shift_id = $${idx++}`); params.push(data.shift_id); }
  if (data.plan_date !== undefined) { sets.push(`plan_date = $${idx++}`); params.push(data.plan_date); }
  if (data.product_name !== undefined) { sets.push(`product_name = $${idx++}`); params.push(data.product_name); }
  if (data.product_code !== undefined) { sets.push(`product_code = $${idx++}`); params.push(data.product_code); }
  if (data.target_quantity !== undefined) { sets.push(`target_quantity = $${idx++}`); params.push(data.target_quantity); }

  if (sets.length === 0) return getPlanById(planId);
  sets.push(`updated_at = NOW()`);
  params.push(planId);

  const result = await query<ProductionPlan>(
    `UPDATE production_plans SET ${sets.join(', ')} WHERE plan_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function deletePlan(planId: number): Promise<boolean> {
  // First delete related production logs
  await query('DELETE FROM production_logs WHERE plan_id = $1', [planId]);
  const result = await query('DELETE FROM production_plans WHERE plan_id = $1', [planId]);
  return (result.rowCount ?? 0) > 0;
}

export async function createProductionLog(data: {
  plan_id?: number;
  machine_id: number;
  shift_id: number;
  operator_id?: number;
  quantity_produced: number;
  quantity_ok: number;
  quantity_rejected: number;
  rejection_reason?: string;
  hour_slot?: string;
  notes?: string;
}): Promise<ProductionLog> {
  const result = await query<ProductionLog>(
    `INSERT INTO production_logs
       (plan_id, machine_id, shift_id, operator_id, quantity_produced, quantity_ok, quantity_rejected, rejection_reason, hour_slot, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      data.plan_id || null, data.machine_id, data.shift_id, data.operator_id || null,
      data.quantity_produced, data.quantity_ok, data.quantity_rejected,
      data.rejection_reason || null, data.hour_slot || null, data.notes || null,
    ],
  );

  // Auto-update plan status to IN_PROGRESS if still PLANNED
  if (data.plan_id) {
    await query(
      `UPDATE production_plans SET status = 'IN_PROGRESS', updated_at = NOW()
       WHERE plan_id = $1 AND status = 'PLANNED'`,
      [data.plan_id],
    );
  }

  return result.rows[0]!;
}

export async function getProductionLogs(filters?: {
  plan_id?: number;
  machine_id?: number;
  shift_id?: number;
  date?: string;
}): Promise<ProductionLog[]> {
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.plan_id) { where += ` AND pl.plan_id = $${idx++}`; params.push(filters.plan_id); }
  if (filters?.machine_id) { where += ` AND pl.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters?.shift_id) { where += ` AND pl.shift_id = $${idx++}`; params.push(filters.shift_id); }
  if (filters?.date) { where += ` AND DATE(pl.logged_at) = $${idx++}`; params.push(filters.date); }

  const result = await query<ProductionLog>(
    `SELECT pl.*, m.machine_name, s.shift_name, u.full_name as operator_name
     FROM production_logs pl
     JOIN machines m ON m.machine_id = pl.machine_id
     JOIN shifts s ON s.shift_id = pl.shift_id
     LEFT JOIN users u ON u.user_id = pl.operator_id
     ${where}
     ORDER BY pl.logged_at DESC`,
    params,
  );
  return result.rows;
}
