/**
 * FactoryOS Shifts Service Runtime
 *
 * Express router for shift CRUD.
 * Routes: /api/shifts/*
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';

export const shiftsRouter = Router();

shiftsRouter.get('/shifts', async (_req, res) => {
  try {
    const shifts = await db.getAllShifts();
    res.json({ success: true, shifts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch shifts' });
  }
});

shiftsRouter.post('/shifts', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const { shift_name, start_time, end_time } = req.body;
    if (!shift_name || !start_time || !end_time) {
      res.status(400).json({ success: false, error: 'shift_name, start_time, end_time required' });
      return;
    }
    const shift = await db.createShift({ shift_name, start_time, end_time });
    await logActivity(req.user!.user_id, 'CREATE_SHIFT', 'shift', shift.shift_id, `Created shift ${shift_name}`, req.ip);
    res.status(201).json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create shift' });
  }
});

shiftsRouter.put('/shifts/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const shiftId = parseInt(String(req.params.id), 10);
    const shift = await db.updateShift(shiftId, req.body);
    if (!shift) { res.status(404).json({ success: false, error: 'Shift not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_SHIFT', 'shift', shiftId, JSON.stringify(req.body), req.ip);
    res.json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update shift' });
  }
});

shiftsRouter.delete('/shifts/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const shiftId = parseInt(String(req.params.id), 10);
    const deleted = await db.deleteShift(shiftId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Shift not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_SHIFT', 'shift', shiftId, '', req.ip);
    res.json({ success: true, message: 'Shift deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete shift' });
  }
});

// ─── Seed helper (used by API gateway on startup) ───

export async function seedDefaultShifts(): Promise<void> {
  const shifts = await db.getAllShifts();
  if (shifts.length === 0) {
    await db.createShift({ shift_name: 'Morning', start_time: '06:00', end_time: '14:00' });
    await db.createShift({ shift_name: 'Afternoon', start_time: '14:00', end_time: '22:00' });
    await db.createShift({ shift_name: 'Night', start_time: '22:00', end_time: '06:00' });
    console.log('[FactoryOS] ✅ Default shifts created (Morning/Afternoon/Night)');
  }
}
