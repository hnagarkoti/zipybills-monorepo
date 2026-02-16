/**
 * FactoryOS Downtime Service Runtime
 *
 * Express router for downtime CRUD — fully tenant-scoped.
 * Routes: /api/downtime/*
 */

import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';

export const downtimeRouter = Router();

/** Extract tenant_id from authenticated request JWT */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

downtimeRouter.get('/downtime', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const logs = await db.getDowntimeLogs({
      machine_id: req.query.machine_id ? parseInt(req.query.machine_id as string, 10) : undefined,
      category: req.query.category as string,
      date: req.query.date as string,
    }, tenantId);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch downtime logs' });
  }
});

downtimeRouter.post('/downtime', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { machine_id, shift_id, reason, category, started_at, ended_at, notes } = req.body;
    if (!machine_id || !reason || !category || !started_at) {
      res.status(400).json({ success: false, error: 'machine_id, reason, category, started_at required' });
      return;
    }
    const tenantId = getTenantId(req);
    const log = await db.createDowntimeLog({
      machine_id, shift_id, operator_id: req.user!.user_id,
      reason, category, started_at, ended_at, notes,
    }, tenantId);
    await logActivity(
      req.user!.user_id, 'LOG_DOWNTIME', 'downtime', log.downtime_id,
      `${category}: ${reason}`, req.ip, tenantId,
    );
    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error('[Downtime] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to log downtime' });
  }
});

downtimeRouter.put('/downtime/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const downtimeId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const log = await db.updateDowntimeLog(downtimeId, req.body, tenantId);
    if (!log) { res.status(404).json({ success: false, error: 'Downtime record not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_DOWNTIME', 'downtime', downtimeId, JSON.stringify(req.body), req.ip, tenantId);
    res.json({ success: true, log });
  } catch (err) {
    console.error('[Downtime] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update downtime' });
  }
});

downtimeRouter.delete('/downtime/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const downtimeId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const deleted = await db.deleteDowntimeLog(downtimeId, tenantId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Downtime record not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_DOWNTIME', 'downtime', downtimeId, `Deleted downtime #${downtimeId}`, req.ip, tenantId);
    res.json({ success: true, message: 'Downtime record deleted' });
  } catch (err) {
    console.error('[Downtime] Delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete downtime' });
  }
});

downtimeRouter.put('/downtime/:id/end', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const downtimeId = parseInt(String(req.params.id), 10);
    const { ended_at } = req.body;
    const tenantId = getTenantId(req);
    const log = await db.endDowntime(downtimeId, ended_at || new Date().toISOString(), tenantId);
    if (!log) { res.status(404).json({ success: false, error: 'Downtime record not found' }); return; }
    await logActivity(req.user!.user_id, 'END_DOWNTIME', 'downtime', downtimeId, `Duration: ${log.duration_min} min`, req.ip, tenantId);
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to end downtime' });
  }
});
