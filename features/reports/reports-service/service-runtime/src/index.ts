/**
 * FactoryOS Reports Service Runtime
 *
 * Express router for all report endpoints — fully tenant-scoped.
 * Routes: /api/reports/*
 */

import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import * as db from './database.js';

export const reportsRouter = Router();

/** Extract tenant_id from authenticated request JWT */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

reportsRouter.get('/reports/production', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { start_date, end_date, machine_id, shift_id } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const tenantId = getTenantId(req);
    const data = await db.getProductionReport({
      start_date: start_date as string,
      end_date: end_date as string,
      machine_id: machine_id ? parseInt(machine_id as string, 10) : undefined,
      shift_id: shift_id ? parseInt(shift_id as string, 10) : undefined,
    }, tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch production report' });
  }
});

reportsRouter.get('/reports/machine-wise', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const tenantId = getTenantId(req);
    const data = await db.getMachineWiseReport(start_date as string, end_date as string, tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch machine-wise report' });
  }
});

reportsRouter.get('/reports/shift-wise', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const tenantId = getTenantId(req);
    const data = await db.getShiftWiseReport(start_date as string, end_date as string, tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch shift-wise report' });
  }
});

reportsRouter.get('/reports/rejections', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const tenantId = getTenantId(req);
    const data = await db.getRejectionReport(start_date as string, end_date as string, tenantId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch rejection report' });
  }
});
