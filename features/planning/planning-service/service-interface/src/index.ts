/**
 * FactoryOS Planning Service Interface
 *
 * Types and API contract for production plans and operator logs.
 */

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
  updated_at: string;
  machine_name?: string;
  machine_code?: string;
  shift_name?: string;
  actual_quantity?: number;
  actual_ok?: number;
  actual_rejected?: number;
}

export interface CreatePlanRequest {
  machine_id: number;
  shift_id: number;
  plan_date: string;
  product_name: string;
  product_code?: string;
  target_quantity: number;
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
  created_at: string;
  machine_name?: string;
  shift_name?: string;
  operator_name?: string;
}

export interface CreateProductionLogRequest {
  plan_id?: number;
  machine_id: number;
  shift_id: number;
  quantity_produced: number;
  quantity_ok?: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  hour_slot?: string;
  notes?: string;
}
