import { apiFetch } from '@zipybills/factory-api-client';

export interface DowntimeLog {
  downtime_id: number;
  machine_id: number;
  reason: string;
  category: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  notes: string | null;
  machine_name?: string;
  shift_name?: string;
  operator_name?: string;
  // aliases used by frontend
  start_time?: string;
  end_time?: string;
  duration_minutes?: number | null;
}

export async function fetchDowntimeLogs(filters?: { machine_id?: number; category?: string; date?: string }): Promise<DowntimeLog[]> {
  const params = new URLSearchParams();
  if (filters?.machine_id) params.append('machine_id', String(filters.machine_id));
  if (filters?.category) params.append('category', filters.category);
  if (filters?.date) params.append('date', filters.date);
  const qs = params.toString();
  const data = await apiFetch<{ success: boolean; logs: DowntimeLog[] }>(`/api/downtime${qs ? `?${qs}` : ''}`);
  return data.logs;
}

export async function createDowntimeLog(downtimeData: { machine_id: number; category: string; reason?: string }): Promise<DowntimeLog> {
  const data = await apiFetch<{ success: boolean; log: DowntimeLog }>('/api/downtime', { method: 'POST', body: JSON.stringify(downtimeData) });
  return data.log;
}

export async function endDowntimeLog(downtimeId: number): Promise<DowntimeLog> {
  const data = await apiFetch<{ success: boolean; log: DowntimeLog }>(`/api/downtime/${downtimeId}/end`, { method: 'PUT' });
  return data.log;
}
