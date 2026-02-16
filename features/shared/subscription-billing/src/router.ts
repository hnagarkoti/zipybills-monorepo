/**
 * FactoryOS Subscription Billing – Express Router
 *
 * Routes:
 *   GET    /plans                    — List available plans (public)
 *   GET    /subscription             — Current tenant subscription
 *   POST   /subscription             — Create subscription (upgrade from free)
 *   PATCH  /subscription/change-plan — Change plan tier
 *   POST   /subscription/cancel      — Cancel subscription
 *   GET    /invoices                 — Tenant invoice list
 *   POST   /invoices/:id/pay         — Mark invoice paid (simulation)
 *   GET    /usage                    — Usage history
 *   POST   /usage/record             — Snapshot current usage
 *
 * Platform Admin:
 *   GET    /admin/subscriptions      — All subscriptions across tenants
 *   GET    /admin/revenue            — Revenue summary
 *   POST   /admin/plans              — Create plan
 *   PATCH  /admin/plans/:code        — Update plan
 */

import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '@zipybills/factory-auth-middleware';
import { requireTenant, requirePlatformAdmin, type TenantRequest } from '@zipybills/factory-multi-tenancy/middleware';
import {
  getPlans,
  getPlanByCode,
  createSubscription,
  getSubscription,
  cancelSubscription,
  changePlan,
  generateInvoice,
  getInvoices,
  markInvoicePaid,
  recordUsage,
  getUsageHistory,
} from './index.js';
import { query } from '@zipybills/factory-database-config';
import { invalidatePlanFeaturesCache } from '@zipybills/factory-multi-tenancy';

export const billingRouter = Router();

// ─── Public ──────────────────────────────────

billingRouter.get('/billing/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await getPlans();
    res.json({ plans });
  } catch (error) {
    console.error('[Billing] Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ─── Tenant-Scoped ───────────────────────────

billingRouter.get(
  '/billing/subscription',
  requireAuth,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const sub = await getSubscription(tenantReq.tenantId!);
      if (!sub) {
        return res.json({ subscription: null, message: 'No active subscription' });
      }
      res.json({ subscription: sub });
    } catch (error) {
      console.error('[Billing] Error fetching subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  },
);

billingRouter.post(
  '/billing/subscription',
  requireAuth,
  requireTenant,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const { plan_code, billing_cycle = 'MONTHLY' } = req.body;

      if (!plan_code) {
        return res.status(400).json({ error: 'plan_code is required' });
      }

      const plan = await getPlanByCode(plan_code);
      if (!plan) {
        return res.status(404).json({ error: `Plan "${plan_code}" not found` });
      }

      const sub = await createSubscription(tenantReq.tenantId!, plan.plan_id, billing_cycle);
      res.status(201).json({ subscription: sub });
    } catch (error: any) {
      console.error('[Billing] Error creating subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
  },
);

billingRouter.patch(
  '/billing/subscription/change-plan',
  requireAuth,
  requireTenant,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const { plan_code, billing_cycle } = req.body;

      if (!plan_code) {
        return res.status(400).json({ error: 'plan_code is required' });
      }

      const sub = await changePlan(tenantReq.tenantId!, plan_code, billing_cycle);
      res.json({ subscription: sub, message: 'Plan changed successfully' });
    } catch (error: any) {
      console.error('[Billing] Error changing plan:', error);
      res.status(500).json({ error: error.message || 'Failed to change plan' });
    }
  },
);

billingRouter.post(
  '/billing/subscription/cancel',
  requireAuth,
  requireTenant,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const sub = await cancelSubscription(tenantReq.tenantId!);
      if (!sub) {
        return res.status(404).json({ error: 'No active subscription found' });
      }
      res.json({ subscription: sub, message: 'Subscription cancelled' });
    } catch (error) {
      console.error('[Billing] Error cancelling:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  },
);

// ─── Invoices ────────────────────────────────

billingRouter.get(
  '/billing/invoices',
  requireAuth,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { invoices, total } = await getInvoices(tenantReq.tenantId!, page, limit);
      res.json({ invoices, total, page, limit });
    } catch (error) {
      console.error('[Billing] Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  },
);

billingRouter.post(
  '/billing/invoices/generate',
  requireAuth,
  requireTenant,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const sub = await getSubscription(tenantReq.tenantId!);
      if (!sub) {
        return res.status(404).json({ error: 'No active subscription' });
      }
      const invoice = await generateInvoice(tenantReq.tenantId!, sub.subscription_id);
      res.status(201).json({ invoice });
    } catch (error: any) {
      console.error('[Billing] Error generating invoice:', error);
      res.status(500).json({ error: error.message || 'Failed to generate invoice' });
    }
  },
);

billingRouter.post(
  '/billing/invoices/:id/pay',
  requireAuth,
  requireTenant,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id, 10);
      const invoice = await markInvoicePaid(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json({ invoice, message: 'Invoice marked as paid' });
    } catch (error) {
      console.error('[Billing] Error paying invoice:', error);
      res.status(500).json({ error: 'Failed to mark invoice paid' });
    }
  },
);

// ─── Usage ───────────────────────────────────

billingRouter.get(
  '/billing/usage',
  requireAuth,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const months = parseInt(req.query.months as string) || 12;
      const history = await getUsageHistory(tenantReq.tenantId!, months);
      res.json({ usage: history });
    } catch (error) {
      console.error('[Billing] Error fetching usage:', error);
      res.status(500).json({ error: 'Failed to fetch usage' });
    }
  },
);

billingRouter.post(
  '/billing/usage/record',
  requireAuth,
  requireTenant,
  async (req: Request, res: Response) => {
    try {
      const tenantReq = req as TenantRequest;
      const record = await recordUsage(tenantReq.tenantId!);
      res.json({ usage: record });
    } catch (error) {
      console.error('[Billing] Error recording usage:', error);
      res.status(500).json({ error: 'Failed to record usage' });
    }
  },
);

// ─── Platform Admin ──────────────────────────

billingRouter.get(
  '/billing/admin/subscriptions',
  requireAuth,
  requirePlatformAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await query(
        `SELECT s.*, t.company_name, t.tenant_slug as slug, sp.plan_name, sp.plan_code
         FROM subscriptions s
         JOIN tenants t ON t.tenant_id = s.tenant_id
         JOIN subscription_plans sp ON sp.plan_id = s.plan_id
         ORDER BY s.created_at DESC`,
      );
      res.json({ subscriptions: result.rows });
    } catch (error) {
      console.error('[Billing] Admin subscriptions error:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  },
);

billingRouter.get(
  '/billing/admin/revenue',
  requireAuth,
  requirePlatformAdmin,
  async (_req: Request, res: Response) => {
    try {
      const [totalResult, monthlyResult, planResult] = await Promise.all([
        query(
          `SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
                  COUNT(*) as total_invoices,
                  COUNT(*) FILTER (WHERE status = 'PAID') as paid_invoices
           FROM invoices`,
        ),
        query(
          `SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
                  COALESCE(SUM(total_amount), 0) as revenue,
                  COUNT(*) as invoice_count
           FROM invoices
           WHERE status = 'PAID'
           GROUP BY TO_CHAR(created_at, 'YYYY-MM')
           ORDER BY month DESC
           LIMIT 12`,
        ),
        query(
          `SELECT sp.plan_name, sp.plan_code,
                  COUNT(s.subscription_id) as subscriber_count,
                  COALESCE(SUM(s.amount), 0) as mrr
           FROM subscription_plans sp
           LEFT JOIN subscriptions s ON s.plan_id = sp.plan_id AND s.status IN ('ACTIVE', 'TRIAL')
           GROUP BY sp.plan_id, sp.plan_name, sp.plan_code
           ORDER BY sp.base_price_monthly`,
        ),
      ]);

      res.json({
        revenue: {
          total: parseFloat(totalResult.rows[0]?.total_revenue ?? '0'),
          totalInvoices: parseInt(totalResult.rows[0]?.total_invoices ?? '0', 10),
          paidInvoices: parseInt(totalResult.rows[0]?.paid_invoices ?? '0', 10),
        },
        monthly: monthlyResult.rows,
        planBreakdown: planResult.rows,
      });
    } catch (error) {
      console.error('[Billing] Admin revenue error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
  },
);

// ─── All known features for plan configuration ──

const ALL_KNOWN_FEATURES = [
  { id: 'auth', label: 'Authentication & Users', core: true },
  { id: 'machines', label: 'Machines', core: true },
  { id: 'shifts', label: 'Shifts', core: true },
  { id: 'planning', label: 'Production Planning', core: true },
  { id: 'dashboard', label: 'Dashboard', core: true },
  { id: 'downtime', label: 'Downtime Tracking', core: false },
  { id: 'reports', label: 'Reports & Analytics', core: false },
  { id: 'export', label: 'Data Export (CSV/JSON)', core: false },
  { id: 'audit', label: 'Audit Logs', core: false },
  { id: 'theme', label: 'Custom Theming', core: false },
  { id: 'backups', label: 'Database Backups', core: false },
  { id: 'admin', label: 'Admin Panel', core: false },
  { id: 'license', label: 'License Management', core: false },
  { id: 'permissions', label: 'Advanced Permissions', core: false },
];

billingRouter.get(
  '/billing/admin/plans',
  requireAuth,
  requirePlatformAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await query(
        `SELECT sp.*,
                (SELECT COUNT(*) FROM tenants t WHERE t.plan = sp.tenant_plan AND t.is_platform_admin = false) as tenant_count
         FROM subscription_plans sp
         ORDER BY sp.base_price_monthly`,
      );

      const plans = result.rows.map((row: any) => ({
        ...row,
        features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
        tenant_count: parseInt(row.tenant_count ?? '0', 10),
      }));

      res.json({ success: true, plans, allFeatures: ALL_KNOWN_FEATURES });
    } catch (error) {
      console.error('[Billing] Error fetching admin plans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch plans' });
    }
  },
);

billingRouter.post(
  '/billing/admin/plans',
  requireAuth,
  requirePlatformAdmin,
  async (req: Request, res: Response) => {
    try {
      const { plan_code, plan_name, tenant_plan, base_price_monthly, price_per_machine, price_per_user, max_machines, max_users, features, trial_days, description } = req.body;

      if (!plan_code || !plan_name || !tenant_plan) {
        return res.status(400).json({ error: 'plan_code, plan_name, and tenant_plan are required' });
      }

      const result = await query(
        `INSERT INTO subscription_plans (plan_code, plan_name, tenant_plan, base_price_monthly, price_per_machine, price_per_user, max_machines, max_users, features, trial_days, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [plan_code, plan_name, tenant_plan, base_price_monthly || 0, price_per_machine || 0, price_per_user || 0, max_machines || 2, max_users || 3, JSON.stringify(features || []), trial_days || 0, description],
      );

      res.status(201).json({ success: true, plan: result.rows[0] });
      invalidatePlanFeaturesCache();
    } catch (error: any) {
      console.error('[Billing] Error creating plan:', error);
      res.status(500).json({ error: error.message || 'Failed to create plan' });
    }
  },
);

billingRouter.patch(
  '/billing/admin/plans/:code',
  requireAuth,
  requirePlatformAdmin,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      const allowedFields = ['plan_name', 'base_price_monthly', 'price_per_machine', 'price_per_user', 'max_machines', 'max_users', 'features', 'trial_days', 'description', 'is_active'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const val = field === 'features' ? JSON.stringify(req.body[field]) : req.body[field];
          updates.push(`${field} = $${idx}`);
          values.push(val);
          idx++;
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(code);
      const result = await query(
        `UPDATE subscription_plans SET ${updates.join(', ')} WHERE plan_code = $${idx} RETURNING *`,
        values,
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const updatedPlan = result.rows[0] as any;

      // Invalidate the plan features cache so middleware picks up changes immediately
      invalidatePlanFeaturesCache();

      // Sync limits to all tenants currently on this plan
      const tenantPlan = updatedPlan.tenant_plan;
      if (req.body.max_users !== undefined || req.body.max_machines !== undefined) {
        await query(
          `UPDATE tenants SET
             max_users = CASE WHEN $2::int IS NOT NULL THEN $2 ELSE max_users END,
             max_machines = CASE WHEN $3::int IS NOT NULL THEN $3 ELSE max_machines END,
             updated_at = NOW()
           WHERE plan = $1 AND is_platform_admin = false`,
          [tenantPlan, updatedPlan.max_users, updatedPlan.max_machines],
        );
      }

      const features = typeof updatedPlan.features === 'string'
        ? JSON.parse(updatedPlan.features)
        : updatedPlan.features;

      res.json({
        success: true,
        plan: { ...updatedPlan, features },
        message: `Plan "${code}" updated. Changes are live for all ${tenantPlan} tenants.`,
      });
    } catch (error) {
      console.error('[Billing] Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  },
);
