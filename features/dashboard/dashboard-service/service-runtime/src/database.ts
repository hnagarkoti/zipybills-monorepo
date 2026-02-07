/**
 * Dashboard Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { DashboardStats } from '@zipybills/factory-dashboard-service-interface';

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  const [
    machineCount,
    activeMachineCount,
    operatorCount,
    todayPlansResult,
    todayProductionResult,
    todayDowntimeResult,
    machineStatusResult,
    recentActivityResult,
    shiftSummaryResult,
  ] = await Promise.all([
    query('SELECT COUNT(*) as count FROM machines'),
    query("SELECT COUNT(*) as count FROM machines WHERE status = 'ACTIVE'"),
    query("SELECT COUNT(*) as count FROM users WHERE role = 'OPERATOR' AND is_active = true"),
    query('SELECT COUNT(*) as count, COALESCE(SUM(target_quantity), 0) as total_target FROM production_plans WHERE plan_date = $1', [today]),
    query(
      `SELECT COALESCE(SUM(quantity_produced), 0) as produced,
              COALESCE(SUM(quantity_ok), 0) as ok,
              COALESCE(SUM(quantity_rejected), 0) as rejected
       FROM production_logs WHERE DATE(logged_at) = $1`,
      [today],
    ),
    query(
      `SELECT COALESCE(SUM(duration_min), 0) as total_min
       FROM downtime_logs WHERE DATE(started_at) = $1`,
      [today],
    ),
    query(
      `SELECT m.machine_id, m.machine_name, m.machine_code, m.status,
              COALESCE(SUM(pl.quantity_produced), 0) as today_produced,
              COALESCE(pp_target.target, 0) as today_target
       FROM machines m
       LEFT JOIN production_logs pl ON pl.machine_id = m.machine_id AND DATE(pl.logged_at) = $1
       LEFT JOIN (
         SELECT machine_id, SUM(target_quantity) as target
         FROM production_plans WHERE plan_date = $1 GROUP BY machine_id
       ) pp_target ON pp_target.machine_id = m.machine_id
       GROUP BY m.machine_id, m.machine_name, m.machine_code, m.status, pp_target.target
       ORDER BY m.machine_code`,
      [today],
    ),
    query(
      `SELECT al.activity_id, al.action, al.details, al.created_at, COALESCE(u.full_name, 'System') as full_name
       FROM activity_log al
       LEFT JOIN users u ON u.user_id = al.user_id
       ORDER BY al.created_at DESC LIMIT 15`,
    ),
    query(
      `SELECT s.shift_name,
              COALESCE(SUM(pl.quantity_produced), 0) as produced,
              COALESCE(pp_target.target, 0) as target,
              COALESCE(SUM(pl.quantity_rejected), 0) as rejected
       FROM shifts s
       LEFT JOIN production_logs pl ON pl.shift_id = s.shift_id AND DATE(pl.logged_at) = $1
       LEFT JOIN (
         SELECT shift_id, SUM(target_quantity) as target
         FROM production_plans WHERE plan_date = $1 GROUP BY shift_id
       ) pp_target ON pp_target.shift_id = s.shift_id
       WHERE s.is_active = true
       GROUP BY s.shift_id, s.shift_name, pp_target.target
       ORDER BY s.start_time`,
      [today],
    ),
  ]);

  const todayProduced = parseInt(todayProductionResult.rows[0]?.produced || '0', 10);
  const todayOk = parseInt(todayProductionResult.rows[0]?.ok || '0', 10);
  const todayRejected = parseInt(todayProductionResult.rows[0]?.rejected || '0', 10);
  const todayTarget = parseInt(todayPlansResult.rows[0]?.total_target || '0', 10);

  return {
    totalMachines: parseInt(machineCount.rows[0]!.count, 10),
    activeMachines: parseInt(activeMachineCount.rows[0]!.count, 10),
    totalOperators: parseInt(operatorCount.rows[0]!.count, 10),
    todayPlans: parseInt(todayPlansResult.rows[0]!.count, 10),
    todayProduced,
    todayTarget,
    todayOk,
    todayRejected,
    todayDowntimeMin: parseInt(todayDowntimeResult.rows[0]?.total_min || '0', 10),
    rejectionRate: todayProduced > 0 ? Math.round((todayRejected / todayProduced) * 10000) / 100 : 0,
    efficiency: todayTarget > 0 ? Math.round((todayProduced / todayTarget) * 10000) / 100 : 0,
    machineStatus: machineStatusResult.rows.map((r: any) => ({
      ...r,
      today_produced: parseInt(r.today_produced, 10),
      today_target: parseInt(r.today_target, 10),
    })),
    recentActivity: recentActivityResult.rows,
    shiftSummary: shiftSummaryResult.rows.map((r: any) => ({
      shift_name: r.shift_name,
      produced: parseInt(r.produced, 10),
      target: parseInt(r.target, 10),
      rejected: parseInt(r.rejected, 10),
    })),
  };
}
