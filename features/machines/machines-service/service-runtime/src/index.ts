/**
 * FactoryOS Machines Service Runtime
 *
 * Express router for machine CRUD.
 * Routes: /api/machines/*
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';

export const machinesRouter = Router();

machinesRouter.get('/machines', async (_req, res) => {
  try {
    const machines = await db.getAllMachines();
    res.json({ success: true, machines });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch machines' });
  }
});

machinesRouter.get('/machines/:id', async (req, res) => {
  try {
    const machine = await db.getMachineById(parseInt(String(req.params.id), 10));
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
    const machine = await db.createMachine({ machine_code, machine_name, department, machine_type });
    await logActivity(req.user!.user_id, 'CREATE_MACHINE', 'machine', machine.machine_id, `Created machine ${machine_code}`, req.ip);
    res.status(201).json({ success: true, machine });
  } catch (err: any) {
    if (err.code === '23505') { res.status(409).json({ success: false, error: 'Machine code already exists' }); return; }
    res.status(500).json({ success: false, error: 'Failed to create machine' });
  }
});

machinesRouter.put('/machines/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const machineId = parseInt(String(req.params.id), 10);
    const machine = await db.updateMachine(machineId, req.body);
    if (!machine) { res.status(404).json({ success: false, error: 'Machine not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_MACHINE', 'machine', machineId, JSON.stringify(req.body), req.ip);
    res.json({ success: true, machine });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update machine' });
  }
});

machinesRouter.delete('/machines/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const machineId = parseInt(String(req.params.id), 10);
    const deleted = await db.deleteMachine(machineId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Machine not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_MACHINE', 'machine', machineId, '', req.ip);
    res.json({ success: true, message: 'Machine deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete machine' });
  }
});
