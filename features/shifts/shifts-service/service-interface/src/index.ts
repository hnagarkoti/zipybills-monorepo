/**
 * FactoryOS Shifts Service Interface
 *
 * Types, API contract, and typed SDK client for shift management.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

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

// ─── Typed API Client ────────────────────────

export class ShiftsApi extends BaseApi {
  async getShifts(): Promise<Shift[]> {
    const data = await this.request<{ success: boolean; shifts: Shift[] }>('/api/shifts');
    return data.shifts;
  }

  async createShift(req: CreateShiftRequest): Promise<Shift> {
    const data = await this.request<{ success: boolean; shift: Shift }>('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return data.shift;
  }

  async updateShift(shiftId: number, req: UpdateShiftRequest): Promise<Shift> {
    const data = await this.request<{ success: boolean; shift: Shift }>(`/api/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
    return data.shift;
  }

  async deleteShift(shiftId: number): Promise<void> {
    await this.request(`/api/shifts/${shiftId}`, { method: 'DELETE' });
  }
}
