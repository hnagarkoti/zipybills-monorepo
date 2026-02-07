/**
 * FactoryOS Shifts Service Interface
 *
 * Types and API contract for shift management.
 */

export interface Shift {
  shift_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateShiftRequest {
  shift_name: string;
  start_time: string;
  end_time: string;
}

export interface UpdateShiftRequest {
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}
