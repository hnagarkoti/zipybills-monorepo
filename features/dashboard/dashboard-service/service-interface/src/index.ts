/**
 * FactoryOS Dashboard Service Interface
 *
 * Types, API contract, and typed SDK client for dashboard & live stats.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

export interface MachineStatus {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  status: string;
  today_produced: number;
  today_target: number;
}

export interface ShiftSummary {
  shift_name: string;
  produced: number;
  target: number;
  rejected: number;
}

export interface ActivityItem {
  activity_id: number;
  action: string;
  details: string;
  created_at: string;
  full_name: string;
}

export interface DashboardStats {
  totalMachines: number;
  activeMachines: number;
  totalOperators: number;
  todayPlans: number;
  todayProduced: number;
  todayTarget: number;
  todayOk: number;
  todayRejected: number;
  todayDowntimeMin: number;
  rejectionRate: number;
  efficiency: number;
  machineStatus: MachineStatus[];
  recentActivity: ActivityItem[];
  shiftSummary: ShiftSummary[];
}

// ─── Typed API Client ────────────────────────

export class DashboardApi extends BaseApi {
  async getDashboard(): Promise<DashboardStats> {
    const data = await this.request<{ success: boolean; dashboard: DashboardStats }>(
      '/api/dashboard',
    );
    return data.dashboard;
  }
}
