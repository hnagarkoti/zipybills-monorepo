/**
 * FactoryOS Permission Middleware
 *
 * Express middleware for permission-based access control.
 * Replaces `requireRole()` with fine-grained `requirePermission()`.
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { hasPermission, hasAnyPermission, type Permission, type Role } from './index.js';

/**
 * Require a specific permission to access a route.
 * Must be placed AFTER requireAuth middleware.
 *
 * Usage: router.get('/machines', requireAuth, requirePermission('machines:view'), handler)
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const allowed = await hasPermission(req.user.user_id, req.user.role as Role, permission);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permission,
      });
      return;
    }

    next();
  };
}

/**
 * Require ANY of the specified permissions.
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const allowed = await hasAnyPermission(req.user.user_id, req.user.role as Role, permissions);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
      });
      return;
    }

    next();
  };
}
