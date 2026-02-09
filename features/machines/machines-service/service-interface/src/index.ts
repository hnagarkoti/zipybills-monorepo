/**
 * FactoryOS Machines Service Interface
 *
 * Types, API contract, and typed SDK client for machine management.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

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

// ─── Typed API Client ────────────────────────

export class MachinesApi extends BaseApi {
  async getMachines(): Promise<Machine[]> {
    const data = await this.request<{ success: boolean; machines: Machine[] }>('/api/machines');
    return data.machines;
  }

  async createMachine(req: CreateMachineRequest): Promise<Machine> {
    const data = await this.request<{ success: boolean; machine: Machine }>('/api/machines', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return data.machine;
  }

  async updateMachine(machineId: number, req: UpdateMachineRequest): Promise<Machine> {
    const data = await this.request<{ success: boolean; machine: Machine }>(
      `/api/machines/${machineId}`,
      { method: 'PUT', body: JSON.stringify(req) },
    );
    return data.machine;
  }

  async deleteMachine(machineId: number): Promise<void> {
    await this.request(`/api/machines/${machineId}`, { method: 'DELETE' });
  }
}
