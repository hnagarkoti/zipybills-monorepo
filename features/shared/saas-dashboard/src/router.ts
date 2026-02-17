/**
 * FactoryOS SaaS Dashboard – Express Router
 *
 * Platform Admin Only:
 *   GET /overview          — Platform-wide KPI overview
 *   GET /tenants           — Tenant list with metrics
 *   GET /growth            — Monthly growth metrics
 *   GET /plan-distribution — Plan tier distribution
 *   GET /system-health     — System health & DB stats
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth } from '@zipybills/factory-auth-middleware';
import { requirePlatformAdmin } from '@zipybills/factory-multi-tenancy/middleware';
import {
  getPlatformOverview,
  getTenantsSummary,
  getGrowthMetrics,
  getPlanDistribution,
  getSystemHealth,
} from './index.js';

export const saasDashboardRouter = Router();

// Middleware applied per-route to avoid leaking to other routers
const adminGuard = [requireAuth, requirePlatformAdmin];

saasDashboardRouter.get('/saas-dashboard/overview', ...adminGuard, async (_req: Request, res: Response) => {
  try {
    const overview = await getPlatformOverview();
    res.json({ overview });
  } catch (error) {
    console.error('[SaaSDashboard] Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch platform overview' });
  }
});

saasDashboardRouter.get('/saas-dashboard/tenants', ...adminGuard, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { tenants, total } = await getTenantsSummary(page, limit);
    res.json({ tenants, total, page, limit });
  } catch (error) {
    console.error('[SaaSDashboard] Tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant summary' });
  }
});

saasDashboardRouter.get('/saas-dashboard/growth', ...adminGuard, async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const growth = await getGrowthMetrics(months);
    res.json({ growth });
  } catch (error) {
    console.error('[SaaSDashboard] Growth error:', error);
    res.status(500).json({ error: 'Failed to fetch growth metrics' });
  }
});

saasDashboardRouter.get('/saas-dashboard/plan-distribution', ...adminGuard, async (req: Request, res: Response) => {
  try {
    const distribution = await getPlanDistribution();
    res.json({ distribution });
  } catch (error) {
    console.error('[SaaSDashboard] Distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch plan distribution' });
  }
});

saasDashboardRouter.get('/saas-dashboard/system-health', ...adminGuard, async (_req: Request, res: Response) => {
  try {
    const health = await getSystemHealth();
    res.json({ health });
  } catch (error) {
    console.error('[SaaSDashboard] Health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});
