/**
 * FactoryOS Dashboard Service Runtime
 *
 * Express router for dashboard live stats.
 * Routes: /api/dashboard
 */

import { Router } from 'express';
import * as db from './database.js';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', async (_req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({ success: true, dashboard: stats });
  } catch (err) {
    console.error('[Dashboard] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});
