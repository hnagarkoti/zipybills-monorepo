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

const JWT_SECRET = process.env.JWT_SECRET || 'factory-os-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  user_id: number;
  username: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  full_name: string;
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

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
