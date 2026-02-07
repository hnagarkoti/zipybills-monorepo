import { apiFetch } from '@zipybills/factory-api-client';

export async function fetchProductionReport(filters: { start_date: string; end_date: string; machine_id?: number; shift_id?: number }) {
  const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
  if (filters.machine_id) params.append('machine_id', String(filters.machine_id));
  if (filters.shift_id) params.append('shift_id', String(filters.shift_id));
  const data = await apiFetch<{ success: boolean; data: any[] }>(`/api/reports/production?${params}`);
  return data.data;
}

export async function fetchMachineWiseReport(filters: { start_date: string; end_date: string }) {
  const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
  const data = await apiFetch<{ success: boolean; data: any[] }>(`/api/reports/machine-wise?${params}`);
  return data.data;
}

export async function fetchShiftWiseReport(filters: { start_date: string; end_date: string }) {
  const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
  const data = await apiFetch<{ success: boolean; data: any[] }>(`/api/reports/shift-wise?${params}`);
  return data.data;
}

export async function fetchRejectionReport(filters: { start_date: string; end_date: string }) {
  const params = new URLSearchParams({ start_date: filters.start_date, end_date: filters.end_date });
  const data = await apiFetch<{ success: boolean; data: any[] }>(`/api/reports/rejections?${params}`);
  return data.data;
}
