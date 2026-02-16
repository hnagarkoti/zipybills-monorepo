/**
 * Shifts Service – Database Operations
 *
 * All queries are tenant-scoped. tenantId = null means on-prem / unscoped.
 */

import { query } from '@zipybills/factory-database-config';
import type { Shift } from '@zipybills/factory-shifts-service-interface';

function tenantClause(paramIndex: number, tenantId?: number | null): { clause: string; params: any[] } {
  if (tenantId == null) return { clause: '', params: [] };
  return { clause: ` AND tenant_id = $${paramIndex}`, params: [tenantId] };
}

const NOT_DELETED = ' AND deleted_at IS NULL';

export async function getAllShifts(tenantId?: number | null): Promise<Shift[]> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE 1=1${t.clause}${NOT_DELETED}` : `WHERE deleted_at IS NULL`;
  const result = await query<Shift>(`SELECT * FROM shifts ${where} ORDER BY start_time`, t.params);
  return result.rows;
}

export async function getActiveShifts(tenantId?: number | null): Promise<Shift[]> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE is_active = true${t.clause}${NOT_DELETED}` : `WHERE is_active = true AND deleted_at IS NULL`;
  const result = await query<Shift>(`SELECT * FROM shifts ${where} ORDER BY start_time`, t.params);
  return result.rows;
}

export async function createShift(data: {
  shift_name: string;
  start_time: string;
  end_time: string;
}, tenantId?: number | null): Promise<Shift> {
  const result = await query<Shift>(
    `INSERT INTO shifts (shift_name, start_time, end_time, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.shift_name, data.start_time, data.end_time, tenantId || null],
  );
  return result.rows[0]!;
}

export async function updateShift(
  shiftId: number,
  data: { shift_name?: string; start_time?: string; end_time?: string; is_active?: boolean },
  tenantId?: number | null,
): Promise<Shift | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.shift_name !== undefined) { sets.push(`shift_name = $${idx++}`); params.push(data.shift_name); }
  if (data.start_time !== undefined) { sets.push(`start_time = $${idx++}`); params.push(data.start_time); }
  if (data.end_time !== undefined) { sets.push(`end_time = $${idx++}`); params.push(data.end_time); }
  if (data.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.is_active); }

  params.push(shiftId);
  const t = tenantClause(idx + 1, tenantId);
  const result = await query<Shift>(
    `UPDATE shifts SET ${sets.join(', ')} WHERE shift_id = $${idx}${t.clause} RETURNING *`,
    [...params, ...t.params],
  );
  return result.rows[0] || null;
}

export async function deleteShift(shiftId: number, tenantId?: number | null): Promise<boolean> {
  const t = tenantClause(2, tenantId);
  const result = await query(
    `UPDATE shifts SET deleted_at = NOW(), is_active = false WHERE shift_id = $1${t.clause} AND deleted_at IS NULL`,
    [shiftId, ...t.params],
  );
  return (result.rowCount ?? 0) > 0;
}
