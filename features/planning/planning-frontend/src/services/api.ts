import { apiFetch } from '@zipybills/factory-api-client';

export interface ProductionPlan {
  plan_id: number;
  machine_id: number;
  shift_id: number;
  plan_date: string;
  product_name: string;
  product_code: string | null;
  target_quantity: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_by: number | null;
  created_at: string;
  machine_name?: string;
  machine_code?: string;
  shift_name?: string;
  actual_quantity?: number;
  actual_ok?: number;
  actual_rejected?: number;
}

export interface ProductionLog {
  log_id: number;
  plan_id: number | null;
  machine_id: number;
  shift_id: number;
  operator_id: number | null;
  quantity_produced: number;
  quantity_ok: number;
  quantity_rejected: number;
  rejection_reason: string | null;
  hour_slot: string | null;
  notes: string | null;
  logged_at: string;
  machine_name?: string;
  shift_name?: string;
  operator_name?: string;
}

export async function fetchPlans(filters?: { date?: string; machine_id?: number; status?: string }): Promise<ProductionPlan[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.machine_id) params.append('machine_id', String(filters.machine_id));
  if (filters?.status) params.append('status', filters.status);
  const qs = params.toString();
  const data = await apiFetch<{ success: boolean; plans: ProductionPlan[] }>(`/api/plans${qs ? `?${qs}` : ''}`);
  return data.plans;
}

export async function createPlan(planData: {
  machine_id: number; shift_id: number; plan_date: string;
  product_name: string; product_code?: string; target_quantity: number;
}): Promise<ProductionPlan> {
  const data = await apiFetch<{ success: boolean; plan: ProductionPlan }>('/api/plans', { method: 'POST', body: JSON.stringify(planData) });
  return data.plan;
}

export async function updatePlanStatus(planId: number, status: string): Promise<ProductionPlan> {
  const data = await apiFetch<{ success: boolean; plan: ProductionPlan }>(`/api/plans/${planId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  return data.plan;
}

export async function fetchProductionLogs(filters?: { plan_id?: number; machine_id?: number; shift_id?: number; date?: string }): Promise<ProductionLog[]> {
  const params = new URLSearchParams();
  if (filters?.plan_id) params.append('plan_id', String(filters.plan_id));
  if (filters?.machine_id) params.append('machine_id', String(filters.machine_id));
  if (filters?.shift_id) params.append('shift_id', String(filters.shift_id));
  if (filters?.date) params.append('date', filters.date);
  const qs = params.toString();
  const data = await apiFetch<{ success: boolean; logs: ProductionLog[] }>(`/api/production-logs${qs ? `?${qs}` : ''}`);
  return data.logs;
}

export async function createProductionLog(logData: {
  plan_id: number; hour_slot: number; quantity_produced: number;
  quantity_ok?: number; quantity_rejected?: number; rejection_reason?: string; notes?: string;
}): Promise<ProductionLog> {
  const data = await apiFetch<{ success: boolean; log: ProductionLog }>('/api/production-logs', { method: 'POST', body: JSON.stringify(logData) });
  return data.log;
}
