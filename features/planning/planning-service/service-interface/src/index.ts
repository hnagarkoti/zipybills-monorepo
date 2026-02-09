/**
 * FactoryOS Planning Service Interface
 *
 * Types, API contract, and typed SDK client for production plans and operator logs.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

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

export interface PlanFilters {
  date?: string;
  machine_id?: number;
  status?: string;
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

export interface ProductionLogFilters {
  plan_id?: number;
  machine_id?: number;
  shift_id?: number;
  date?: string;
}

// ─── Typed API Client ────────────────────────

export class PlanningApi extends BaseApi {
  async getPlans(filters?: PlanFilters): Promise<ProductionPlan[]> {
    const qs = filters ? this.buildQuery(filters) : '';
    const data = await this.request<{ success: boolean; plans: ProductionPlan[] }>(
      `/api/plans${qs}`,
    );
    return data.plans;
  }

  async createPlan(req: CreatePlanRequest): Promise<ProductionPlan> {
    const data = await this.request<{ success: boolean; plan: ProductionPlan }>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return data.plan;
  }

  async updatePlanStatus(planId: number, status: string): Promise<ProductionPlan> {
    const data = await this.request<{ success: boolean; plan: ProductionPlan }>(
      `/api/plans/${planId}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) },
    );
    return data.plan;
  }

  async deletePlan(planId: number): Promise<void> {
    await this.request(`/api/plans/${planId}`, { method: 'DELETE' });
  }
}

export class ProductionLogsApi extends BaseApi {
  async getLogs(filters?: ProductionLogFilters): Promise<ProductionLog[]> {
    const qs = filters ? this.buildQuery(filters) : '';
    const data = await this.request<{ success: boolean; logs: ProductionLog[] }>(
      `/api/production-logs${qs}`,
    );
    return data.logs;
  }

  async createLog(req: CreateProductionLogRequest): Promise<ProductionLog> {
    const data = await this.request<{ success: boolean; log: ProductionLog }>(
      '/api/production-logs',
      { method: 'POST', body: JSON.stringify(req) },
    );
    return data.log;
  }
}
