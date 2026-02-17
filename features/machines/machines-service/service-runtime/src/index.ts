/**
 * FactoryOS Machines Service Runtime
 *
 * Express router for machine CRUD — fully tenant-scoped.
 * Routes: /api/machines/*
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import { validateTenantLimits } from '@zipybills/factory-multi-tenancy';
import * as db from './database.js';

export const machinesRouter = Router();

/** Extract tenant_id from authenticated request JWT */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

machinesRouter.get('/machines', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const machines = await db.getAllMachines(tenantId);
    res.json({ success: true, machines });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch machines' });
  }
});

machinesRouter.get('/machines/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const machine = await db.getMachineById(parseInt(String(req.params.id), 10), tenantId);
    if (!machine) { res.status(404).json({ success: false, error: 'Machine not found' }); return; }
    res.json({ success: true, machine });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch machine' });
  }
});

machinesRouter.post('/machines', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { machine_code, machine_name, department, machine_type } = req.body;
    if (!machine_code || !machine_name) {
      res.status(400).json({ success: false, error: 'machine_code and machine_name required' });
      return;
    }
    const tenantId = getTenantId(req);

    // Enforce plan limits in SaaS mode
    if (tenantId != null) {
      const limits = await validateTenantLimits(tenantId, 'machines');
      if (!limits.allowed) {
        res.status(403).json({
          success: false,
          error: `Machine limit reached (${limits.current}/${limits.limit}). Upgrade your plan.`,
        });
        return;
      }
    }

    const machine = await db.createMachine({ machine_code, machine_name, department, machine_type }, tenantId);
    await logActivity(req.user!.user_id, 'CREATE_MACHINE', 'machine', machine.machine_id, `Created machine ${machine_code}`, req.ip, tenantId);
    res.status(201).json({ success: true, machine });
  } catch (err: any) {
    if (err.code === '23505') { res.status(409).json({ success: false, error: 'Machine code already exists' }); return; }
    res.status(500).json({ success: false, error: 'Failed to create machine' });
  }
});

machinesRouter.put('/machines/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const machineId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const machine = await db.updateMachine(machineId, req.body, tenantId);
    if (!machine) { res.status(404).json({ success: false, error: 'Machine not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_MACHINE', 'machine', machineId, JSON.stringify(req.body), req.ip, tenantId);
    res.json({ success: true, machine });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update machine' });
  }
});

machinesRouter.delete('/machines/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const machineId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const deleted = await db.deleteMachine(machineId, tenantId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Machine not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_MACHINE', 'machine', machineId, '', req.ip, tenantId);
    res.json({ success: true, message: 'Machine deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete machine' });
  }
});
