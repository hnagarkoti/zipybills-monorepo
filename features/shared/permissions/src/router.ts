/**
 * FactoryOS Permissions API Router
 *
 * Endpoints:
 *   GET    /permissions/me         — current user's permissions
 *   GET    /permissions/roles      — all roles with their permissions
 *   GET    /permissions/role/:role — permissions for a specific role
 *   PATCH  /permissions/role/:role — update role permissions (ADMIN)
 *   POST   /permissions/role/:role/reset — reset role to defaults (ADMIN)
 *   GET    /permissions/user/:id   — permissions for a specific user (ADMIN)
 *   PATCH  /permissions/user/:id   — update user permissions (ADMIN)
 *   GET    /permissions/all        — list all available permissions
 */

import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import {
  getUserPermissions,
  getRoleOverrides,
  getUserOverrides,
  setRolePermission,
  setUserPermission,
  resetRolePermissions,
  DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
  type Permission,
  type Role,
} from './index.js';

export const permissionsRouter = Router();

// ─── Current User ─────────────────────────────

permissionsRouter.get('/permissions/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const perms = await getUserPermissions(req.user!.user_id, req.user!.role as Role);
    res.json({
      success: true,
      role: req.user!.role,
      permissions: perms,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
  }
});

// ─── Role Management (ADMIN) ──────────────────

permissionsRouter.get('/permissions/roles', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const roles: Role[] = ['ADMIN', 'SUPERVISOR', 'OPERATOR'];
    const result = [];

    for (const role of roles) {
      const overrides = await getRoleOverrides(role);
      result.push({
        role,
        defaultPermissions: DEFAULT_PERMISSIONS[role],
        overrides,
      });
    }

    res.json({ success: true, roles: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
});

permissionsRouter.get('/permissions/role/:role', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const role = req.params.role as Role;
    if (!DEFAULT_PERMISSIONS[role]) {
      res.status(404).json({ success: false, error: 'Role not found' });
      return;
    }

    const overrides = await getRoleOverrides(role);
    // Compute effective permissions
    const effective = new Set(DEFAULT_PERMISSIONS[role]);
    for (const o of overrides) {
      if (o.granted) effective.add(o.permission as Permission);
      else effective.delete(o.permission as Permission);
    }

    res.json({
      success: true,
      role,
      defaults: DEFAULT_PERMISSIONS[role],
      overrides,
      effective: Array.from(effective),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch role permissions' });
  }
});

permissionsRouter.patch('/permissions/role/:role', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.params.role as Role;
    const { permission, granted } = req.body;

    if (!permission || typeof granted !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'permission (string) and granted (boolean) are required',
      });
      return;
    }

    await setRolePermission(role, permission as Permission, granted, req.user!.user_id);
    res.json({ success: true, message: `Permission ${granted ? 'granted' : 'revoked'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update permission' });
  }
});

permissionsRouter.post('/permissions/role/:role/reset', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.params.role as Role;
    await resetRolePermissions(role, req.user!.user_id);
    res.json({
      success: true,
      message: `Permissions reset to defaults for ${role}`,
      permissions: DEFAULT_PERMISSIONS[role],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset permissions' });
  }
});

// ─── User-Level Overrides (ADMIN) ─────────────

permissionsRouter.get('/permissions/user/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const overrides = await getUserOverrides(userId);
    res.json({ success: true, userId, overrides });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user permissions' });
  }
});

permissionsRouter.patch('/permissions/user/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { permission, granted } = req.body;

    if (!permission || typeof granted !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'permission (string) and granted (boolean) are required',
      });
      return;
    }

    await setUserPermission(userId, permission as Permission, granted, req.user!.user_id);
    res.json({ success: true, message: `User permission ${granted ? 'granted' : 'revoked'}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user permission' });
  }
});

// ─── Reference ────────────────────────────────

permissionsRouter.get('/permissions/all', requireAuth, async (_req, res) => {
  res.json({ success: true, permissions: ALL_PERMISSIONS });
});
