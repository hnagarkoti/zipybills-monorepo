/**
 * FactoryOS Dashboard Service Interface
 *
 * Types and API contract for dashboard & live stats.
 */

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
