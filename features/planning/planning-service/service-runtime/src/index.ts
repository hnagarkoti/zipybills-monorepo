/**
 * FactoryOS Planning Service Runtime
 *
 * Express router for production plans and operator logs.
 * Routes: /api/plans/*, /api/production-logs/*
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';

export const planningRouter = Router();

// ─── Production Plans ────────────────────────

planningRouter.get('/plans', async (req, res) => {
  try {
    const plans = await db.getProductionPlans({
      date: req.query.date as string,
      machine_id: req.query.machine_id ? parseInt(req.query.machine_id as string, 10) : undefined,
      status: req.query.status as string,
    });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

planningRouter.get('/plans/:id', async (req, res) => {
  try {
    const plan = await db.getPlanById(parseInt(String(req.params.id), 10));
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

planningRouter.post('/plans', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { machine_id, shift_id, plan_date, product_name, product_code, target_quantity } = req.body;
    if (!machine_id || !shift_id || !plan_date || !product_name || !target_quantity) {
      res.status(400).json({ success: false, error: 'machine_id, shift_id, plan_date, product_name, target_quantity required' });
      return;
    }
    const plan = await db.createProductionPlan({
      machine_id, shift_id, plan_date, product_name, product_code, target_quantity,
      created_by: req.user!.user_id,
    });
    await logActivity(
      req.user!.user_id, 'CREATE_PLAN', 'plan', plan.plan_id,
      `Plan for ${product_name} (target: ${target_quantity}) on ${plan_date}`, req.ip,
    );
    res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error('[Plans] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// Bulk create plans (for CSV/Excel import)
planningRouter.post('/plans/bulk', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { plans: planRows } = req.body;
    if (!Array.isArray(planRows) || planRows.length === 0) {
      res.status(400).json({ success: false, error: 'plans array is required and must not be empty' });
      return;
    }
    if (planRows.length > 500) {
      res.status(400).json({ success: false, error: 'Maximum 500 plans per batch' });
      return;
    }
    const created: Array<{ plan_id: number; product_name: string; plan_date: string }> = [];
    const errors: Array<{ row: number; error: string }> = [];
    for (let i = 0; i < planRows.length; i++) {
      const row = planRows[i];
      if (!row.machine_id || !row.shift_id || !row.plan_date || !row.product_name || !row.target_quantity) {
        errors.push({ row: i + 1, error: 'Missing required fields' });
        continue;
      }
      try {
        const plan = await db.createProductionPlan({
          machine_id: parseInt(String(row.machine_id), 10),
          shift_id: parseInt(String(row.shift_id), 10),
          plan_date: row.plan_date,
          product_name: row.product_name,
          product_code: row.product_code || null,
          target_quantity: parseInt(String(row.target_quantity), 10),
          created_by: req.user!.user_id,
        });
        created.push({ plan_id: plan.plan_id, product_name: plan.product_name, plan_date: plan.plan_date });
      } catch (err) {
        errors.push({ row: i + 1, error: err instanceof Error ? err.message : 'Failed to create' });
      }
    }
    if (created.length > 0) {
      await logActivity(
        req.user!.user_id, 'BULK_CREATE_PLANS', 'plan', 0,
        `Bulk imported ${created.length} plans (${errors.length} errors)`, req.ip,
      );
    }
    res.status(201).json({ success: true, created: created.length, errors, plans: created });
  } catch (err) {
    console.error('[Plans] Bulk create error:', err);
    res.status(500).json({ success: false, error: 'Failed to bulk create plans' });
  }
});

// Duplicate plans from one date to another
planningRouter.post('/plans/duplicate', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { source_date, target_date } = req.body;
    if (!source_date || !target_date) {
      res.status(400).json({ success: false, error: 'source_date and target_date required' });
      return;
    }
    if (source_date === target_date) {
      res.status(400).json({ success: false, error: 'Source and target dates must be different' });
      return;
    }
    const sourcePlans = await db.getProductionPlans({ date: source_date });
    if (sourcePlans.length === 0) {
      res.status(400).json({ success: false, error: `No plans found for ${source_date}` });
      return;
    }
    const created = [];
    for (const plan of sourcePlans) {
      const newPlan = await db.createProductionPlan({
        machine_id: plan.machine_id,
        shift_id: plan.shift_id,
        plan_date: target_date,
        product_name: plan.product_name,
        product_code: plan.product_code,
        target_quantity: plan.target_quantity,
        created_by: req.user!.user_id,
      });
      created.push(newPlan);
    }
    await logActivity(
      req.user!.user_id, 'DUPLICATE_PLANS', 'plan', 0,
      `Duplicated ${created.length} plans from ${source_date} to ${target_date}`, req.ip,
    );
    res.status(201).json({ success: true, created: created.length, target_date, plans: created });
  } catch (err) {
    console.error('[Plans] Duplicate error:', err);
    res.status(500).json({ success: false, error: 'Failed to duplicate plans' });
  }
});

planningRouter.put('/plans/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const { status } = req.body;
    if (!status) { res.status(400).json({ success: false, error: 'status required' }); return; }
    const plan = await db.updatePlanStatus(planId, status);
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_PLAN_STATUS', 'plan', planId, `Status → ${status}`, req.ip);
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update plan status' });
  }
});

planningRouter.put('/plans/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const plan = await db.updatePlan(planId, req.body);
    if (!plan) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_PLAN', 'plan', planId, JSON.stringify(req.body), req.ip);
    res.json({ success: true, plan });
  } catch (err) {
    console.error('[Plans] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

planningRouter.delete('/plans/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const planId = parseInt(String(req.params.id), 10);
    const deleted = await db.deletePlan(planId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Plan not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_PLAN', 'plan', planId, `Deleted plan #${planId}`, req.ip);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    console.error('[Plans] Delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

// ─── Production Logs (Operator Input) ────────

planningRouter.get('/production-logs', async (req, res) => {
  try {
    const logs = await db.getProductionLogs({
      plan_id: req.query.plan_id ? parseInt(req.query.plan_id as string, 10) : undefined,
      machine_id: req.query.machine_id ? parseInt(req.query.machine_id as string, 10) : undefined,
      shift_id: req.query.shift_id ? parseInt(req.query.shift_id as string, 10) : undefined,
      date: req.query.date as string,
    });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch production logs' });
  }
});

planningRouter.post('/production-logs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { plan_id, machine_id, shift_id, quantity_produced, quantity_ok, quantity_rejected, rejection_reason, hour_slot, notes } = req.body;
    if (!machine_id || !shift_id || quantity_produced === undefined) {
      res.status(400).json({ success: false, error: 'machine_id, shift_id, quantity_produced required' });
      return;
    }
    const log = await db.createProductionLog({
      plan_id, machine_id, shift_id,
      operator_id: req.user!.user_id,
      quantity_produced: parseInt(quantity_produced, 10),
      quantity_ok: parseInt(quantity_ok || quantity_produced, 10),
      quantity_rejected: parseInt(quantity_rejected || '0', 10),
      rejection_reason, hour_slot, notes,
    });
    await logActivity(
      req.user!.user_id, 'LOG_PRODUCTION', 'production_log', log.log_id,
      `Produced: ${quantity_produced}, OK: ${quantity_ok || quantity_produced}, Rejected: ${quantity_rejected || 0}`, req.ip,
    );
    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error('[ProductionLogs] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to log production' });
  }
});
