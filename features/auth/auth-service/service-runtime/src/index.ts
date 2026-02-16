/**
 * FactoryOS Auth Service Runtime
 *
 * Express router for authentication & user management.
 * Routes: /api/auth/*, /api/users/*
 *
 * All operations are tenant-scoped in SaaS mode:
 * - Login resolves tenant_id from the user row and includes it in the JWT
 * - User CRUD is scoped to the authenticated user's tenant
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  generateToken,
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import { query } from '@zipybills/factory-database-config';
import * as db from './database.js';

export const authRouter = Router();

const SAAS_MODE = process.env.SAAS_MODE === 'true';

// ─── Helpers ─────────────────────────────────

/** Extract tenant_id from authenticated request (set by JWT / requireTenant middleware) */
function getTenantId(req: AuthenticatedRequest): number | null {
  return (req.user as any)?.tenant_id ?? null;
}

/** B3: Load user permissions from RBAC system */
async function loadUserPermissions(userId: number): Promise<string[]> {
  try {
    const result = await query<{ permission_name: string }>(
      `SELECT DISTINCT p.permission_name
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE ur.user_id = $1`,
      [userId],
    );
    return result.rows.map((r) => r.permission_name);
  } catch {
    // Permissions tables may not exist yet — return empty
    return [];
  }
}

/** B6: Check subscription expiry for SaaS tenants */
async function checkSubscriptionExpiry(tenantId: number): Promise<boolean> {
  try {
    const result = await query<{ current_period_end: string; status: string }>(
      `SELECT current_period_end, status FROM subscriptions WHERE tenant_id = $1 ORDER BY current_period_end DESC LIMIT 1`,
      [tenantId],
    );
    if (result.rows.length === 0) return true; // No subscription = allow (free tier)
    const sub = result.rows[0];
    if (sub.status === 'cancelled') return false;
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return false;
    return true;
  } catch {
    return true; // Table may not exist — pass through
  }
}

/** B7: Validate on-prem license */
async function validateOnPremLicense(): Promise<{ valid: boolean; reason?: string }> {
  if (SAAS_MODE) return { valid: true };
  try {
    const { validateLicense } = await import('@zipybills/factory-license-system');
    const result = await validateLicense();
    if (!result.valid) {
      return { valid: false, reason: result.warnings?.[0] || 'License invalid or expired' };
    }
    return { valid: true };
  } catch {
    // License system not available — allow in development
    return { valid: true };
  }
}

// ─── Auth Routes ─────────────────────────────

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password required' });
      return;
    }

    // In login we search globally — the user row carries tenant_id
    const user = await db.getUserByUsername(username);
    if (!user || !user.is_active) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const tenantId = (user as any).tenant_id ?? null;

    // B7: Validate on-prem license before allowing login
    const licenseCheck = await validateOnPremLicense();
    if (!licenseCheck.valid) {
      res.status(403).json({ success: false, error: `License invalid: ${licenseCheck.reason || 'expired or missing'}` });
      return;
    }

    // B6: Check subscription expiry for SaaS tenants
    if (SAAS_MODE && tenantId) {
      const subActive = await checkSubscriptionExpiry(tenantId);
      if (!subActive) {
        res.status(403).json({ success: false, error: 'Subscription expired. Please renew your plan.' });
        return;
      }
    }

    // B3: Load fine-grained permissions from RBAC system
    const permissions = await loadUserPermissions(user.user_id);

    // Resolve tenant plan + trial info for frontend awareness
    let plan: string | undefined;
    let trialEndsAt: string | undefined;
    let tenantStatus: string | undefined;
    let maxUsers: number | undefined;
    let maxMachines: number | undefined;
    if (tenantId) {
      try {
        const tenantResult = await query<{ plan: string; status: string; trial_ends_at: string | null; max_users: number; max_machines: number }>(
          `SELECT plan, status, trial_ends_at, max_users, max_machines FROM tenants WHERE tenant_id = $1`, [tenantId],
        );
        const t = tenantResult.rows[0];
        plan = t?.plan;
        trialEndsAt = t?.trial_ends_at ?? undefined;
        tenantStatus = t?.status;
        maxUsers = t?.max_users;
        maxMachines = t?.max_machines;
      } catch { /* pass */ }
    }

    // Check if user's tenant is the platform admin tenant
    let isPlatformAdmin = false;
    if (tenantId) {
      try {
        const tRes = await query<{ is_platform_admin: boolean }>(
          `SELECT is_platform_admin FROM tenants WHERE tenant_id = $1`, [tenantId],
        );
        isPlatformAdmin = tRes.rows[0]?.is_platform_admin ?? false;
      } catch { /* pass */ }
    }

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      // Include tenant context in JWT — this is the source of truth for all downstream services
      tenant_id: tenantId ?? undefined,
      is_platform_admin: isPlatformAdmin || undefined,
      scope: isPlatformAdmin ? 'PLATFORM' : 'TENANT',
      permissions: permissions.length > 0 ? permissions : undefined,
      plan,
    });

    await logActivity(user.user_id, 'LOGIN', 'user', user.user_id, `User ${user.username} logged in`, req.ip, tenantId);

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        tenant_id: tenantId,
        plan,
        permissions,
        is_platform_admin: isPlatformAdmin || undefined,
        scope: isPlatformAdmin ? 'PLATFORM' : 'TENANT',
        trial_ends_at: trialEndsAt,
        tenant_status: tenantStatus,
        max_users: maxUsers,
        max_machines: maxMachines,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

authRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const user = await db.getUserById(req.user!.user_id, tenantId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// ─── Tenant Account Info ─────────────────────

authRouter.get('/auth/account', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'No tenant context' });
      return;
    }

    const [tenantResult, userCountResult, machineCountResult] = await Promise.all([
      query(
        `SELECT tenant_id, company_name, domain, plan, status, trial_ends_at,
                max_users, max_machines, created_at
         FROM tenants WHERE tenant_id = $1`,
        [tenantId],
      ),
      query(`SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND is_active = true`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM machines WHERE tenant_id = $1`, [tenantId]),
    ]);

    const tenant = tenantResult.rows[0];
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    const currentUsers = parseInt(userCountResult.rows[0]?.count ?? '0', 10);
    const currentMachines = parseInt(machineCountResult.rows[0]?.count ?? '0', 10);

    res.json({
      success: true,
      account: {
        ...tenant,
        current_users: currentUsers,
        current_machines: currentMachines,
      },
    });
  } catch (err) {
    console.error('[Auth] Account info error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch account info' });
  }
});

// ─── User Management Routes ─────────────────

authRouter.get('/users', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const users = await db.getAllUsers(tenantId);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

authRouter.post('/users', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name || !role) {
      res.status(400).json({ success: false, error: 'All fields required: username, password, full_name, role' });
      return;
    }

    const tenantId = getTenantId(req);

    // Enforce plan limits in SaaS mode
    if (tenantId != null) {
      const { validateTenantLimits } = await import('@zipybills/factory-multi-tenancy');
      const limits = await validateTenantLimits(tenantId, 'users');
      if (!limits.allowed) {
        res.status(403).json({
          success: false,
          error: `User limit reached (${limits.current}/${limits.limit}). Upgrade your plan.`,
        });
        return;
      }
    }

    const existing = await db.getUserByUsername(username, tenantId);
    if (existing) {
      res.status(409).json({ success: false, error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser(username, passwordHash, full_name, role, tenantId);

    // Also add the user to tenant_users so usage counts are accurate
    if (tenantId != null) {
      const { addUserToTenant } = await import('@zipybills/factory-multi-tenancy');
      await addUserToTenant(tenantId, user.user_id, role === 'ADMIN');
    }

    await logActivity(req.user!.user_id, 'CREATE_USER', 'user', user.user_id, `Created user ${username} (${role})`, req.ip, tenantId);

    const { password_hash, ...safeUser } = user;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error('[Users] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

authRouter.put('/users/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    const tenantId = getTenantId(req);
    const user = await db.updateUser(userId, req.body, tenantId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    await logActivity(req.user!.user_id, 'UPDATE_USER', 'user', userId, JSON.stringify(req.body), req.ip, tenantId);

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

authRouter.delete('/users/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    if (userId === req.user!.user_id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }
    const tenantId = getTenantId(req);
    const deleted = await db.deleteUser(userId, tenantId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Also remove from tenant_users so usage counts stay accurate
    if (tenantId != null) {
      const { removeUserFromTenant } = await import('@zipybills/factory-multi-tenancy');
      await removeUserFromTenant(tenantId, userId);
    }

    await logActivity(req.user!.user_id, 'DELETE_USER', 'user', userId, `Deleted user #${userId}`, req.ip, tenantId);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

authRouter.patch('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      res.status(400).json({ success: false, error: 'current_password and new_password required' });
      return;
    }
    if (new_password.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      return;
    }

    const tenantId = getTenantId(req);
    const user = await db.getUserById(req.user!.user_id, tenantId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.updateUserPassword(req.user!.user_id, newHash, tenantId);
    await logActivity(req.user!.user_id, 'CHANGE_PASSWORD', 'user', req.user!.user_id, 'Password changed', req.ip, tenantId);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

// ─── Seed helpers (used by API gateway on startup) ───

export async function seedDefaultAdmin(): Promise<void> {
  const count = await db.getUserCount();
  if (count === 0) {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);

    // Get the default tenant_id (created by multi-tenancy schema init)
    let tenantId: number | null = null;
    try {
      const tenantResult = await query(
        `SELECT tenant_id FROM tenants WHERE tenant_slug = 'default' LIMIT 1`,
      );
      tenantId = tenantResult.rows[0]?.tenant_id ?? null;
    } catch {
      // tenants table may not exist in minimal setups
    }

    await db.createUser(username, hash, 'Administrator', 'ADMIN', tenantId);
    console.log(`[FactoryOS] ✅ Default admin created: ${username} / ${password}`);
  }
}
