/**
 * FactoryOS Tenant Isolation Middleware
 *
 * Resolves the tenant from the authenticated user's JWT and injects
 * tenant context into every request. Blocks access if the tenant is
 * suspended, cancelled, or trial-expired.
 *
 * Works in two modes:
 *   - SaaS mode: Tenant resolved from JWT tenant_id (enforced)
 *   - On-prem mode: No tenant context, all queries run unscoped (backward compat)
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { getTenantById, isTenantActive, PLAN_LIMITS, getPlanFeaturesForPlan, type Tenant, type TenantPlan } from './index.js';

// ─── Types ────────────────────────────────────

export interface TenantRequest extends AuthenticatedRequest {
  tenant?: Tenant;
  tenantId?: number;
}

// ─── Environment ──────────────────────────────

const SAAS_MODE = process.env.SAAS_MODE === 'true';

/**
 * Middleware that resolves tenant from the authenticated user's JWT.
 *
 * In SaaS mode: requires tenant context, blocks if missing/inactive.
 * In On-prem mode: passes through without tenant context.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as TenantRequest;
  const user = authReq.user;

  if (!SAAS_MODE) {
    // On-prem mode: still extract tenant_id from JWT if present (for testing / hybrid mode)
    if (user && (user as any).tenant_id) {
      authReq.tenantId = (user as any).tenant_id;
    }
    return next();
  }

  if (!user) {
    res.status(401).json({ success: false, error: 'Authentication required for tenant resolution' });
    return;
  }

  // tenant_id should be in the JWT payload (set during login)
  const tenantId = (user as any).tenant_id;

  if (!tenantId) {
    // Super admin (platform admin) — no tenant scope, allow through
    if ((user as any).is_platform_admin) {
      return next();
    }
    res.status(403).json({ success: false, error: 'No tenant associated with this user' });
    return;
  }

  // Resolve and validate tenant
  getTenantById(tenantId)
    .then(async (tenant) => {
      if (!tenant) {
        res.status(404).json({ success: false, error: 'Tenant not found' });
        return;
      }

      const active = await isTenantActive(tenantId);
      if (!active) {
        const msg = tenant.status === 'TRIAL'
          ? 'Your trial has expired. Please upgrade your plan.'
          : `Tenant is ${tenant.status.toLowerCase()}. Contact support.`;
        res.status(403).json({ success: false, error: msg, tenantStatus: tenant.status });
        return;
      }

      authReq.tenant = tenant;
      authReq.tenantId = tenantId;
      next();
    })
    .catch((err) => {
      console.error('[Tenant Isolation] Error resolving tenant:', err);
      res.status(500).json({ success: false, error: 'Failed to resolve tenant' });
    });
}

/**
 * Optional middleware — sets tenant context if available but doesn't block.
 * Useful for routes that work in both SaaS and on-prem modes.
 * Still validates active status to prevent suspended tenants from leaking data.
 */
export function optionalTenant(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as TenantRequest;
  const tenantId = (authReq.user as any)?.tenant_id;

  if (tenantId) {
    getTenantById(tenantId)
      .then(async (tenant) => {
        if (tenant) {
          const active = await isTenantActive(tenantId);
          if (active) {
            authReq.tenant = tenant;
            authReq.tenantId = tenantId;
          }
          // If inactive, proceed without tenant context (don't block)
        }
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}

/**
 * Require platform admin access (super admin that manages all tenants).
 * Platform admins have is_platform_admin = true in their JWT.
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as TenantRequest;
  const user = authReq.user;

  if (!user || !(user as any).is_platform_admin) {
    res.status(403).json({ success: false, error: 'Platform admin access required' });
    return;
  }
  next();
}

/**
 * Helper to get tenant-scoped WHERE clause for SQL queries.
 *
 * @returns { clause: string, params: any[] } — e.g. { clause: 'AND tenant_id = $3', params: [42] }
 */
export function tenantScope(req: Request, paramIndex: number): { clause: string; params: any[] } {
  const tenantId = (req as TenantRequest).tenantId;

  if (!SAAS_MODE || !tenantId) {
    return { clause: '', params: [] };
  }

  return {
    clause: ` AND tenant_id = $${paramIndex}`,
    params: [tenantId],
  };
}

/**
 * Helper to get tenant_id value for INSERT queries.
 * Returns null in on-prem mode.
 */
export function getTenantIdForInsert(req: Request): number | null {
  if (!SAAS_MODE) return null;
  return (req as TenantRequest).tenantId ?? null;
}

// ─── D4: Plan Feature Gating ─────────────────

/**
 * Middleware factory: blocks access if the tenant's plan does not include
 * the specified feature. Must be used AFTER requireTenant.
 *
 * In on-prem mode: always passes through (all features unlocked).
 * Platform admins: always passes through.
 *
 * @param featureId — the feature key from PLAN_LIMITS (e.g. 'reports', 'audit', 'export')
 */
export function requirePlanFeature(featureId: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!SAAS_MODE) return next();

    const authReq = req as TenantRequest;
    const user = authReq.user;

    // Platform admins bypass plan restrictions
    if ((user as any)?.is_platform_admin) return next();

    const tenant = authReq.tenant;
    if (!tenant) {
      // No tenant context — already handled by requireTenant
      return next();
    }

    const plan = tenant.plan as TenantPlan;
    const allowedFeatures = await getPlanFeaturesForPlan(plan);

    if (!allowedFeatures.includes(featureId)) {
      res.status(403).json({
        success: false,
        error: `Feature "${featureId}" is not available on the ${plan} plan. Please upgrade.`,
        code: 'PLAN_FEATURE_GATED',
        currentPlan: plan,
        requiredFeature: featureId,
      });
      return;
    }

    next();
  };
}

/**
 * Helper to check if a tenant's plan includes a feature (non-middleware).
 * Useful for conditional logic within route handlers.
 */
export async function tenantHasFeature(tenant: Tenant | undefined, featureId: string): Promise<boolean> {
  if (!SAAS_MODE || !tenant) return true; // On-prem: everything allowed
  const allowedFeatures = await getPlanFeaturesForPlan(tenant.plan);
  return allowedFeatures.includes(featureId);
}

// ─── Read-Only Enforcement for FREE Plan ──────

/**
 * Write methods that are blocked for FREE-plan tenants on data routes.
 * GET (read) is always allowed so users can view historical data.
 */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Data routes that should be read-only for FREE plan tenants.
 * Auth routes (/users, /auth) are excluded — admins need to manage users.
 * Billing/subscription routes excluded — users need to upgrade.
 */
const READ_ONLY_ROUTE_PREFIXES = [
  '/machines',
  '/shifts',
  '/plans',
  '/production-logs',
  '/downtime',
];

/**
 * Middleware: enforce read-only mode for FREE-plan tenants.
 *
 * After an Enterprise trial expires, the tenant is downgraded to FREE.
 * They can VIEW all their historical data (GET requests pass through)
 * but cannot CREATE, UPDATE, or DELETE records on data routes.
 *
 * Must be mounted AFTER requireTenant so tenant context is available.
 * In on-prem mode or for platform admins, this is a no-op.
 */
export function enforceFreePlanReadOnly(req: Request, res: Response, next: NextFunction): void {
  if (!SAAS_MODE) return next();

  const authReq = req as TenantRequest;
  const user = authReq.user;

  // Platform admins bypass
  if ((user as any)?.is_platform_admin) return next();

  const tenant = authReq.tenant;
  if (!tenant) return next();

  // Only enforce on FREE plan; allow writes for tenants still in TRIAL period
  if (tenant.plan !== 'FREE') return next();
  if (tenant.status === 'TRIAL' && tenant.trial_ends_at && new Date(tenant.trial_ends_at) > new Date()) return next();

  // Allow all GET/HEAD/OPTIONS (read operations)
  if (!WRITE_METHODS.has(req.method)) return next();

  // Check if the path matches a data route
  const isDataRoute = READ_ONLY_ROUTE_PREFIXES.some(
    (prefix) => req.path === prefix || req.path.startsWith(prefix + '/'),
  );

  if (!isDataRoute) return next();

  res.status(403).json({
    success: false,
    error: 'Your Free plan is read-only for production data. Upgrade your plan to create or modify records.',
    code: 'FREE_PLAN_READ_ONLY',
    currentPlan: 'FREE',
    allowedAction: 'VIEW',
    upgradeUrl: '/settings/billing',
  });
}
