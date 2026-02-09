/**
 * Dashboard API – uses typed SDK from service-interface
 */

import {
  DashboardApi,
  type DashboardStats,
} from '@zipybills/factory-dashboard-service-interface';

export type DashboardData = DashboardStats;
export type {
  MachineStatus,
  ShiftSummary,
  ActivityItem,
  DashboardStats,
} from '@zipybills/factory-dashboard-service-interface';

export const dashboardApi = new DashboardApi();

export async function fetchDashboard(): Promise<DashboardStats> {
  return dashboardApi.getDashboard();
}
