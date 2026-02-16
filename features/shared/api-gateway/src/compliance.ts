/**
 * Compliance Enforcement – API Gateway Module
 *
 * Provides:
 *   1. REST API for reading/updating compliance settings (per-tenant)
 *   2. Express middleware that blocks mutations based on active compliance settings
 *
 * The compliance settings are stored in `tenant_compliance_settings` and
 * apply tenant-wide. An ADMIN can configure the mode and individual toggles.
 *
 * Enforcement runs AFTER requireAuth + requireTenant, so req.user and
 * req.tenantId are always available.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { query } from '@zipybills/factory-database-config';
import { requireAuth, requireRole, type AuthenticatedRequest } from '@zipybills/factory-auth-middleware';

// ─── Types ────────────────────────────────────

export interface ComplianceSettings {
  compliance_mode: string;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_modify_config: boolean;
  requires_confirmation: boolean;
  requires_reason: boolean;
  activated_by: number | null;
  activated_at: string | null;
}

const DEFAULT_SETTINGS: ComplianceSettings = {
  compliance_mode: 'standard',
  can_create: true,
  can_edit: true,
  can_delete: true,
  can_export: true,
  can_modify_config: true,
  requires_confirmation: false,
  requires_reason: false,
  activated_by: null,
  activated_at: null,
};

// ─── In-memory cache (per tenant, TTL 30s) ───

const cache = new Map<number, { settings: ComplianceSettings; expiry: number }>();
const CACHE_TTL = 30_000; // 30 seconds

async function getComplianceSettings(tenantId: number): Promise<ComplianceSettings> {
  const cached = cache.get(tenantId);
  if (cached && Date.now() < cached.expiry) return cached.settings;

  const r = await query(
    `SELECT compliance_mode, can_create, can_edit, can_delete, can_export,
            can_modify_config, requires_confirmation, requires_reason,
            activated_by, activated_at
     FROM tenant_compliance_settings WHERE tenant_id = $1`,
    [tenantId],
  );

  const settings: ComplianceSettings = r.rows[0]
    ? {
        compliance_mode: r.rows[0].compliance_mode,
        can_create: r.rows[0].can_create,
        can_edit: r.rows[0].can_edit,
        can_delete: r.rows[0].can_delete,
        can_export: r.rows[0].can_export,
        can_modify_config: r.rows[0].can_modify_config,
        requires_confirmation: r.rows[0].requires_confirmation,
        requires_reason: r.rows[0].requires_reason,
        activated_by: r.rows[0].activated_by,
        activated_at: r.rows[0].activated_at,
      }
    : DEFAULT_SETTINGS;

  cache.set(tenantId, { settings, expiry: Date.now() + CACHE_TTL });
  return settings;
}

function invalidateCache(tenantId: number): void {
  cache.delete(tenantId);
}

// ─── API Router ───────────────────────────────

export const complianceRouter = Router();

/** GET /compliance/settings – Get current compliance settings for this tenant */
complianceRouter.get('/compliance/settings', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = (req as any).tenantId as number | undefined;
    if (!tenantId) {
      // On-prem mode (no tenant) – use tenant_id 0 as default
      const settings = await getComplianceSettings(0);
      res.json({ success: true, ...settings });
      return;
    }
    const settings = await getComplianceSettings(tenantId);
    res.json({ success: true, ...settings });
  } catch (err) {
    console.error('[Compliance] Failed to get settings:', err);
    res.status(500).json({ success: false, error: 'Failed to get compliance settings' });
  }
});

/** PUT /compliance/settings – Update compliance settings (ADMIN only) */
complianceRouter.put('/compliance/settings', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = (req as any).tenantId ?? 0;
    const {
      compliance_mode,
      can_create,
      can_edit,
      can_delete,
      can_export,
      can_modify_config,
      requires_confirmation,
      requires_reason,
    } = req.body;

    await query(
      `INSERT INTO tenant_compliance_settings
        (tenant_id, compliance_mode, can_create, can_edit, can_delete, can_export,
         can_modify_config, requires_confirmation, requires_reason, activated_by, activated_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         compliance_mode = EXCLUDED.compliance_mode,
         can_create = EXCLUDED.can_create,
         can_edit = EXCLUDED.can_edit,
         can_delete = EXCLUDED.can_delete,
         can_export = EXCLUDED.can_export,
         can_modify_config = EXCLUDED.can_modify_config,
         requires_confirmation = EXCLUDED.requires_confirmation,
         requires_reason = EXCLUDED.requires_reason,
         activated_by = EXCLUDED.activated_by,
         activated_at = CASE
           WHEN tenant_compliance_settings.compliance_mode != EXCLUDED.compliance_mode
           THEN NOW() ELSE tenant_compliance_settings.activated_at END,
         updated_at = NOW()`,
      [
        tenantId,
        compliance_mode ?? 'standard',
        can_create ?? true,
        can_edit ?? true,
        can_delete ?? true,
        can_export ?? true,
        can_modify_config ?? true,
        requires_confirmation ?? false,
        requires_reason ?? false,
        req.user!.user_id,
      ],
    );

    invalidateCache(tenantId);

    const updated = await getComplianceSettings(tenantId);
    res.json({ success: true, ...updated });
  } catch (err) {
    console.error('[Compliance] Failed to update settings:', err);
    res.status(500).json({ success: false, error: 'Failed to update compliance settings' });
  }
});

// ─── Enforcement Middleware ───────────────────

/** HTTP methods that are considered write operations */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Paths that should be excluded from compliance enforcement */
const EXEMPT_PATHS = [
  '/auth',              // login/register must always work
  '/compliance',        // compliance settings themselves must ALWAYS be changeable
  '/feature-',          // feature registry
  '/permissions',       // permission management
  '/gdrive/callback',   // OAuth callbacks
  '/settings',          // user settings / preferences
];

/**
 * Express middleware: enforces compliance settings on write operations.
 *
 * Install AFTER requireAuth + requireTenant in the middleware chain.
 * Checks the tenant's compliance settings and blocks disallowed mutations.
 */
export function enforceCompliance(req: Request, res: Response, next: NextFunction): void {
  // Only check write operations
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip exempt paths – check both originalUrl (full path) and req.path (mount-relative)
  const urlsToCheck = [req.originalUrl, req.path, req.baseUrl + req.path];
  const isExempt = EXEMPT_PATHS.some((p) => urlsToCheck.some((url) => url?.includes(p)));
  if (isExempt) {
    next();
    return;
  }

  const tenantId = (req as any).tenantId ?? 0;

  // Async check
  getComplianceSettings(tenantId)
    .then((settings) => {
      // Standard mode with all defaults – skip checks
      if (settings.compliance_mode === 'standard'
        && settings.can_create && settings.can_edit
        && settings.can_delete && settings.can_export
        && settings.can_modify_config) {
        return next();
      }

      const method = req.method;

      // POST = create
      if (method === 'POST' && !settings.can_create) {
        return res.status(403).json({
          success: false,
          error: 'Create operations are blocked by current compliance settings',
          code: 'COMPLIANCE_BLOCKED',
          complianceMode: settings.compliance_mode,
        });
      }

      // PUT/PATCH = edit
      if ((method === 'PUT' || method === 'PATCH') && !settings.can_edit) {
        return res.status(403).json({
          success: false,
          error: 'Edit operations are blocked by current compliance settings',
          code: 'COMPLIANCE_BLOCKED',
          complianceMode: settings.compliance_mode,
        });
      }

      // DELETE
      if (method === 'DELETE' && !settings.can_delete) {
        return res.status(403).json({
          success: false,
          error: 'Delete operations are blocked by current compliance settings',
          code: 'COMPLIANCE_BLOCKED',
          complianceMode: settings.compliance_mode,
        });
      }

      // Check if reason is required but not provided
      if (settings.requires_reason) {
        const reason = req.headers['x-compliance-reason'] as string | undefined;
        if (!reason || reason.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'A reason is required for this operation under current compliance settings',
            code: 'COMPLIANCE_REASON_REQUIRED',
            complianceMode: settings.compliance_mode,
          });
        }
      }

      next();
    })
    .catch((err) => {
      console.error('[Compliance] Enforcement check failed:', err);
      // On error, allow the request through (fail-open)
      next();
    });
}
