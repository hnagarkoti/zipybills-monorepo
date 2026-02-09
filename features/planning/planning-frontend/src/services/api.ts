/**
 * Planning & Production Logs API – uses typed SDK from service-interface
 */

import {
  PlanningApi,
  ProductionLogsApi,
  type ProductionPlan,
  type CreatePlanRequest,
  type PlanFilters,
  type ProductionLog,
  type CreateProductionLogRequest,
  type ProductionLogFilters,
} from '@zipybills/factory-planning-service-interface';

export type {
  ProductionPlan,
  CreatePlanRequest,
  PlanFilters,
  ProductionLog,
  CreateProductionLogRequest,
  ProductionLogFilters,
} from '@zipybills/factory-planning-service-interface';

export const planningApi = new PlanningApi();
export const productionLogsApi = new ProductionLogsApi();

export async function fetchPlans(filters?: PlanFilters): Promise<ProductionPlan[]> {
  return planningApi.getPlans(filters);
}

export async function createPlan(planData: CreatePlanRequest): Promise<ProductionPlan> {
  return planningApi.createPlan(planData);
}

export async function updatePlanStatus(planId: number, status: string): Promise<ProductionPlan> {
  return planningApi.updatePlanStatus(planId, status);
}

export async function fetchProductionLogs(filters?: ProductionLogFilters): Promise<ProductionLog[]> {
  return productionLogsApi.getLogs(filters);
}

export async function createProductionLog(logData: CreateProductionLogRequest): Promise<ProductionLog> {
  return productionLogsApi.createLog(logData);
}
