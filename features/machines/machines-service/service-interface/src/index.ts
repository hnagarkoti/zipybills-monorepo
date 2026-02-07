/**
 * FactoryOS Machines Service Interface
 *
 * Types and API contract for machine management.
 */

export interface Machine {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  department: string | null;
  machine_type: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
}

export interface CreateMachineRequest {
  machine_code: string;
  machine_name: string;
  department?: string;
  machine_type?: string;
}

export interface UpdateMachineRequest {
  machine_name?: string;
  department?: string;
  machine_type?: string;
  status?: string;
}
