/**
 * FactoryOS Feature Registry – Express Middleware
 *
 * Provides:
 *  - requireFeature(id) – Gate middleware: returns 503 if feature.api is DISABLED
 *  - versionRouter()    – Version-aware route mounting
 *  - featureAdminRouter – Admin API for reading/toggling features at runtime
 *  - apiVersionMiddleware() – Injects Api-Version header + Deprecation/Sunset headers
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { featureRegistry, type FeatureOverride } from './index';

// ─── Feature Gate Middleware ─────────────────

/**
 * Express middleware that blocks requests when a feature's API is DISABLED.
 *
 * Usage:
 *   app.use('/api/v1/machines', requireFeature('machines'), machinesRouter);
 *
 * Behavior:
 *   - api=ENABLED   → next()
 *   - api=DEPRECATED → next(), adds Deprecation + Sunset headers
 *   - api=DISABLED  → 503 Service Unavailable
 */
export function requireFeature(featureId: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const feature = featureRegistry.getFeature(featureId);

    if (!feature) {
      res.status(404).json({
        success: false,
        error: `Unknown feature: ${featureId}`,
        code: 'FEATURE_NOT_FOUND',
      });
      return;
    }

    if (feature.api === 'DISABLED') {
      res.status(503).json({
        success: false,
        error: `Feature "${feature.label}" is currently disabled`,
        code: 'FEATURE_DISABLED',
        feature: featureId,
      });
      return;
    }

    if (feature.api === 'DEPRECATED') {
      res.setHeader('Deprecation', feature.deprecatedAt ?? 'true');
      if (feature.sunsetAt) {
        res.setHeader('Sunset', new Date(feature.sunsetAt).toUTCString());
      }
      res.setHeader('X-Feature-Deprecated', featureId);
    }

    // Inject current API version into request for downstream use
    (req as Request & { featureVersion?: string }).featureVersion = feature.apiVersion;

    next();
  };
}

// ─── API Version Middleware ──────────────────

/**
 * Global middleware that:
 *  1. Reads requested version from URL prefix (/api/v1/...) or Accept-Version header
 *  2. Injects `req.apiVersion` for downstream handlers
 *  3. Adds X-Api-Version response header
 */
export function apiVersionMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract version from URL: /api/v1/machines → "v1"
    const match = req.path.match(/^\/v(\d+)\//);
    const urlVersion = match ? `v${match[1]}` : undefined;

    // Or from Accept-Version header
    const headerVersion = req.headers['accept-version'] as string | undefined;

    const version = urlVersion ?? headerVersion ?? 'v1';
    (req as Request & { apiVersion?: string }).apiVersion = version;

    res.setHeader('X-Api-Version', version);

    next();
  };
}

// ─── Feature Admin API Router ────────────────

/**
 * Admin endpoints for managing features at runtime.
 *
 * Mount: app.use('/api/v1/admin/features', featureAdminRouter)
 *
 * Endpoints:
 *   GET    /              → List all features with status
 *   GET    /:id           → Get single feature details
 *   PATCH  /:id           → Update feature (api, ui, apiVersion)
 *   POST   /:id/enable    → Enable feature fully
 *   POST   /:id/disable   → Disable feature fully
 *   POST   /:id/disable-ui  → Disable UI only
 *   POST   /:id/disable-api → Disable API only
 *   POST   /:id/deprecate   → Mark as deprecated
 */
export const featureAdminRouter = Router();

/** Safely extract a route param (handles Express 4 & 5 param types) */
function param(req: Request, name: string): string {
  const val = req.params[name];
  return typeof val === 'string' ? val : String(val);
}

featureAdminRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    features: featureRegistry.getAllFeatures(),
    statusMap: featureRegistry.getStatusMap(),
  });
});

featureAdminRouter.get('/:id', (req: Request, res: Response) => {
  const id = param(req, 'id');
  const feature = featureRegistry.getFeature(id);
  if (!feature) {
    res.status(404).json({ success: false, error: `Feature not found: ${id}` });
    return;
  }
  res.json({ success: true, feature });
});

featureAdminRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    const { api, ui, apiVersion } = req.body as FeatureOverride;
    featureRegistry.setOverride(id, { api, ui, apiVersion });
    const updated = featureRegistry.getFeature(id);
    res.json({ success: true, feature: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update feature';
    res.status(400).json({ success: false, error: message });
  }
});

featureAdminRouter.post('/:id/enable', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    featureRegistry.enableFeature(id);
    res.json({ success: true, feature: featureRegistry.getFeature(id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to enable feature';
    res.status(400).json({ success: false, error: message });
  }
});

featureAdminRouter.post('/:id/disable', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    featureRegistry.disableFeature(id);
    res.json({ success: true, feature: featureRegistry.getFeature(id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to disable feature';
    res.status(400).json({ success: false, error: message });
  }
});

featureAdminRouter.post('/:id/disable-ui', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    featureRegistry.disableUi(id);
    res.json({ success: true, feature: featureRegistry.getFeature(id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update feature';
    res.status(400).json({ success: false, error: message });
  }
});

featureAdminRouter.post('/:id/disable-api', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    featureRegistry.disableApi(id);
    res.json({ success: true, feature: featureRegistry.getFeature(id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update feature';
    res.status(400).json({ success: false, error: message });
  }
});

featureAdminRouter.post('/:id/deprecate', (req: Request, res: Response) => {
  try {
    const id = param(req, 'id');
    const { sunsetAt } = req.body ?? {};
    featureRegistry.deprecateFeature(id, sunsetAt);
    res.json({ success: true, feature: featureRegistry.getFeature(id) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deprecate feature';
    res.status(400).json({ success: false, error: message });
  }
});
