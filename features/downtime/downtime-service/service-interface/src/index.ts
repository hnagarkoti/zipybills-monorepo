/**
 * FactoryOS Downtime Service Interface
 *
 * Types and API contract for downtime tracking.
 */

export interface DowntimeLog {
  downtime_id: number;
  machine_id: number;
  shift_id: number | null;
  operator_id: number | null;
  reason: string;
  category: 'BREAKDOWN' | 'MAINTENANCE' | 'CHANGEOVER' | 'MATERIAL' | 'POWER' | 'QUALITY' | 'OTHER';
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  notes: string | null;
  created_at: string;
  machine_name?: string;
  shift_name?: string;
  operator_name?: string;
}

export interface CreateDowntimeRequest {
  machine_id: number;
  shift_id?: number;
  reason: string;
  category: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
}
