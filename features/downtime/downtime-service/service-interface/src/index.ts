/**
 * FactoryOS Downtime Service Interface
 *
 * Types, API contract, and typed SDK client for downtime tracking.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

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

export interface DowntimeFilters {
  machine_id?: number;
  category?: string;
  date?: string;
}

// ─── Typed API Client ────────────────────────

export class DowntimeApi extends BaseApi {
  async getDowntimeLogs(filters?: DowntimeFilters): Promise<DowntimeLog[]> {
    const qs = filters ? this.buildQuery(filters) : '';
    const data = await this.request<{ success: boolean; logs: DowntimeLog[] }>(
      `/api/downtime${qs}`,
    );
    return data.logs;
  }

  async createDowntimeLog(req: CreateDowntimeRequest): Promise<DowntimeLog> {
    const data = await this.request<{ success: boolean; log: DowntimeLog }>('/api/downtime', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return data.log;
  }

  async endDowntimeLog(downtimeId: number): Promise<DowntimeLog> {
    const data = await this.request<{ success: boolean; log: DowntimeLog }>(
      `/api/downtime/${downtimeId}/end`,
      { method: 'PUT' },
    );
    return data.log;
  }

  async updateDowntimeLog(downtimeId: number, req: Partial<CreateDowntimeRequest>): Promise<DowntimeLog> {
    const data = await this.request<{ success: boolean; log: DowntimeLog }>(
      `/api/downtime/${downtimeId}`,
      { method: 'PUT', body: JSON.stringify(req) },
    );
    return data.log;
  }

  async deleteDowntimeLog(downtimeId: number): Promise<void> {
    await this.request(`/api/downtime/${downtimeId}`, { method: 'DELETE' });
  }
}
