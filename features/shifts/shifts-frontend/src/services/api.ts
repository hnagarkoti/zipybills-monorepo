import { apiFetch } from '@zipybills/factory-api-client';

export interface Shift {
  shift_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export async function fetchShifts(): Promise<Shift[]> {
  const data = await apiFetch<{ success: boolean; shifts: Shift[] }>('/api/shifts');
  return data.shifts;
}

export async function createShift(shiftData: { shift_name: string; start_time: string; end_time: string }): Promise<Shift> {
  const data = await apiFetch<{ success: boolean; shift: Shift }>('/api/shifts', { method: 'POST', body: JSON.stringify(shiftData) });
  return data.shift;
}

export async function updateShift(shiftId: number, shiftData: Partial<Shift>): Promise<Shift> {
  const data = await apiFetch<{ success: boolean; shift: Shift }>(`/api/shifts/${shiftId}`, { method: 'PUT', body: JSON.stringify(shiftData) });
  return data.shift;
}

export async function deleteShift(shiftId: number): Promise<void> {
  await apiFetch(`/api/shifts/${shiftId}`, { method: 'DELETE' });
}
