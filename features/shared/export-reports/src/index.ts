/**
 * FactoryOS Export Reports Service
 *
 * Provides CSV and JSON export endpoints for all report types.
 * Extends the existing reports-service data queries with export formatting.
 *
 * Routes:
 *   GET /export/production    — Export production report as CSV/JSON
 *   GET /export/machine-wise  — Export machine-wise report
 *   GET /export/shift-wise    — Export shift-wise report
 *   GET /export/rejections    — Export rejection report
 *   GET /export/downtime      — Export downtime report
 *   GET /export/efficiency    — Export efficiency/OEE report
 *   GET /export/summary       — Export combined summary report
 */

import { Router } from 'express';
import { query } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';

export const exportRouter = Router();

// ─── Helpers ──────────────────────────────────

function toCSV(headers: string[], rows: any[][], title?: string): string {
  const lines: string[] = [];
  if (title) {
    lines.push(`"${title}"`);
    lines.push(`"Generated: ${new Date().toISOString()}"`);
    lines.push('');
  }
  lines.push(headers.map((h) => `"${h}"`).join(','));
  for (const row of rows) {
    lines.push(row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

function sendExport(
  res: any,
  format: string,
  filename: string,
  data: { headers: string[]; rows: any[][]; title: string; rawData?: any[] },
) {
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(toCSV(data.headers, data.rows, data.title));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({
      title: data.title,
      exportedAt: new Date().toISOString(),
      headers: data.headers,
      totalRows: data.rows.length,
      data: data.rawData ?? data.rows,
    });
  }
}

function getDateRange(req: any): { startDate: string; endDate: string; format: string } {
  return {
    startDate: (req.query.start_date as string) || (req.query.startDate as string) || '',
    endDate: (req.query.end_date as string) || (req.query.endDate as string) || '',
    format: ((req.query.format as string) || 'csv').toLowerCase(),
  };
}

function validateDates(startDate: string, endDate: string, res: any): boolean {
  if (!startDate || !endDate) {
    res.status(400).json({ success: false, error: 'start_date and end_date are required' });
    return false;
  }
  return true;
}

function dateTag(startDate: string, endDate: string): string {
  return `${startDate}_to_${endDate}`;
}

// ─── Production Report Export ─────────────────

exportRouter.get('/export/production', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const machineId = req.query.machine_id ? parseInt(req.query.machine_id as string, 10) : null;
    const shiftId = req.query.shift_id ? parseInt(req.query.shift_id as string, 10) : null;

    let sql = `
      SELECT
        pp.plan_id, pp.product_name, pp.target_quantity,
        COALESCE(pl.total_produced, 0) as actual_quantity,
        ROUND(COALESCE(pl.total_produced, 0)::numeric / NULLIF(pp.target_quantity, 0) * 100, 1) as efficiency_pct,
        pp.status, pp.plan_date,
        m.machine_name, s.shift_name
      FROM production_plans pp
      LEFT JOIN machines m ON pp.machine_id = m.machine_id
      LEFT JOIN shifts s ON pp.shift_id = s.shift_id
      LEFT JOIN (
        SELECT plan_id, SUM(quantity_produced) as total_produced
        FROM production_logs GROUP BY plan_id
      ) pl ON pl.plan_id = pp.plan_id
      WHERE pp.plan_date >= $1 AND pp.plan_date <= $2
    `;
    const values: any[] = [startDate, endDate];

    if (machineId) { sql += ` AND pp.machine_id = $${values.length + 1}`; values.push(machineId); }
    if (shiftId) { sql += ` AND pp.shift_id = $${values.length + 1}`; values.push(shiftId); }
    sql += ` ORDER BY pp.plan_date`;

    const result = await query(sql, values);

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Production report exported (${format}, ${result.rows.length} rows)`, req.ip);

    sendExport(res, format, `production_report_${dateTag(startDate, endDate)}`, {
      title: `Production Report: ${startDate} to ${endDate}`,
      headers: ['Plan ID', 'Product', 'Target Qty', 'Actual Qty', 'Efficiency %', 'Status', 'Plan Date', 'Machine', 'Shift'],
      rows: result.rows.map((r: any) => [
        r.plan_id, r.product_name, r.target_quantity, r.actual_quantity,
        r.efficiency_pct, r.status, r.plan_date,
        r.machine_name, r.shift_name,
      ]),
      rawData: result.rows,
    });
  } catch (err) {
    console.error('[Export] Production error:', err);
    res.status(500).json({ success: false, error: 'Failed to export production report' });
  }
});

// ─── Machine-wise Report Export ───────────────

exportRouter.get('/export/machine-wise', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const result = await query(`
      SELECT
        m.machine_id, m.machine_name, m.status as current_status,
        COUNT(pp.plan_id) as total_plans,
        COALESCE(SUM(pp.target_quantity), 0) as total_target,
        COALESCE(pl.total_produced, 0) as total_actual,
        ROUND(COALESCE(pl.total_produced, 0)::numeric / NULLIF(COALESCE(SUM(pp.target_quantity), 0), 0) * 100, 1) as efficiency_pct,
        (SELECT COUNT(*) FROM downtime_logs dl WHERE dl.machine_id = m.machine_id AND dl.started_at >= $1 AND dl.started_at <= $2) as downtime_events,
        (SELECT COALESCE(SUM(dl.duration_min), 0) FROM downtime_logs dl WHERE dl.machine_id = m.machine_id AND dl.started_at >= $1 AND dl.started_at <= $2) as downtime_minutes
      FROM machines m
      LEFT JOIN production_plans pp ON pp.machine_id = m.machine_id AND pp.plan_date >= $1 AND pp.plan_date <= $2
      LEFT JOIN (
        SELECT plog.machine_id, SUM(plog.quantity_produced) as total_produced
        FROM production_logs plog
        JOIN production_plans pplan ON pplan.plan_id = plog.plan_id AND pplan.plan_date >= $1 AND pplan.plan_date <= $2
        GROUP BY plog.machine_id
      ) pl ON pl.machine_id = m.machine_id
      GROUP BY m.machine_id, m.machine_name, m.status, pl.total_produced
      ORDER BY m.machine_name
    `, [startDate, endDate]);

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Machine-wise report exported (${format})`, req.ip);

    sendExport(res, format, `machine_report_${dateTag(startDate, endDate)}`, {
      title: `Machine-wise Report: ${startDate} to ${endDate}`,
      headers: ['Machine ID', 'Machine Name', 'Current Status', 'Total Plans', 'Target Qty', 'Actual Qty', 'Efficiency %', 'Downtime Events', 'Downtime Minutes'],
      rows: result.rows.map((r: any) => [
        r.machine_id, r.machine_name, r.current_status, r.total_plans,
        r.total_target, r.total_actual, r.efficiency_pct,
        r.downtime_events, r.downtime_minutes,
      ]),
      rawData: result.rows,
    });
  } catch (err) {
    console.error('[Export] Machine-wise error:', err);
    res.status(500).json({ success: false, error: 'Failed to export machine-wise report' });
  }
});

// ─── Shift-wise Report Export ─────────────────

exportRouter.get('/export/shift-wise', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const result = await query(`
      SELECT
        s.shift_id, s.shift_name, s.start_time, s.end_time,
        COUNT(pp.plan_id) as total_plans,
        COALESCE(SUM(pp.target_quantity), 0) as total_target,
        COALESCE(pl.total_produced, 0) as total_actual,
        ROUND(COALESCE(pl.total_produced, 0)::numeric / NULLIF(COALESCE(SUM(pp.target_quantity), 0), 0) * 100, 1) as avg_efficiency
      FROM shifts s
      LEFT JOIN production_plans pp ON pp.shift_id = s.shift_id AND pp.plan_date >= $1 AND pp.plan_date <= $2
      LEFT JOIN (
        SELECT plog.shift_id, SUM(plog.quantity_produced) as total_produced
        FROM production_logs plog
        JOIN production_plans pplan ON pplan.plan_id = plog.plan_id AND pplan.plan_date >= $1 AND pplan.plan_date <= $2
        GROUP BY plog.shift_id
      ) pl ON pl.shift_id = s.shift_id
      GROUP BY s.shift_id, s.shift_name, s.start_time, s.end_time, pl.total_produced
      ORDER BY s.start_time
    `, [startDate, endDate]);

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Shift-wise report exported (${format})`, req.ip);

    sendExport(res, format, `shift_report_${dateTag(startDate, endDate)}`, {
      title: `Shift-wise Report: ${startDate} to ${endDate}`,
      headers: ['Shift ID', 'Shift Name', 'Start Time', 'End Time', 'Total Plans', 'Target Qty', 'Actual Qty', 'Avg Efficiency %'],
      rows: result.rows.map((r: any) => [
        r.shift_id, r.shift_name, r.start_time, r.end_time,
        r.total_plans, r.total_target, r.total_actual, r.avg_efficiency,
      ]),
      rawData: result.rows,
    });
  } catch (err) {
    console.error('[Export] Shift-wise error:', err);
    res.status(500).json({ success: false, error: 'Failed to export shift-wise report' });
  }
});

// ─── Downtime Report Export ───────────────────

exportRouter.get('/export/downtime', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const result = await query(`
      SELECT
        dl.downtime_id, dl.started_at, dl.ended_at, dl.duration_min,
        dl.reason, dl.category,
        m.machine_name,
        u.full_name as reported_by
      FROM downtime_logs dl
      LEFT JOIN machines m ON dl.machine_id = m.machine_id
      LEFT JOIN users u ON dl.operator_id = u.user_id
      WHERE dl.started_at >= $1 AND dl.started_at <= $2
      ORDER BY dl.started_at
    `, [startDate, endDate]);

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Downtime report exported (${format}, ${result.rows.length} events)`, req.ip);

    sendExport(res, format, `downtime_report_${dateTag(startDate, endDate)}`, {
      title: `Downtime Report: ${startDate} to ${endDate}`,
      headers: ['ID', 'Start Time', 'End Time', 'Duration (min)', 'Reason', 'Category', 'Machine', 'Reported By'],
      rows: result.rows.map((r: any) => [
        r.downtime_id, r.started_at, r.ended_at, r.duration_min,
        r.reason, r.category,
        r.machine_name, r.reported_by,
      ]),
      rawData: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export downtime report' });
  }
});

// ─── Efficiency / OEE Report Export ───────────

exportRouter.get('/export/efficiency', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const result = await query(`
      SELECT
        m.machine_id, m.machine_name,
        COALESCE(prod.total_target, 0) as total_target,
        COALESCE(prod.total_actual, 0) as total_actual,
        ROUND(COALESCE(prod.total_actual, 0)::numeric / NULLIF(COALESCE(prod.total_target, 0), 0) * 100, 1) as performance_rate,
        COALESCE(dt.total_downtime_min, 0) as downtime_minutes,
        -- OEE = Availability x Performance x Quality (simplified)
        ROUND(
          GREATEST(0, 100 - COALESCE(dt.total_downtime_min, 0)::numeric / NULLIF(($2::date - $1::date) * 24 * 60, 0) * 100) *
          COALESCE(prod.total_actual, 0)::numeric / NULLIF(COALESCE(prod.total_target, 0), 0) *
          1.0 -- quality factor (assume 100% for now)
        , 1) as oee_pct
      FROM machines m
      LEFT JOIN (
        SELECT pp.machine_id, SUM(pp.target_quantity) as total_target,
               COALESCE(SUM(pl.qty), 0) as total_actual
        FROM production_plans pp
        LEFT JOIN (
          SELECT plan_id, SUM(quantity_produced) as qty FROM production_logs GROUP BY plan_id
        ) pl ON pl.plan_id = pp.plan_id
        WHERE pp.plan_date >= $1 AND pp.plan_date <= $2
        GROUP BY pp.machine_id
      ) prod ON prod.machine_id = m.machine_id
      LEFT JOIN (
        SELECT machine_id,
          SUM(duration_min) as total_downtime_min
        FROM downtime_logs WHERE started_at >= $1 AND started_at <= $2
        GROUP BY machine_id
      ) dt ON dt.machine_id = m.machine_id
      ORDER BY m.machine_name
    `, [startDate, endDate]);

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Efficiency/OEE report exported (${format})`, req.ip);

    sendExport(res, format, `efficiency_report_${dateTag(startDate, endDate)}`, {
      title: `Efficiency & OEE Report: ${startDate} to ${endDate}`,
      headers: ['Machine ID', 'Machine', 'Target Qty', 'Actual Qty', 'Performance %', 'Downtime (min)', 'OEE %'],
      rows: result.rows.map((r: any) => [
        r.machine_id, r.machine_name, r.total_target, r.total_actual,
        r.performance_rate, r.downtime_minutes, r.oee_pct,
      ]),
      rawData: result.rows,
    });
  } catch (err) {
    console.error('[Export] Efficiency error:', err);
    res.status(500).json({ success: false, error: 'Failed to export efficiency report' });
  }
});

// ─── Combined Summary Export ──────────────────

exportRouter.get('/export/summary', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { startDate, endDate, format } = getDateRange(req);
    if (!validateDates(startDate, endDate, res)) return;

    const [production, downtime, users] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total_plans,
          COALESCE(SUM(pp.target_quantity), 0) as total_target,
          COUNT(*) FILTER (WHERE pp.status = 'COMPLETED') as completed_plans,
          COUNT(*) FILTER (WHERE pp.status = 'IN_PROGRESS') as active_plans
        FROM production_plans pp
        WHERE pp.plan_date >= $1 AND pp.plan_date <= $2
      `, [startDate, endDate]),

      query(`
        SELECT
          COUNT(*) as total_events,
          COALESCE(SUM(duration_min), 0) as total_minutes
        FROM downtime_logs
        WHERE started_at >= $1 AND started_at <= $2
      `, [startDate, endDate]),

      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM users`),
    ]);

    // Get actual production from logs
    const prodLogs = await query(`
      SELECT COALESCE(SUM(pl.quantity_produced), 0) as total_actual
      FROM production_logs pl
      JOIN production_plans pp ON pp.plan_id = pl.plan_id AND pp.plan_date >= $1 AND pp.plan_date <= $2
    `, [startDate, endDate]);

    const p = production.rows[0];
    const d = downtime.rows[0];
    const u = users.rows[0];
    const totalActual = parseInt(prodLogs.rows[0]?.total_actual ?? '0', 10);

    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Report Period', `${startDate} to ${endDate}`],
      ['Total Production Plans', p.total_plans],
      ['Completed Plans', p.completed_plans],
      ['Active Plans', p.active_plans],
      ['Total Target Quantity', p.total_target],
      ['Total Actual Quantity', totalActual],
      ['Overall Efficiency', `${p.total_target > 0 ? ((totalActual / parseInt(p.total_target, 10)) * 100).toFixed(1) : 0}%`],
      [''],
      ['Total Downtime Events', d.total_events],
      ['Total Downtime Minutes', d.total_minutes],
      [''],
      ['Total Users', u.total],
      ['Active Users', u.active],
    ];

    await logActivity(req.user!.user_id, 'REPORT_EXPORTED', 'report', undefined, `Summary report exported (${format})`, req.ip);

    sendExport(res, format, `summary_report_${dateTag(startDate, endDate)}`, {
      title: `Factory Summary Report: ${startDate} to ${endDate}`,
      headers: summaryHeaders,
      rows: summaryRows,
      rawData: [{ production: p, downtime: d, users: u }],
    });
  } catch (err) {
    console.error('[Export] Summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to export summary report' });
  }
});
