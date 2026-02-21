/**
 * FactoryOS Multi-Tenancy API Router
 *
 * Platform-admin endpoints for managing tenants.
 * Tenant-admin endpoints for managing their own tenant.
 *
 * Platform Admin routes (require is_platform_admin):
 *   GET    /tenants                — List all tenants
 *   POST   /tenants                — Create a new tenant
 *   GET    /tenants/:id            — Get tenant details
 *   PATCH  /tenants/:id            — Update tenant
 *   DELETE /tenants/:id            — Delete tenant
 *   GET    /tenants/:id/users      — List tenant users
 *   GET    /tenants/:id/usage      — Tenant resource usage
 *
 * Tenant-scoped routes (for tenant admins):
 *   GET    /tenant/me              — Current user's tenant info
 *   PATCH  /tenant/me              — Update own tenant (limited fields)
 *   GET    /tenant/me/users        — List own tenant users
 *   GET    /tenant/me/usage        — Own tenant usage stats
 */

import { Router } from 'express';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import { query } from '@zipybills/factory-database-config';
import {
  createTenant,
  getTenantById,
  getAllTenants,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantUsage,
  getUserTenant,
  addUserToTenant,
  removeUserFromTenant,
  provisionTenant,
  validateTenantLimits,
  invalidateTenantCache,
  type TenantPlan,
} from './index.js';
import { requirePlatformAdmin, type TenantRequest } from './middleware.js';

export const tenantRouter = Router();

// ─── Platform Admin Routes ────────────────────

tenantRouter.get('/tenants', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const { tenants, total } = await getAllTenants(page, limit);

    // Enrich with usage data
    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const usage = await getTenantUsage(t.tenant_id);
        return { ...t, usage };
      }),
    );

    res.json({
      success: true,
      tenants: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[Tenants] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to list tenants' });
  }
});

tenantRouter.post('/tenants', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { company_name, plan, domain, admin_username, admin_password, admin_full_name } = req.body;

    if (!company_name) {
      res.status(400).json({ success: false, error: 'company_name is required' });
      return;
    }

    // If admin creds provided, use full provisioning (creates tenant + admin user + default shifts)
    if (admin_username && admin_password && admin_full_name) {
      const result = await provisionTenant(
        company_name,
        admin_username,
        admin_password,
        admin_full_name,
        (plan as TenantPlan) || 'FREE',
        domain,
      );

      await logActivity(
        req.user!.user_id,
        'CREATE_TENANT',
        'tenant',
        result.tenant.tenant_id,
        `Provisioned tenant "${company_name}" (${plan || 'FREE'}) with admin ${admin_username}`,
        req.ip,
      );

      res.status(201).json({ success: true, tenant: result.tenant, adminUserId: result.adminUserId });
      return;
    }

    // Otherwise just create the tenant shell
    const tenant = await createTenant(company_name, (plan as TenantPlan) || 'FREE', domain);

    await logActivity(
      req.user!.user_id,
      'CREATE_TENANT',
      'tenant',
      tenant.tenant_id,
      `Created tenant "${company_name}" (${plan || 'FREE'})`,
      req.ip,
    );

    res.status(201).json({ success: true, tenant });
  } catch (err) {
    console.error('[Tenants] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create tenant' });
  }
});

tenantRouter.get('/tenants/:id', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const tenant = await getTenantById(parseInt(req.params.id as string, 10));
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }
    const usage = await getTenantUsage(tenant.tenant_id);
    res.json({ success: true, tenant, usage });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get tenant' });
  }
});

tenantRouter.patch('/tenants/:id', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = parseInt(req.params.id as string, 10);
    const { company_name, domain, logo_url, status, plan, max_users, max_machines, settings } = req.body;

    const tenant = await updateTenant(tenantId, {
      company_name, domain, logo_url, status, plan, max_users, max_machines, settings,
    });

    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    await logActivity(
      req.user!.user_id,
      'UPDATE_TENANT',
      'tenant',
      tenantId,
      `Updated tenant ${tenantId}`,
      req.ip,
    );

    res.json({ success: true, tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update tenant' });
  }
});

tenantRouter.delete('/tenants/:id', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = parseInt(req.params.id as string, 10);
    // E9 / J5: Soft delete — marks tenant CANCELLED + is_active = false
    const deleted = await deleteTenant(tenantId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Tenant not found or already cancelled' });
      return;
    }

    await logActivity(
      req.user!.user_id,
      'SOFT_DELETE_TENANT',
      'tenant',
      tenantId,
      `Soft-deleted tenant ${tenantId}`,
      req.ip,
    );

    res.json({ success: true, message: 'Tenant soft-deleted (cancelled). Use hard_delete=true for permanent removal.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete tenant' });
  }
});

// E9: GDPR-compliant tenant data export
tenantRouter.get('/tenants/:id/export', requireAuth, requirePlatformAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = parseInt(req.params.id as string, 10);
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    // Export all tenant data for GDPR compliance
    const [users, machines, shifts, plans, logs, downtime, activity] = await Promise.all([
      query(`SELECT user_id, username, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM machines WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM shifts WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM production_plans WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM production_logs WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM downtime_logs WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT * FROM activity_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1000`, [tenantId]),
    ]);

    await logActivity(
      req.user!.user_id,
      'EXPORT_TENANT_DATA',
      'tenant',
      tenantId,
      `Exported data for tenant ${tenantId} (${tenant.company_name})`,
      req.ip,
    );

    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      tenant,
      data: {
        users: users.rows,
        machines: machines.rows,
        shifts: shifts.rows,
        production_plans: plans.rows,
        production_logs: logs.rows,
        downtime_logs: downtime.rows,
        activity_log: activity.rows,
      },
    });
  } catch (err) {
    console.error('[Tenants] Export error:', err);
    res.status(500).json({ success: false, error: 'Failed to export tenant data' });
  }
});

tenantRouter.get('/tenants/:id/users', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const users = await getTenantUsers(parseInt(req.params.id as string, 10));
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get tenant users' });
  }
});

tenantRouter.get('/tenants/:id/usage', requireAuth, requirePlatformAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id as string, 10);
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }
    const usage = await getTenantUsage(tenantId);
    const usersLimit = await validateTenantLimits(tenantId, 'users');
    const machinesLimit = await validateTenantLimits(tenantId, 'machines');
    res.json({ success: true, usage, limits: { users: usersLimit, machines: machinesLimit } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get usage' });
  }
});

// ─── Tenant-Scoped Routes (for tenant admins) ─

tenantRouter.get('/tenant/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenant = await getUserTenant(req.user!.user_id);
    if (!tenant) {
      res.json({ success: true, tenant: null, message: 'No tenant associated (on-prem mode)' });
      return;
    }
    const usage = await getTenantUsage(tenant.tenant_id);
    res.json({ success: true, tenant, usage });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get tenant info' });
  }
});

tenantRouter.patch('/tenant/me', requireAuth, async (req: TenantRequest, res) => {
  try {
    const currentTenant = await getUserTenant(req.user!.user_id);
    if (!currentTenant) {
      res.status(404).json({ success: false, error: 'No tenant found' });
      return;
    }

    // Tenant admins can update profile + limited operational fields
    const {
      company_name, logo_url, settings,
      description, contact_email, contact_phone,
      address_line1, address_line2, city, state, country, postal_code,
      gst_number, industry, website, domain,
    } = req.body;

    // Validate fields
    if (company_name !== undefined && (typeof company_name !== 'string' || company_name.trim().length < 2)) {
      res.status(400).json({ success: false, error: 'Company name must be at least 2 characters' });
      return;
    }
    if (contact_email !== undefined && contact_email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      res.status(400).json({ success: false, error: 'Invalid email address' });
      return;
    }
    if (website !== undefined && website !== '' && !/^https?:\/\/.+/.test(website)) {
      res.status(400).json({ success: false, error: 'Website must start with http:// or https://' });
      return;
    }
    if (description !== undefined && typeof description === 'string' && description.length > 1000) {
      res.status(400).json({ success: false, error: 'Description must be under 1000 characters' });
      return;
    }

    const tenant = await updateTenant(currentTenant.tenant_id, {
      company_name, logo_url, settings,
      description, contact_email, contact_phone,
      address_line1, address_line2, city, state, country, postal_code,
      gst_number, industry, website, domain,
    });

    // Invalidate cache so next read picks up updates
    invalidateTenantCache(currentTenant.tenant_id);

    res.json({ success: true, tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update tenant' });
  }
});

// ─── Logo Upload (base64 data URI) ────────────
// Accepts a base64 data URI (client compresses/crops before upload).
// Max 50KB after encoding to keep Neon 500MB DB within budget.
const MAX_LOGO_SIZE_BYTES = 50 * 1024; // 50 KB

tenantRouter.post('/tenant/me/logo', requireAuth, async (req: TenantRequest, res) => {
  try {
    const currentTenant = await getUserTenant(req.user!.user_id);
    if (!currentTenant) {
      res.status(404).json({ success: false, error: 'No tenant found' });
      return;
    }

    const { logo } = req.body; // expects base64 data URI string

    if (!logo || typeof logo !== 'string') {
      res.status(400).json({ success: false, error: 'logo (base64 data URI) is required' });
      return;
    }

    // Validate it's a data URI of an image
    if (!logo.startsWith('data:image/')) {
      res.status(400).json({ success: false, error: 'Logo must be a base64-encoded image (data:image/...)' });
      return;
    }

    // Check size (base64 string length ≈ 4/3 × raw bytes, each char = 1 byte in UTF-8 for base64)
    const sizeBytes = Buffer.byteLength(logo, 'utf-8');
    if (sizeBytes > MAX_LOGO_SIZE_BYTES) {
      res.status(400).json({
        success: false,
        error: `Logo is too large (${Math.round(sizeBytes / 1024)}KB). Maximum ${MAX_LOGO_SIZE_BYTES / 1024}KB. Please compress or resize the image.`,
      });
      return;
    }

    const tenant = await updateTenant(currentTenant.tenant_id, { logo_url: logo });
    invalidateTenantCache(currentTenant.tenant_id);

    res.json({ success: true, logo_url: tenant?.logo_url });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

// ─── Delete Logo ──────────────────────────────

tenantRouter.delete('/tenant/me/logo', requireAuth, async (req: TenantRequest, res) => {
  try {
    const currentTenant = await getUserTenant(req.user!.user_id);
    if (!currentTenant) {
      res.status(404).json({ success: false, error: 'No tenant found' });
      return;
    }

    const tenant = await updateTenant(currentTenant.tenant_id, { logo_url: null as any });
    invalidateTenantCache(currentTenant.tenant_id);

    res.json({ success: true, tenant });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete logo' });
  }
});

tenantRouter.get('/tenant/me/users', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenant = await getUserTenant(req.user!.user_id);
    if (!tenant) {
      res.json({ success: true, users: [], message: 'No tenant (on-prem mode)' });
      return;
    }
    const users = await getTenantUsers(tenant.tenant_id);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

tenantRouter.get('/tenant/me/usage', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenant = await getUserTenant(req.user!.user_id);
    if (!tenant) {
      res.json({ success: true, usage: null, message: 'No tenant (on-prem mode)' });
      return;
    }
    const usage = await getTenantUsage(tenant.tenant_id);
    const usersLimit = await validateTenantLimits(tenant.tenant_id, 'users');
    const machinesLimit = await validateTenantLimits(tenant.tenant_id, 'machines');
    res.json({ success: true, usage, limits: { users: usersLimit, machines: machinesLimit } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get usage' });
  }
});

// ─── User management within tenant ────────────

tenantRouter.post('/tenant/me/users', requireAuth, async (req: TenantRequest, res) => {
  try {
    const tenant = await getUserTenant(req.user!.user_id);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'No tenant found' });
      return;
    }

    const { user_id, is_tenant_admin } = req.body;
    if (!user_id) {
      res.status(400).json({ success: false, error: 'user_id is required' });
      return;
    }

    // Check user limit
    const limitCheck = await validateTenantLimits(tenant.tenant_id, 'users');
    if (!limitCheck.allowed) {
      res.status(403).json({
        success: false,
        error: `User limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade your plan.`,
      });
      return;
    }

    const tenantUser = await addUserToTenant(tenant.tenant_id, user_id, is_tenant_admin ?? false);
    res.json({ success: true, tenantUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add user' });
  }
});

tenantRouter.delete('/tenant/me/users/:userId', requireAuth, async (req: TenantRequest, res) => {
  try {
    const tenant = await getUserTenant(req.user!.user_id);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'No tenant found' });
      return;
    }

    await removeUserFromTenant(tenant.tenant_id, parseInt(req.params.userId as string, 10));
    res.json({ success: true, message: 'User removed from tenant' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove user' });
  }
});
