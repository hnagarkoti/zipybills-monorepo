/**
 * FactoryOS Dashboard Service Runtime
 *
 * Express router for dashboard live stats — fully tenant-scoped.
 * Routes: /api/dashboard
 */

import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import * as db from './database.js';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = (req.user as any)?.tenant_id ?? null;
    const stats = await db.getDashboardStats(tenantId);
    res.json({ success: true, dashboard: stats });
  } catch (err) {
    console.error('[Dashboard] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});
