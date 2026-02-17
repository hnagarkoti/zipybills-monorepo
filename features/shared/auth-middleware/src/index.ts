/**
 * FactoryOS Shared Auth Middleware
 *
 * Provides:
 * - Token generation on login
 * - Token verification middleware
 * - Role-based access control helpers
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV || 'development';

// B8: JWT_SECRET MUST be set in production — no silent fallback
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (NODE_ENV === 'production') {
      console.error('[AUTH] FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
      process.exit(1);
    }
    console.warn('[AUTH] ⚠️  JWT_SECRET not set — using dev-only fallback. NEVER use in production.');
    return 'factory-os-dev-secret-DO-NOT-USE-IN-PRODUCTION';
  }
  return secret;
})();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  user_id: number;
  username: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  full_name: string;
  /** SaaS mode: tenant the user belongs to */
  tenant_id?: number;
  /** SaaS mode: platform-level admin flag */
  is_platform_admin?: boolean;
  /** Access scope: PLATFORM for super admin, TENANT for tenant users */
  scope?: 'PLATFORM' | 'TENANT';
  /** Fine-grained permissions from RBAC system */
  permissions?: string[];
  /** Tenant plan (for frontend plan awareness) */
  plan?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Express middleware that requires a valid JWT.
 * Attaches decoded user info to `req.user`.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/**
 * Express middleware that requires specific roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Platform admins bypass role checks
    if (req.user.is_platform_admin || req.user.scope === 'PLATFORM') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware that restricts access to platform-scope admins only.
 * Use for routes that must NEVER be accessible by tenant users.
 * Platform admins CANNOT modify production data through tenant routes.
 */
export function requirePlatformScope(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  if (req.user.scope !== 'PLATFORM' && !req.user.is_platform_admin) {
    res.status(403).json({ success: false, error: 'Platform access only' });
    return;
  }
  next();
}

/**
 * Middleware that restricts access to tenant-scope users only.
 * Prevents platform admins from directly modifying tenant production data.
 * Platform admins must use impersonation to act within a tenant.
 */
export function requireTenantScope(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  // Platform admins should use impersonation, not direct access
  if (req.user.scope === 'PLATFORM' || (req.user.is_platform_admin && !(req.user as any).is_impersonation)) {
    res.status(403).json({ success: false, error: 'Platform admins must use impersonation to modify tenant data. Use the impersonation tool from the Platform Admin panel.' });
    return;
  }
  next();
}
