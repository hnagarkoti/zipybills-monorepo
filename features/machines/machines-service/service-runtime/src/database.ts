/**
 * Machines Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { Machine } from '@zipybills/factory-machines-service-interface';

export async function getAllMachines(): Promise<Machine[]> {
  const result = await query<Machine>('SELECT * FROM machines ORDER BY machine_code');
  return result.rows;
}

export async function getMachineById(machineId: number): Promise<Machine | null> {
  const result = await query<Machine>('SELECT * FROM machines WHERE machine_id = $1', [machineId]);
  return result.rows[0] || null;
}

export async function createMachine(data: {
  machine_code: string;
  machine_name: string;
  department?: string;
  machine_type?: string;
}): Promise<Machine> {
  const result = await query<Machine>(
    `INSERT INTO machines (machine_code, machine_name, department, machine_type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.machine_code, data.machine_name, data.department || null, data.machine_type || null],
  );
  return result.rows[0]!;
}

export async function updateMachine(
  machineId: number,
  data: { machine_name?: string; department?: string; machine_type?: string; status?: string },
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
  const result = await query<Machine>(
    `UPDATE machines SET ${sets.join(', ')} WHERE machine_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function deleteMachine(machineId: number): Promise<boolean> {
  const result = await query('DELETE FROM machines WHERE machine_id = $1', [machineId]);
  return (result.rowCount ?? 0) > 0;
}
