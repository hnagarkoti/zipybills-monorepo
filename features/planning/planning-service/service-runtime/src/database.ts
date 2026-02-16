/**
 * Planning Service – Database Operations
 *
 * All queries are tenant-scoped. tenantId = null means on-prem / unscoped.
 */

import { query } from '@zipybills/factory-database-config';
import type { ProductionPlan, ProductionLog } from '@zipybills/factory-planning-service-interface';

function tenantClause(alias: string, paramIndex: number, tenantId?: number | null): { clause: string; params: any[] } {
  if (tenantId == null) return { clause: '', params: [] };
  return { clause: ` AND ${alias}.tenant_id = $${paramIndex}`, params: [tenantId] };
}

export async function getProductionPlans(filters?: {
  date?: string;
  machine_id?: number;
  status?: string;
}, tenantId?: number | null): Promise<ProductionPlan[]> {
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.date) { where += ` AND pp.plan_date = $${idx++}`; params.push(filters.date); }
  if (filters?.machine_id) { where += ` AND pp.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters?.status) { where += ` AND pp.status = $${idx++}`; params.push(filters.status); }

  const t = tenantClause('pp', idx, tenantId);
  where += t.clause;
  params.push(...t.params);

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

export async function getPlanById(planId: number, tenantId?: number | null): Promise<ProductionPlan | null> {
  const t = tenantClause('pp', 2, tenantId);
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
     WHERE pp.plan_id = $1${t.clause}
     GROUP BY pp.plan_id, m.machine_name, m.machine_code, s.shift_name, s.start_time`,
    [planId, ...t.params],
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
}, tenantId?: number | null): Promise<ProductionPlan> {
  const result = await query<ProductionPlan>(
    `INSERT INTO production_plans (machine_id, shift_id, plan_date, product_name, product_code, target_quantity, created_by, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.machine_id, data.shift_id, data.plan_date, data.product_name, data.product_code || null, data.target_quantity, data.created_by || null, tenantId || null],
  );
  return result.rows[0]!;
}

export async function updatePlanStatus(planId: number, status: string, tenantId?: number | null): Promise<ProductionPlan | null> {
  const t = tenantClause('production_plans', 3, tenantId);
  const result = await query<ProductionPlan>(
    `UPDATE production_plans SET status = $1, updated_at = NOW() WHERE plan_id = $2${t.clause.replace('production_plans.', '')} RETURNING *`,
    [status, planId, ...t.params],
  );
  return result.rows[0] || null;
}

export async function updatePlan(
  planId: number,
  data: { machine_id?: number; shift_id?: number; plan_date?: string; product_name?: string; product_code?: string; target_quantity?: number },
  tenantId?: number | null,
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

  if (sets.length === 0) return getPlanById(planId, tenantId);
  sets.push(`updated_at = NOW()`);
  params.push(planId);

  const tIdx = idx + 1;
  if (tenantId != null) {
    const result = await query<ProductionPlan>(
      `UPDATE production_plans SET ${sets.join(', ')} WHERE plan_id = $${idx} AND tenant_id = $${tIdx} RETURNING *`,
      [...params, tenantId],
    );
    return result.rows[0] || null;
  }

  const result = await query<ProductionPlan>(
    `UPDATE production_plans SET ${sets.join(', ')} WHERE plan_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function deletePlan(planId: number, tenantId?: number | null): Promise<boolean> {
  // Soft delete related production logs (scoped)
  const t = tenantClause('production_logs', 2, tenantId);
  await query(`UPDATE production_logs SET deleted_at = NOW() WHERE plan_id = $1${t.clause.replace('production_logs.', '')} AND deleted_at IS NULL`, [planId, ...t.params]);
  // Soft delete the plan itself
  const t2 = tenantClause('production_plans', 2, tenantId);
  const result = await query(
    `UPDATE production_plans SET deleted_at = NOW(), status = 'CANCELLED', updated_at = NOW() WHERE plan_id = $1${t2.clause.replace('production_plans.', '')} AND deleted_at IS NULL`,
    [planId, ...t2.params],
  );
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
}, tenantId?: number | null): Promise<ProductionLog> {
  const result = await query<ProductionLog>(
    `INSERT INTO production_logs
       (plan_id, machine_id, shift_id, operator_id, quantity_produced, quantity_ok, quantity_rejected, rejection_reason, hour_slot, notes, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      data.plan_id || null, data.machine_id, data.shift_id, data.operator_id || null,
      data.quantity_produced, data.quantity_ok, data.quantity_rejected,
      data.rejection_reason || null, data.hour_slot || null, data.notes || null,
      tenantId || null,
    ],
  );

  // Auto-update plan status to IN_PROGRESS if still PLANNED
  if (data.plan_id) {
    const tClause = tenantId != null ? ` AND tenant_id = $2` : '';
    const tParams = tenantId != null ? [data.plan_id, tenantId] : [data.plan_id];
    await query(
      `UPDATE production_plans SET status = 'IN_PROGRESS', updated_at = NOW()
       WHERE plan_id = $1 AND status = 'PLANNED'${tClause}`,
      tParams,
    );
  }

  return result.rows[0]!;
}

export async function getProductionLogs(filters?: {
  plan_id?: number;
  machine_id?: number;
  shift_id?: number;
  date?: string;
}, tenantId?: number | null): Promise<ProductionLog[]> {
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.plan_id) { where += ` AND pl.plan_id = $${idx++}`; params.push(filters.plan_id); }
  if (filters?.machine_id) { where += ` AND pl.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters?.shift_id) { where += ` AND pl.shift_id = $${idx++}`; params.push(filters.shift_id); }
  if (filters?.date) { where += ` AND DATE(pl.logged_at) = $${idx++}`; params.push(filters.date); }

  const t = tenantClause('pl', idx, tenantId);
  where += t.clause;
  params.push(...t.params);

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
