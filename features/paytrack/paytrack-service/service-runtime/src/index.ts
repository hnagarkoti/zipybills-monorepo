/**
 * PayTrack – Express Router
 * Material tracking & payment management API.
 *
 * Roles:
 *   ADMIN      → Boss (full access, mark payments, dashboard)
 *   SUPERVISOR → Approves materials, requests payment
 *   OPERATOR   → Material entry staff (create entries only)
 */

import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';
export { initializePayTrackSchema } from './schema.js';

export const paytrackRouter = Router();

/* ── Helpers ── */

function tid(req: AuthenticatedRequest): number {
  return (req.user as any)?.tenant_id;
}
function uid(req: AuthenticatedRequest): number {
  return (req.user as any)?.user_id;
}

/* ═══════════════════ VENDORS ═══════════════════ */

paytrackRouter.get('/paytrack/vendors', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const vendors = await db.listVendors(tid(req));
    res.json({ success: true, vendors });
  } catch (err) {
    console.error('[PayTrack] listVendors error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch vendors' });
  }
});

paytrackRouter.get('/paytrack/vendors/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const vendor = await db.getVendor(tid(req), Number(req.params.id));
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    console.error('[PayTrack] getVendor error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch vendor' });
  }
});

paytrackRouter.post('/paytrack/vendors', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ success: false, error: 'Vendor name is required' });
    const vendor = await db.createVendor(tid(req), req.body);
    await logActivity(tid(req), uid(req), 'paytrack_vendor_created', `Vendor "${vendor.name}" created`, { vendor_id: vendor.id });
    res.status(201).json({ success: true, vendor });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Vendor with this name already exists' });
    console.error('[PayTrack] createVendor error:', err);
    res.status(500).json({ success: false, error: 'Failed to create vendor' });
  }
});

paytrackRouter.put('/paytrack/vendors/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const vendor = await db.updateVendor(tid(req), Number(req.params.id), req.body);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    console.error('[PayTrack] updateVendor error:', err);
    res.status(500).json({ success: false, error: 'Failed to update vendor' });
  }
});

paytrackRouter.delete('/paytrack/vendors/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteVendor(tid(req), Number(req.params.id));
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) {
    console.error('[PayTrack] deleteVendor error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete vendor' });
  }
});

/* ═══════════════════ PROJECTS ═══════════════════ */

paytrackRouter.get('/paytrack/projects', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const projects = await db.listProjects(tid(req));
    res.json({ success: true, projects });
  } catch (err) {
    console.error('[PayTrack] listProjects error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

paytrackRouter.get('/paytrack/projects/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const project = await db.getProject(tid(req), Number(req.params.id));
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    // Also fetch materials for this project
    const materials = await db.listMaterials(tid(req), { project_id: Number(req.params.id) });
    res.json({ success: true, project, materials });
  } catch (err) {
    console.error('[PayTrack] getProject error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

paytrackRouter.post('/paytrack/projects', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.body.name?.trim()) return res.status(400).json({ success: false, error: 'Project name is required' });
    const project = await db.createProject(tid(req), uid(req), req.body);
    await logActivity(tid(req), uid(req), 'paytrack_project_created', `Project "${project.name}" created`, { project_id: project.id });
    res.status(201).json({ success: true, project });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Project with this name already exists' });
    console.error('[PayTrack] createProject error:', err);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

paytrackRouter.put('/paytrack/projects/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const project = await db.updateProject(tid(req), Number(req.params.id), req.body);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    console.error('[PayTrack] updateProject error:', err);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

paytrackRouter.delete('/paytrack/projects/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteProject(tid(req), Number(req.params.id));
    await logActivity(tid(req), uid(req), 'paytrack_project_deleted', 'Project deleted', { project_id: req.params.id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('[PayTrack] deleteProject error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

/* ═══════════════════ MATERIALS ═══════════════════ */

paytrackRouter.get('/paytrack/materials', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const filters: db.MaterialFilters = {
      project_id: req.query.project_id ? Number(req.query.project_id) : undefined,
      vendor_id: req.query.vendor_id ? Number(req.query.vendor_id) : undefined,
      status: req.query.status as string | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      search: req.query.search as string | undefined,
    };
    const materials = await db.listMaterials(tid(req), filters);
    res.json({ success: true, materials });
  } catch (err) {
    console.error('[PayTrack] listMaterials error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

paytrackRouter.get('/paytrack/materials/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const material = await db.getMaterial(tid(req), Number(req.params.id));
    if (!material) return res.status(404).json({ success: false, error: 'Material entry not found' });
    // Also fetch payments for this material
    const payments = await db.listPayments(tid(req), { material_id: material.id });
    res.json({ success: true, material, payments });
  } catch (err) {
    console.error('[PayTrack] getMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch material' });
  }
});

paytrackRouter.post('/paytrack/materials', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { material_name, project_id, vendor_id, amount } = req.body;
    if (!material_name?.trim()) return res.status(400).json({ success: false, error: 'Material name is required' });
    if (!project_id) return res.status(400).json({ success: false, error: 'Project is required' });
    if (!vendor_id) return res.status(400).json({ success: false, error: 'Vendor is required' });
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });

    const material = await db.createMaterial(tid(req), uid(req), req.body);
    await logActivity(tid(req), uid(req), 'paytrack_material_created', `Material "${material_name}" added`, { material_id: material.id, project_id, vendor_id });
    res.status(201).json({ success: true, material });
  } catch (err) {
    console.error('[PayTrack] createMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to create material entry' });
  }
});

paytrackRouter.put('/paytrack/materials/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const material = await db.updateMaterial(tid(req), Number(req.params.id), req.body);
    if (!material) return res.status(404).json({ success: false, error: 'Material not found or already approved' });
    res.json({ success: true, material });
  } catch (err) {
    console.error('[PayTrack] updateMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

paytrackRouter.delete('/paytrack/materials/:id', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    await db.deleteMaterial(tid(req), Number(req.params.id));
    res.json({ success: true, message: 'Material entry deleted' });
  } catch (err) {
    console.error('[PayTrack] deleteMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

/* ── Workflow actions ── */

paytrackRouter.post('/paytrack/materials/:id/approve', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const material = await db.approveMaterial(tid(req), Number(req.params.id), uid(req));
    if (!material) return res.status(400).json({ success: false, error: 'Material not found or not in pending status' });
    await logActivity(tid(req), uid(req), 'paytrack_material_approved', `Material #${material.id} approved`, { material_id: material.id });
    res.json({ success: true, material });
  } catch (err) {
    console.error('[PayTrack] approveMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to approve material' });
  }
});

paytrackRouter.post('/paytrack/materials/:id/request-payment', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const material = await db.requestPayment(tid(req), Number(req.params.id));
    if (!material) return res.status(400).json({ success: false, error: 'Material not found or not in approved status' });
    await logActivity(tid(req), uid(req), 'paytrack_payment_requested', `Payment requested for material #${material.id}`, { material_id: material.id });
    res.json({ success: true, material });
  } catch (err) {
    console.error('[PayTrack] requestPayment error:', err);
    res.status(500).json({ success: false, error: 'Failed to request payment' });
  }
});

paytrackRouter.post('/paytrack/materials/:id/reject', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const material = await db.rejectMaterial(tid(req), Number(req.params.id), req.body.notes);
    if (!material) return res.status(400).json({ success: false, error: 'Material not found or already paid' });
    await logActivity(tid(req), uid(req), 'paytrack_material_rejected', `Material #${material.id} rejected`, { material_id: material.id });
    res.json({ success: true, material });
  } catch (err) {
    console.error('[PayTrack] rejectMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to reject material' });
  }
});

/* ── Mark as Paid (Boss only) ── */

paytrackRouter.post('/paytrack/materials/:id/pay', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { payment_mode, transaction_id, payment_date, paid_amount, proof_image_url, notes } = req.body;
    if (!payment_mode) return res.status(400).json({ success: false, error: 'Payment mode is required' });

    const materialId = Number(req.params.id);
    const material = await db.getMaterial(tid(req), materialId);
    if (!material) return res.status(404).json({ success: false, error: 'Material not found' });
    if (material.status === 'paid') return res.status(400).json({ success: false, error: 'Already paid' });
    if (material.status === 'rejected') return res.status(400).json({ success: false, error: 'Material was rejected' });

    const payment = await db.createPayment(tid(req), uid(req), materialId, {
      payment_mode,
      transaction_id,
      payment_date,
      paid_amount: paid_amount || material.total_amount,
      proof_image_url,
      notes,
    });

    await logActivity(tid(req), uid(req), 'paytrack_payment_made', `Payment of ₹${payment.paid_amount} for material #${materialId}`, { material_id: materialId, payment_id: payment.id });
    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error('[PayTrack] payMaterial error:', err);
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

/* ═══════════════════ PAYMENTS LIST ═══════════════════ */

paytrackRouter.get('/paytrack/payments', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payments = await db.listPayments(tid(req), {
      material_id: req.query.material_id ? Number(req.query.material_id) : undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
    });
    res.json({ success: true, payments });
  } catch (err) {
    console.error('[PayTrack] listPayments error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

/* ═══════════════════ DASHBOARD ═══════════════════ */

paytrackRouter.get('/paytrack/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await db.getDashboardStats(tid(req));
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error('[PayTrack] dashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

/* ═══════════════════ DUPLICATE CHECK ═══════════════════ */

paytrackRouter.get('/paytrack/check-invoice', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const invoiceNumber = req.query.number as string;
    if (!invoiceNumber) return res.status(400).json({ success: false, error: 'Invoice number is required' });
    const vendorId = req.query.vendor_id ? Number(req.query.vendor_id) : undefined;
    const duplicates = await db.checkDuplicateInvoice(tid(req), invoiceNumber, vendorId);
    res.json({ success: true, duplicates, hasDuplicate: duplicates.length > 0 });
  } catch (err) {
    console.error('[PayTrack] checkInvoice error:', err);
    res.status(500).json({ success: false, error: 'Failed to check invoice' });
  }
});
