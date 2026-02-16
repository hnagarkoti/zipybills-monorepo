/**
 * Dashboard Service – Database Operations
 *
 * All queries are tenant-scoped. tenantId = null means on-prem / unscoped.
 */

import { query } from '@zipybills/factory-database-config';
import type { DashboardStats, PeriodStats, TopRejectionReason, ShiftHistoryDay } from '@zipybills/factory-dashboard-service-interface';

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateStr(d);
}

async function getPeriodStats(
  fromDate: string,
  toDate: string,
  tenantId?: number | null,
): Promise<PeriodStats> {
  const tWhere = tenantId != null ? ' AND tenant_id = $1' : '';
  const tRangeParams = tenantId != null ? [tenantId, fromDate, toDate] : [fromDate, toDate];
  const fromIdx = tenantId != null ? '$2' : '$1';
  const toIdx = tenantId != null ? '$3' : '$2';

  const [prodResult, planResult, downtimeResult] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(quantity_produced), 0) as produced,
              COALESCE(SUM(quantity_rejected), 0) as rejected
       FROM production_logs WHERE DATE(logged_at) >= ${fromIdx} AND DATE(logged_at) <= ${toIdx}${tWhere}`,
      tRangeParams,
    ),
    query(
      `SELECT COUNT(*) as count, COALESCE(SUM(target_quantity), 0) as total_target
       FROM production_plans WHERE plan_date >= ${fromIdx} AND plan_date <= ${toIdx}${tWhere}`,
      tRangeParams,
    ),
    query(
      `SELECT COALESCE(SUM(duration_min), 0) as total_min
       FROM downtime_logs WHERE DATE(started_at) >= ${fromIdx} AND DATE(started_at) <= ${toIdx}${tWhere}`,
      tRangeParams,
    ),
  ]);

  const produced = parseInt(prodResult.rows[0]?.produced || '0', 10);
  const rejected = parseInt(prodResult.rows[0]?.rejected || '0', 10);
  const target = parseInt(planResult.rows[0]?.total_target || '0', 10);

  return {
    produced,
    target,
    rejected,
    downtime_min: parseInt(downtimeResult.rows[0]?.total_min || '0', 10),
    plans: parseInt(planResult.rows[0]?.count || '0', 10),
    efficiency: target > 0 ? Math.round((produced / target) * 10000) / 100 : 0,
    rejection_rate: produced > 0 ? Math.round((rejected / produced) * 10000) / 100 : 0,
  };
}

export async function getDashboardStats(tenantId?: number | null): Promise<DashboardStats> {
  const today = toLocalDateStr(new Date());

  // Build tenant filter fragments
  const tWhere = tenantId != null ? ' AND tenant_id = $1' : '';
  const tWhereOnly = tenantId != null ? ' WHERE tenant_id = $1' : '';
  const tParams = tenantId != null ? [tenantId] : [];
  const tDateParams = tenantId != null ? [tenantId, today] : [today];
  const tDateIdx = tenantId != null ? '$2' : '$1';

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
    query(`SELECT COUNT(*) as count FROM machines${tWhereOnly}`, tParams),
    query(`SELECT COUNT(*) as count FROM machines WHERE status = 'ACTIVE'${tWhere}`, tParams),
    query(`SELECT COUNT(*) as count FROM users WHERE role = 'OPERATOR' AND is_active = true${tWhere}`, tParams),
    query(
      `SELECT COUNT(*) as count, COALESCE(SUM(target_quantity), 0) as total_target FROM production_plans WHERE plan_date = ${tDateIdx}${tWhere}`,
      tDateParams,
    ),
    query(
      `SELECT COALESCE(SUM(quantity_produced), 0) as produced,
              COALESCE(SUM(quantity_ok), 0) as ok,
              COALESCE(SUM(quantity_rejected), 0) as rejected
       FROM production_logs WHERE DATE(logged_at) = ${tDateIdx}${tWhere}`,
      tDateParams,
    ),
    query(
      `SELECT COALESCE(SUM(duration_min), 0) as total_min
       FROM downtime_logs WHERE DATE(started_at) = ${tDateIdx}${tWhere}`,
      tDateParams,
    ),
    query(
      `SELECT m.machine_id, m.machine_name, m.machine_code, m.status,
              COALESCE(SUM(pl.quantity_produced), 0) as today_produced,
              COALESCE(pp_target.target, 0) as today_target
       FROM machines m
       LEFT JOIN production_logs pl ON pl.machine_id = m.machine_id AND DATE(pl.logged_at) = ${tDateIdx}
       LEFT JOIN (
         SELECT machine_id, SUM(target_quantity) as target
         FROM production_plans WHERE plan_date = ${tDateIdx}${tWhere} GROUP BY machine_id
       ) pp_target ON pp_target.machine_id = m.machine_id
       WHERE 1=1${tWhere.replace('tenant_id', 'm.tenant_id')}
       GROUP BY m.machine_id, m.machine_name, m.machine_code, m.status, pp_target.target
       ORDER BY m.machine_code`,
      tDateParams,
    ),
    query(
      `SELECT al.activity_id, al.action, al.details, al.created_at, COALESCE(u.full_name, 'System') as full_name
       FROM activity_log al
       LEFT JOIN users u ON u.user_id = al.user_id
       WHERE 1=1${tWhere.replace('tenant_id', 'al.tenant_id')}
       ORDER BY al.created_at DESC LIMIT 15`,
      tParams,
    ),
    query(
      `SELECT s.shift_name,
              COALESCE(SUM(pl.quantity_produced), 0) as produced,
              COALESCE(pp_target.target, 0) as target,
              COALESCE(SUM(pl.quantity_rejected), 0) as rejected
       FROM shifts s
       LEFT JOIN production_logs pl ON pl.shift_id = s.shift_id AND DATE(pl.logged_at) = ${tDateIdx}
       LEFT JOIN (
         SELECT shift_id, SUM(target_quantity) as target
         FROM production_plans WHERE plan_date = ${tDateIdx}${tWhere} GROUP BY shift_id
       ) pp_target ON pp_target.shift_id = s.shift_id
       WHERE s.is_active = true${tWhere.replace('tenant_id', 's.tenant_id')}
       GROUP BY s.shift_id, s.shift_name, pp_target.target
       ORDER BY s.start_time`,
      tDateParams,
    ),
  ]);

  const todayProduced = parseInt(todayProductionResult.rows[0]?.produced || '0', 10);
  const todayOk = parseInt(todayProductionResult.rows[0]?.ok || '0', 10);
  const todayRejected = parseInt(todayProductionResult.rows[0]?.rejected || '0', 10);
  const todayTarget = parseInt(todayPlansResult.rows[0]?.total_target || '0', 10);

  // Historical period stats + new analytics (parallel)
  const yesterdayStr = daysAgo(1);
  const weekAgoStr = daysAgo(7);
  const monthAgoStr = daysAgo(30);

  // Rejection reasons query (last 30 days)
  const rejReasonParams = tenantId != null ? [tenantId, monthAgoStr] : [monthAgoStr];
  const rejDateIdx = tenantId != null ? '$2' : '$1';
  const rejTWhere = tenantId != null ? ' AND tenant_id = $1' : '';

  // Shift history query (last 7 days daily breakdown)
  const shiftHistParams = tenantId != null ? [tenantId, weekAgoStr] : [weekAgoStr];
  const shiftHistDateIdx = tenantId != null ? '$2' : '$1';
  const shiftHistTWhere = tenantId != null ? ' AND tenant_id = $1' : '';

  const [yesterday, lastWeek, lastMonth, topRejectionResult, shiftHistoryResult] = await Promise.all([
    getPeriodStats(yesterdayStr, yesterdayStr, tenantId),
    getPeriodStats(weekAgoStr, yesterdayStr, tenantId),
    getPeriodStats(monthAgoStr, yesterdayStr, tenantId),
    query(
      `SELECT rejection_reason as reason,
              COUNT(*) as count,
              SUM(quantity_rejected) as total_rejected
       FROM production_logs
       WHERE quantity_rejected > 0
         AND rejection_reason IS NOT NULL
         AND rejection_reason != ''
         AND DATE(logged_at) >= ${rejDateIdx}${rejTWhere}
       GROUP BY rejection_reason
       ORDER BY total_rejected DESC
       LIMIT 5`,
      rejReasonParams,
    ),
    query(
      `SELECT pp.plan_date as date,
              s.shift_name,
              COALESCE(SUM(pl.quantity_produced), 0) as produced,
              COALESCE(SUM(pp_sub.target), 0) as target,
              COALESCE(SUM(pl.quantity_rejected), 0) as rejected
       FROM shifts s
       CROSS JOIN (SELECT DISTINCT plan_date FROM production_plans WHERE plan_date >= ${shiftHistDateIdx}${shiftHistTWhere}) pp
       LEFT JOIN production_logs pl ON pl.shift_id = s.shift_id AND DATE(pl.logged_at) = pp.plan_date
       LEFT JOIN (
         SELECT plan_date, shift_id, SUM(target_quantity) as target
         FROM production_plans WHERE plan_date >= ${shiftHistDateIdx}${shiftHistTWhere}
         GROUP BY plan_date, shift_id
       ) pp_sub ON pp_sub.shift_id = s.shift_id AND pp_sub.plan_date = pp.plan_date
       WHERE s.is_active = true${shiftHistTWhere.replace('tenant_id', 's.tenant_id')}
       GROUP BY pp.plan_date, s.shift_id, s.shift_name, s.start_time
       HAVING COALESCE(SUM(pp_sub.target), 0) > 0 OR COALESCE(SUM(pl.quantity_produced), 0) > 0
       ORDER BY pp.plan_date DESC, s.start_time
       LIMIT 42`,
      shiftHistParams,
    ),
  ]);

  // Parse top rejection reasons
  const totalRejected30d = topRejectionResult.rows.reduce(
    (sum: number, r: any) => sum + parseInt(r.total_rejected || '0', 10), 0,
  );
  const topRejectionReasons: TopRejectionReason[] = topRejectionResult.rows.map((r: any) => {
    const total = parseInt(r.total_rejected || '0', 10);
    return {
      reason: r.reason,
      count: parseInt(r.count || '0', 10),
      total_rejected: total,
      percentage: totalRejected30d > 0 ? Math.round((total / totalRejected30d) * 10000) / 100 : 0,
    };
  });

  // Parse shift history
  const shiftHistory: ShiftHistoryDay[] = shiftHistoryResult.rows.map((r: any) => {
    const produced = parseInt(r.produced || '0', 10);
    const target = parseInt(r.target || '0', 10);
    return {
      date: r.date,
      shift_name: r.shift_name,
      produced,
      target,
      rejected: parseInt(r.rejected || '0', 10),
      efficiency: target > 0 ? Math.round((produced / target) * 10000) / 100 : 0,
    };
  });

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
    yesterday,
    lastWeek,
    lastMonth,
    topRejectionReasons,
    shiftHistory,
  };
}
