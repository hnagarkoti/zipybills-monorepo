/**
 * Downtime Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { DowntimeLog } from '@zipybills/factory-downtime-service-interface';

export async function createDowntimeLog(data: {
  machine_id: number;
  shift_id?: number;
  operator_id?: number;
  reason: string;
  category: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
}): Promise<DowntimeLog> {
  let duration: number | null = null;
  if (data.started_at && data.ended_at) {
    const start = new Date(data.started_at).getTime();
    const end = new Date(data.ended_at).getTime();
    duration = Math.round((end - start) / 60000);
  }

  const result = await query<DowntimeLog>(
    `INSERT INTO downtime_logs
       (machine_id, shift_id, operator_id, reason, category, started_at, ended_at, duration_min, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.machine_id, data.shift_id || null, data.operator_id || null,
      data.reason, data.category, data.started_at,
      data.ended_at || null, duration, data.notes || null,
    ],
  );
  return result.rows[0]!;
}

export async function endDowntime(downtimeId: number, endedAt: string): Promise<DowntimeLog | null> {
  const existing = await query<DowntimeLog>('SELECT * FROM downtime_logs WHERE downtime_id = $1', [downtimeId]);
  if (!existing.rows[0]) return null;

  const start = new Date(existing.rows[0].started_at).getTime();
  const end = new Date(endedAt).getTime();
  const duration = Math.round((end - start) / 60000);

  const result = await query<DowntimeLog>(
    `UPDATE downtime_logs SET ended_at = $1, duration_min = $2 WHERE downtime_id = $3 RETURNING *`,
    [endedAt, duration, downtimeId],
  );
  return result.rows[0] || null;
}

export async function updateDowntimeLog(
  downtimeId: number,
  data: { reason?: string; category?: string; notes?: string; started_at?: string; ended_at?: string },
): Promise<DowntimeLog | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.reason !== undefined) { sets.push(`reason = $${idx++}`); params.push(data.reason); }
  if (data.category !== undefined) { sets.push(`category = $${idx++}`); params.push(data.category); }
  if (data.notes !== undefined) { sets.push(`notes = $${idx++}`); params.push(data.notes); }
  if (data.started_at !== undefined) { sets.push(`started_at = $${idx++}`); params.push(data.started_at); }
  if (data.ended_at !== undefined) {
    sets.push(`ended_at = $${idx++}`); params.push(data.ended_at);
    // Recalculate duration if both start and end are available
    const existing = await query<DowntimeLog>('SELECT * FROM downtime_logs WHERE downtime_id = $1', [downtimeId]);
    if (existing.rows[0]) {
      const start = new Date(data.started_at || existing.rows[0].started_at).getTime();
      const end = new Date(data.ended_at).getTime();
      sets.push(`duration_min = $${idx++}`); params.push(Math.round((end - start) / 60000));
    }
  }

  if (sets.length === 0) return null;
  params.push(downtimeId);

  const result = await query<DowntimeLog>(
    `UPDATE downtime_logs SET ${sets.join(', ')} WHERE downtime_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function deleteDowntimeLog(downtimeId: number): Promise<boolean> {
  const result = await query('DELETE FROM downtime_logs WHERE downtime_id = $1', [downtimeId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getDowntimeLogs(filters?: {
  machine_id?: number;
  category?: string;
  date?: string;
}): Promise<DowntimeLog[]> {
  let where = 'WHERE 1=1';
  const params: any[] = [];
  let idx = 1;

  if (filters?.machine_id) { where += ` AND dl.machine_id = $${idx++}`; params.push(filters.machine_id); }
  if (filters?.category) { where += ` AND dl.category = $${idx++}`; params.push(filters.category); }
  if (filters?.date) { where += ` AND DATE(dl.started_at) = $${idx++}`; params.push(filters.date); }

  const result = await query<DowntimeLog>(
    `SELECT dl.*, m.machine_name, s.shift_name, u.full_name as operator_name
     FROM downtime_logs dl
     JOIN machines m ON m.machine_id = dl.machine_id
     LEFT JOIN shifts s ON s.shift_id = dl.shift_id
     LEFT JOIN users u ON u.user_id = dl.operator_id
     ${where}
     ORDER BY dl.started_at DESC`,
    params,
  );
  return result.rows;
}
