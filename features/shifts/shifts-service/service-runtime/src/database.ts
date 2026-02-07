/**
 * Shifts Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { Shift } from '@zipybills/factory-shifts-service-interface';

export async function getAllShifts(): Promise<Shift[]> {
  const result = await query<Shift>('SELECT * FROM shifts ORDER BY start_time');
  return result.rows;
}

export async function getActiveShifts(): Promise<Shift[]> {
  const result = await query<Shift>('SELECT * FROM shifts WHERE is_active = true ORDER BY start_time');
  return result.rows;
}

export async function createShift(data: {
  shift_name: string;
  start_time: string;
  end_time: string;
}): Promise<Shift> {
  const result = await query<Shift>(
    `INSERT INTO shifts (shift_name, start_time, end_time) VALUES ($1, $2, $3) RETURNING *`,
    [data.shift_name, data.start_time, data.end_time],
  );
  return result.rows[0]!;
}

export async function updateShift(
  shiftId: number,
  data: { shift_name?: string; start_time?: string; end_time?: string; is_active?: boolean },
): Promise<Shift | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.shift_name !== undefined) { sets.push(`shift_name = $${idx++}`); params.push(data.shift_name); }
  if (data.start_time !== undefined) { sets.push(`start_time = $${idx++}`); params.push(data.start_time); }
  if (data.end_time !== undefined) { sets.push(`end_time = $${idx++}`); params.push(data.end_time); }
  if (data.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.is_active); }

  params.push(shiftId);
  const result = await query<Shift>(
    `UPDATE shifts SET ${sets.join(', ')} WHERE shift_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function deleteShift(shiftId: number): Promise<boolean> {
  const result = await query('DELETE FROM shifts WHERE shift_id = $1', [shiftId]);
  return (result.rowCount ?? 0) > 0;
}
