/**
 * FactoryOS Shifts Service Runtime
 *
 * Express router for shift CRUD — fully tenant-scoped.
 * Routes: /api/shifts/*
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import { query } from '@zipybills/factory-database-config';
import * as db from './database.js';

export const shiftsRouter = Router();

/** Extract tenant_id from authenticated request JWT */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

shiftsRouter.get('/shifts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const shifts = await db.getAllShifts(tenantId);
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
    const tenantId = getTenantId(req);
    const shift = await db.createShift({ shift_name, start_time, end_time }, tenantId);
    await logActivity(req.user!.user_id, 'CREATE_SHIFT', 'shift', shift.shift_id, `Created shift ${shift_name}`, req.ip, tenantId);
    res.status(201).json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create shift' });
  }
});

shiftsRouter.put('/shifts/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const shiftId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const shift = await db.updateShift(shiftId, req.body, tenantId);
    if (!shift) { res.status(404).json({ success: false, error: 'Shift not found' }); return; }
    await logActivity(req.user!.user_id, 'UPDATE_SHIFT', 'shift', shiftId, JSON.stringify(req.body), req.ip, tenantId);
    res.json({ success: true, shift });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update shift' });
  }
});

shiftsRouter.delete('/shifts/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const shiftId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const deleted = await db.deleteShift(shiftId, tenantId);
    if (!deleted) { res.status(404).json({ success: false, error: 'Shift not found' }); return; }
    await logActivity(req.user!.user_id, 'DELETE_SHIFT', 'shift', shiftId, '', req.ip, tenantId);
    res.json({ success: true, message: 'Shift deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete shift' });
  }
});

/**
 * POST /shifts/bulk-create
 * Creates preset shifts for a tenant that has none.
 * Body: { count: 2 | 3 }
 *   2 shifts → Day (06:00–18:00), Night (18:00–06:00)
 *   3 shifts → Morning (06:00–14:00), Afternoon (14:00–22:00), Night (22:00–06:00)
 */
shiftsRouter.post('/shifts/bulk-create', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const count = Number(req.body.count);

    if (count !== 2 && count !== 3) {
      res.status(400).json({ success: false, error: 'count must be 2 or 3' });
      return;
    }

    // Only allow if tenant has no shifts
    const existing = await db.getAllShifts(tenantId);
    if (existing.length > 0) {
      res.status(409).json({ success: false, error: 'Shifts already exist. Delete existing shifts first or add individually.' });
      return;
    }

    const presets: Array<{ shift_name: string; start_time: string; end_time: string }> =
      count === 2
        ? [
            { shift_name: 'Day', start_time: '06:00', end_time: '18:00' },
            { shift_name: 'Night', start_time: '18:00', end_time: '06:00' },
          ]
        : [
            { shift_name: 'Morning', start_time: '06:00', end_time: '14:00' },
            { shift_name: 'Afternoon', start_time: '14:00', end_time: '22:00' },
            { shift_name: 'Night', start_time: '22:00', end_time: '06:00' },
          ];

    const created: Awaited<ReturnType<typeof db.createShift>>[] = [];
    for (const preset of presets) {
      const shift = await db.createShift(preset, tenantId);
      created.push(shift);
    }

    await logActivity(
      req.user!.user_id,
      'BULK_CREATE_SHIFTS',
      'shift',
      0,
      `Created ${count} preset shifts`,
      req.ip,
      tenantId,
    );

    res.status(201).json({ success: true, shifts: created });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create shifts' });
  }
});

// ─── Seed helper (used by API gateway on startup) ───

export async function seedDefaultShifts(): Promise<void> {
  const shifts = await db.getAllShifts();
  if (shifts.length === 0) {
    // Get the default tenant_id for on-prem seeding
    let tenantId: number | null = null;
    try {
      const tenantResult = await query(
        `SELECT tenant_id FROM tenants WHERE tenant_slug = 'default' LIMIT 1`,
      );
      tenantId = tenantResult.rows[0]?.tenant_id ?? null;
    } catch {
      // tenants table may not exist in minimal setups
    }

    await db.createShift({ shift_name: 'Morning', start_time: '06:00', end_time: '14:00' }, tenantId);
    await db.createShift({ shift_name: 'Afternoon', start_time: '14:00', end_time: '22:00' }, tenantId);
    await db.createShift({ shift_name: 'Night', start_time: '22:00', end_time: '06:00' }, tenantId);
    console.log('[FactoryOS] ✅ Default shifts created (Morning/Afternoon/Night)');
  }
}
