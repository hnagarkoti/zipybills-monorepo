/**
 * Machines Service – Database Operations
 *
 * All queries are tenant-scoped. tenantId = null means on-prem / unscoped.
 */

import { query } from '@zipybills/factory-database-config';
import type { Machine } from '@zipybills/factory-machines-service-interface';

function tenantClause(paramIndex: number, tenantId?: number | null): { clause: string; params: any[] } {
  if (tenantId == null) return { clause: '', params: [] };
  return { clause: ` AND tenant_id = $${paramIndex}`, params: [tenantId] };
}

const NOT_DELETED = ' AND deleted_at IS NULL';

export async function getAllMachines(tenantId?: number | null): Promise<Machine[]> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE 1=1${t.clause}${NOT_DELETED}` : `WHERE deleted_at IS NULL`;
  const result = await query<Machine>(`SELECT * FROM machines ${where} ORDER BY machine_code`, t.params);
  return result.rows;
}

export async function getMachineById(machineId: number, tenantId?: number | null): Promise<Machine | null> {
  const t = tenantClause(2, tenantId);
  const result = await query<Machine>(`SELECT * FROM machines WHERE machine_id = $1${t.clause}${NOT_DELETED}`, [machineId, ...t.params]);
  return result.rows[0] || null;
}

export async function createMachine(data: {
  machine_code: string;
  machine_name: string;
  department?: string;
  machine_type?: string;
}, tenantId?: number | null): Promise<Machine> {
  const result = await query<Machine>(
    `INSERT INTO machines (machine_code, machine_name, department, machine_type, tenant_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.machine_code, data.machine_name, data.department || null, data.machine_type || null, tenantId || null],
  );
  return result.rows[0]!;
}

export async function updateMachine(
  machineId: number,
  data: { machine_name?: string; department?: string; machine_type?: string; status?: string },
  tenantId?: number | null,
): Promise<Machine | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.machine_name !== undefined) { sets.push(`machine_name = $${idx++}`); params.push(data.machine_name); }
  if (data.department !== undefined) { sets.push(`department = $${idx++}`); params.push(data.department); }
  if (data.machine_type !== undefined) { sets.push(`machine_type = $${idx++}`); params.push(data.machine_type); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); params.push(data.status); }
  sets.push(`updated_at = NOW()`);

  params.push(machineId);
  const t = tenantClause(idx + 1, tenantId);
  const result = await query<Machine>(
    `UPDATE machines SET ${sets.join(', ')} WHERE machine_id = $${idx}${t.clause} RETURNING *`,
    [...params, ...t.params],
  );
  return result.rows[0] || null;
}

export async function deleteMachine(machineId: number, tenantId?: number | null): Promise<boolean> {
  const t = tenantClause(2, tenantId);
  const result = await query(
    `UPDATE machines SET deleted_at = NOW(), status = 'INACTIVE', updated_at = NOW() WHERE machine_id = $1${t.clause} AND deleted_at IS NULL`,
    [machineId, ...t.params],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getMachineCount(tenantId?: number | null): Promise<number> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE 1=1${t.clause}${NOT_DELETED}` : `WHERE deleted_at IS NULL`;
  const result = await query(`SELECT COUNT(*) as count FROM machines ${where}`, t.params);
  return parseInt(result.rows[0]!.count, 10);
}
