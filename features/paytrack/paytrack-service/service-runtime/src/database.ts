/**
 * PayTrack – Database queries
 * All queries are tenant-scoped via `tenant_id` parameter.
 */

import { query } from '@zipybills/factory-database-config';

/* ═══════════════════════ VENDORS ═══════════════════════ */

export async function listVendors(tenantId: number) {
  const { rows } = await query(
    `SELECT v.*,
       COALESCE(SUM(m.total_amount), 0)::numeric AS total_billed,
       COALESCE(SUM(CASE WHEN m.status = 'paid' THEN m.total_amount ELSE 0 END), 0)::numeric AS total_paid,
       COUNT(m.id)::int AS material_count
     FROM pt_vendors v
     LEFT JOIN pt_materials m ON m.vendor_id = v.id AND m.tenant_id = v.tenant_id AND m.deleted_at IS NULL
     WHERE v.tenant_id = $1 AND v.deleted_at IS NULL
     GROUP BY v.id
     ORDER BY v.name`,
    [tenantId],
  );
  return rows;
}

export async function getVendor(tenantId: number, id: number) {
  const { rows } = await query(
    `SELECT * FROM pt_vendors WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
    [id, tenantId],
  );
  return rows[0] ?? null;
}

export async function createVendor(tenantId: number, data: Record<string, any>) {
  const { rows } = await query(
    `INSERT INTO pt_vendors (tenant_id, name, phone, email, gstin, address, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, data.name, data.phone, data.email, data.gstin, data.address, data.notes],
  );
  return rows[0];
}

export async function updateVendor(tenantId: number, id: number, data: Record<string, any>) {
  const { rows } = await query(
    `UPDATE pt_vendors SET name=$1, phone=$2, email=$3, gstin=$4, address=$5, notes=$6, updated_at=NOW()
     WHERE id=$7 AND tenant_id=$8 AND deleted_at IS NULL
     RETURNING *`,
    [data.name, data.phone, data.email, data.gstin, data.address, data.notes, id, tenantId],
  );
  return rows[0] ?? null;
}

export async function deleteVendor(tenantId: number, id: number) {
  await query(`UPDATE pt_vendors SET deleted_at=NOW() WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
}

/* ═══════════════════════ PROJECTS ═══════════════════════ */

export async function listProjects(tenantId: number) {
  const { rows } = await query(
    `SELECT p.*,
       COUNT(m.id)::int                             AS material_count,
       COALESCE(SUM(m.total_amount), 0)::numeric    AS total_requested,
       COALESCE(SUM(CASE WHEN m.status = 'paid' THEN m.total_amount ELSE 0 END), 0)::numeric AS total_paid,
       COALESCE(SUM(m.total_amount) - SUM(CASE WHEN m.status = 'paid' THEN m.total_amount ELSE 0 END), 0)::numeric AS pending_amount
     FROM pt_projects p
     LEFT JOIN pt_materials m ON m.project_id = p.id AND m.tenant_id = p.tenant_id AND m.deleted_at IS NULL
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [tenantId],
  );
  return rows;
}

export async function getProject(tenantId: number, id: number) {
  const { rows } = await query(
    `SELECT * FROM pt_projects WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
    [id, tenantId],
  );
  return rows[0] ?? null;
}

export async function createProject(tenantId: number, userId: number, data: Record<string, any>) {
  const { rows } = await query(
    `INSERT INTO pt_projects (tenant_id, name, client_name, description, budget, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, data.name, data.client_name, data.description, data.budget, userId],
  );
  return rows[0];
}

export async function updateProject(tenantId: number, id: number, data: Record<string, any>) {
  const { rows } = await query(
    `UPDATE pt_projects SET name=$1, client_name=$2, description=$3, budget=$4, status=$5, updated_at=NOW()
     WHERE id=$6 AND tenant_id=$7 AND deleted_at IS NULL
     RETURNING *`,
    [data.name, data.client_name, data.description, data.budget, data.status ?? 'active', id, tenantId],
  );
  return rows[0] ?? null;
}

export async function deleteProject(tenantId: number, id: number) {
  await query(`UPDATE pt_projects SET deleted_at=NOW() WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
}

/* ═══════════════════════ MATERIALS ═══════════════════════ */

export interface MaterialFilters {
  project_id?: number;
  vendor_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export async function listMaterials(tenantId: number, filters: MaterialFilters = {}) {
  const conditions: string[] = ['m.tenant_id = $1', 'm.deleted_at IS NULL'];
  const params: any[] = [tenantId];
  let idx = 2;

  if (filters.project_id) {
    conditions.push(`m.project_id = $${idx++}`);
    params.push(filters.project_id);
  }
  if (filters.vendor_id) {
    conditions.push(`m.vendor_id = $${idx++}`);
    params.push(filters.vendor_id);
  }
  if (filters.status) {
    conditions.push(`m.status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.date_from) {
    conditions.push(`m.created_at >= $${idx++}`);
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push(`m.created_at <= $${idx++}`);
    params.push(filters.date_to);
  }
  if (filters.search) {
    conditions.push(`(m.material_name ILIKE $${idx} OR m.invoice_number ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const { rows } = await query(
    `SELECT m.*,
       p.name   AS project_name,
       v.name   AS vendor_name,
       u.full_name AS created_by_name
     FROM pt_materials m
     JOIN pt_projects p ON p.id = m.project_id
     JOIN pt_vendors  v ON v.id = m.vendor_id
     LEFT JOIN users  u ON u.user_id = m.created_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY m.created_at DESC`,
    params,
  );
  return rows;
}

export async function getMaterial(tenantId: number, id: number) {
  const { rows } = await query(
    `SELECT m.*,
       p.name   AS project_name,
       v.name   AS vendor_name,
       u.full_name AS created_by_name,
       a.full_name AS approved_by_name
     FROM pt_materials m
     JOIN pt_projects p ON p.id = m.project_id
     JOIN pt_vendors  v ON v.id = m.vendor_id
     LEFT JOIN users  u ON u.user_id = m.created_by
     LEFT JOIN users  a ON a.user_id = m.approved_by
     WHERE m.id = $1 AND m.tenant_id = $2 AND m.deleted_at IS NULL`,
    [id, tenantId],
  );
  return rows[0] ?? null;
}

export async function createMaterial(tenantId: number, userId: number, data: Record<string, any>) {
  const totalAmount = Number(data.amount || 0) + Number(data.gst_amount || 0);
  const { rows } = await query(
    `INSERT INTO pt_materials
       (tenant_id, project_id, vendor_id, material_name, quantity, unit,
        invoice_number, invoice_image_url, amount, gst_amount, total_amount,
        notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      tenantId, data.project_id, data.vendor_id, data.material_name,
      data.quantity ?? 1, data.unit ?? 'pcs',
      data.invoice_number, data.invoice_image_url,
      data.amount ?? 0, data.gst_amount ?? 0, totalAmount,
      data.notes, userId,
    ],
  );
  return rows[0];
}

export async function updateMaterial(tenantId: number, id: number, data: Record<string, any>) {
  const totalAmount = Number(data.amount || 0) + Number(data.gst_amount || 0);
  const { rows } = await query(
    `UPDATE pt_materials SET
       project_id=$1, vendor_id=$2, material_name=$3, quantity=$4, unit=$5,
       invoice_number=$6, invoice_image_url=$7, amount=$8, gst_amount=$9,
       total_amount=$10, notes=$11, updated_at=NOW()
     WHERE id=$12 AND tenant_id=$13 AND deleted_at IS NULL AND status = 'pending'
     RETURNING *`,
    [
      data.project_id, data.vendor_id, data.material_name,
      data.quantity, data.unit ?? 'pcs',
      data.invoice_number, data.invoice_image_url,
      data.amount ?? 0, data.gst_amount ?? 0, totalAmount,
      data.notes, id, tenantId,
    ],
  );
  return rows[0] ?? null;
}

export async function approveMaterial(tenantId: number, id: number, userId: number) {
  const { rows } = await query(
    `UPDATE pt_materials SET status='approved', approved_by=$1, approved_at=NOW(), updated_at=NOW()
     WHERE id=$2 AND tenant_id=$3 AND status='pending' AND deleted_at IS NULL
     RETURNING *`,
    [userId, id, tenantId],
  );
  return rows[0] ?? null;
}

export async function requestPayment(tenantId: number, id: number) {
  const { rows } = await query(
    `UPDATE pt_materials SET status='payment_requested', updated_at=NOW()
     WHERE id=$1 AND tenant_id=$2 AND status='approved' AND deleted_at IS NULL
     RETURNING *`,
    [id, tenantId],
  );
  return rows[0] ?? null;
}

export async function rejectMaterial(tenantId: number, id: number, notes?: string) {
  const { rows } = await query(
    `UPDATE pt_materials SET status='rejected', notes=COALESCE($1, notes), updated_at=NOW()
     WHERE id=$2 AND tenant_id=$3 AND status IN ('pending','approved') AND deleted_at IS NULL
     RETURNING *`,
    [notes, id, tenantId],
  );
  return rows[0] ?? null;
}

export async function deleteMaterial(tenantId: number, id: number) {
  await query(`UPDATE pt_materials SET deleted_at=NOW() WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
}

/* ── Duplicate invoice check ── */
export async function checkDuplicateInvoice(tenantId: number, invoiceNumber: string, vendorId?: number) {
  const conditions = ['tenant_id = $1', 'invoice_number = $2', 'deleted_at IS NULL'];
  const params: any[] = [tenantId, invoiceNumber];
  if (vendorId) {
    conditions.push('vendor_id = $3');
    params.push(vendorId);
  }
  const { rows } = await query(
    `SELECT id, material_name, vendor_id, total_amount, status, created_at
     FROM pt_materials WHERE ${conditions.join(' AND ')}`,
    params,
  );
  return rows;
}

/* ═══════════════════════ PAYMENTS ═══════════════════════ */

export async function createPayment(tenantId: number, userId: number, materialId: number, data: Record<string, any>) {
  const { rows } = await query(
    `INSERT INTO pt_payments (tenant_id, material_id, payment_mode, transaction_id, payment_date, paid_amount, proof_image_url, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [tenantId, materialId, data.payment_mode, data.transaction_id, data.payment_date ?? new Date(), data.paid_amount, data.proof_image_url, data.notes, userId],
  );
  // Also update material status
  await query(
    `UPDATE pt_materials SET status='paid', updated_at=NOW() WHERE id=$1 AND tenant_id=$2`,
    [materialId, tenantId],
  );
  return rows[0];
}

export async function listPayments(tenantId: number, filters: { material_id?: number; date_from?: string; date_to?: string } = {}) {
  const conditions: string[] = ['pay.tenant_id = $1'];
  const params: any[] = [tenantId];
  let idx = 2;

  if (filters.material_id) { conditions.push(`pay.material_id = $${idx++}`); params.push(filters.material_id); }
  if (filters.date_from) { conditions.push(`pay.payment_date >= $${idx++}`); params.push(filters.date_from); }
  if (filters.date_to) { conditions.push(`pay.payment_date <= $${idx++}`); params.push(filters.date_to); }

  const { rows } = await query(
    `SELECT pay.*,
       m.material_name, m.invoice_number, m.total_amount AS material_total,
       p.name AS project_name,
       v.name AS vendor_name,
       u.full_name AS paid_by_name
     FROM pt_payments pay
     JOIN pt_materials m ON m.id = pay.material_id
     JOIN pt_projects  p ON p.id = m.project_id
     JOIN pt_vendors   v ON v.id = m.vendor_id
     LEFT JOIN users   u ON u.user_id = pay.created_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY pay.payment_date DESC`,
    params,
  );
  return rows;
}

/* ═══════════════════════ DASHBOARD ═══════════════════════ */

export async function getDashboardStats(tenantId: number) {
  // Overall summary
  const summaryRes = await query(
    `SELECT
       COUNT(*)::int                             AS total_materials,
       COUNT(*) FILTER (WHERE status='pending')::int           AS pending_count,
       COUNT(*) FILTER (WHERE status='approved')::int          AS approved_count,
       COUNT(*) FILTER (WHERE status='payment_requested')::int AS requested_count,
       COUNT(*) FILTER (WHERE status='paid')::int              AS paid_count,
       COALESCE(SUM(total_amount), 0)::numeric                 AS total_amount,
       COALESCE(SUM(total_amount) FILTER (WHERE status='paid'), 0)::numeric  AS paid_amount,
       COALESCE(SUM(total_amount) FILTER (WHERE status != 'paid' AND status != 'rejected'), 0)::numeric AS pending_amount
     FROM pt_materials
     WHERE tenant_id = $1 AND deleted_at IS NULL`,
    [tenantId],
  );

  // Project-wise summary
  const projectsRes = await query(
    `SELECT p.id, p.name, p.client_name,
       COUNT(m.id)::int                           AS material_count,
       COALESCE(SUM(m.total_amount), 0)::numeric  AS total_requested,
       COALESCE(SUM(m.total_amount) FILTER (WHERE m.status='paid'), 0)::numeric  AS total_paid,
       COALESCE(SUM(m.total_amount) FILTER (WHERE m.status != 'paid' AND m.status != 'rejected'), 0)::numeric AS pending_amount
     FROM pt_projects p
     LEFT JOIN pt_materials m ON m.project_id = p.id AND m.tenant_id = p.tenant_id AND m.deleted_at IS NULL
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY pending_amount DESC`,
    [tenantId],
  );

  // Vendor-wise summary
  const vendorsRes = await query(
    `SELECT v.id, v.name,
       COUNT(m.id)::int                           AS material_count,
       COALESCE(SUM(m.total_amount), 0)::numeric  AS total_billed,
       COALESCE(SUM(m.total_amount) FILTER (WHERE m.status='paid'), 0)::numeric  AS total_paid
     FROM pt_vendors v
     LEFT JOIN pt_materials m ON m.vendor_id = v.id AND m.tenant_id = v.tenant_id AND m.deleted_at IS NULL
     WHERE v.tenant_id = $1 AND v.deleted_at IS NULL
     GROUP BY v.id
     ORDER BY total_billed DESC
     LIMIT 10`,
    [tenantId],
  );

  // Recent entries (last 10)
  const recentRes = await query(
    `SELECT m.id, m.material_name, m.total_amount, m.status, m.created_at,
       p.name AS project_name, v.name AS vendor_name
     FROM pt_materials m
     JOIN pt_projects p ON p.id = m.project_id
     JOIN pt_vendors  v ON v.id = m.vendor_id
     WHERE m.tenant_id = $1 AND m.deleted_at IS NULL
     ORDER BY m.created_at DESC LIMIT 10`,
    [tenantId],
  );

  // Monthly totals (last 6 months)
  const monthlyRes = await query(
    `SELECT
       TO_CHAR(created_at, 'YYYY-MM') AS month,
       COALESCE(SUM(total_amount), 0)::numeric AS total,
       COALESCE(SUM(total_amount) FILTER (WHERE status='paid'), 0)::numeric AS paid,
       COUNT(*)::int AS entries
     FROM pt_materials
     WHERE tenant_id = $1 AND deleted_at IS NULL
       AND created_at >= NOW() - INTERVAL '6 months'
     GROUP BY month
     ORDER BY month DESC`,
    [tenantId],
  );

  return {
    summary: summaryRes.rows[0],
    projects: projectsRes.rows,
    vendors: vendorsRes.rows,
    recent: recentRes.rows,
    monthly: monthlyRes.rows,
  };
}
