/**
 * FactoryOS Reports Service Interface
 *
 * Types, API contract, and typed SDK client for production reports.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

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
  total_produced: number;
  total_ok: number;
  total_rejected: number;
}

export interface MachineWiseReportRow {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  plan_count: number;
  target_quantity: number;
  total_produced: number;
  total_ok: number;
  total_rejected: number;
  total_downtime_min: number;
}

export interface ShiftWiseReportRow {
  shift_id: number;
  shift_name: string;
  plan_count: number;
  target_quantity: number;
  total_produced: number;
  total_ok: number;
  total_rejected: number;
}

export interface RejectionReportRow {
  plan_date: string;
  product_name: string;
  machine_name: string;
  shift_name: string;
  quantity_produced: number;
  quantity_ok: number;
  quantity_rejected: number;
  rejection_reason: string;
}

// ─── Typed API Client ────────────────────────

export class ReportsApi extends BaseApi {
  async getProductionReport(filters: ReportFilters): Promise<ProductionReportRow[]> {
    const qs = this.buildQuery(filters);
    const data = await this.request<{ success: boolean; data: ProductionReportRow[] }>(
      `/api/reports/production${qs}`,
    );
    return data.data;
  }

  async getMachineWiseReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<MachineWiseReportRow[]> {
    const qs = this.buildQuery(filters);
    const data = await this.request<{ success: boolean; data: MachineWiseReportRow[] }>(
      `/api/reports/machine-wise${qs}`,
    );
    return data.data;
  }

  async getShiftWiseReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<ShiftWiseReportRow[]> {
    const qs = this.buildQuery(filters);
    const data = await this.request<{ success: boolean; data: ShiftWiseReportRow[] }>(
      `/api/reports/shift-wise${qs}`,
    );
    return data.data;
  }

  async getRejectionReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<RejectionReportRow[]> {
    const qs = this.buildQuery(filters);
    const data = await this.request<{ success: boolean; data: RejectionReportRow[] }>(
      `/api/reports/rejections${qs}`,
    );
    return data.data;
  }
}
