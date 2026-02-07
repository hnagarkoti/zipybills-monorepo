/**
 * FactoryOS Reports Service Interface
 *
 * Types and API contract for production, machine-wise, shift-wise, and rejection reports.
 */

export interface ReportFilters {
  start_date: string;
  end_date: string;
  machine_id?: number;
  shift_id?: number;
}

export interface ProductionReportRow {
  plan_date: string;
  machine_name: string;
  machine_code: string;
  shift_name: string;
  product_name: string;
  target_quantity: number;
  actual_produced: number;
  actual_ok: number;
  actual_rejected: number;
}

export interface MachineWiseReportRow {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  total_plans: number;
  total_target: number;
  total_produced: number;
  total_ok: number;
  total_rejected: number;
  total_downtime_min: number;
}

export interface ShiftWiseReportRow {
  shift_id: number;
  shift_name: string;
  total_plans: number;
  total_target: number;
  total_produced: number;
  total_ok: number;
  total_rejected: number;
}

export interface RejectionReportRow {
  rejection_reason: string;
  machine_name: string;
  shift_name: string;
  total_rejected: number;
  occurrences: number;
}
