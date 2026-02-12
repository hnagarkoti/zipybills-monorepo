/**
 * Theme Service – Express Router
 *
 * REST API for the FactoryOS Theme Service.
 *
 * Public Endpoints (authenticated):
 *   POST /resolve          – Resolve theme for current context
 *   GET  /available        – Get available themes for current user
 *   GET  /definitions      – List all theme definitions
 *   GET  /definitions/:id  – Get a specific theme definition
 *
 * Admin Endpoints (ADMIN role):
 *   POST   /definitions           – Register a custom theme
 *   PUT    /definitions/:id       – Update a custom theme
 *   DELETE /definitions/:id       – Remove a custom theme
 *   GET    /tenants               – List all tenant configs
 *   GET    /tenants/:tenantId     – Get tenant config
 *   PUT    /tenants/:tenantId     – Set/update tenant config
 *   DELETE /tenants/:tenantId     – Remove tenant config
 *   POST   /preview               – Preview a theme composition
 *   GET    /stats                  – Registry statistics
 *   POST   /bundle/import          – Import theme bundle
 *   GET    /bundle/export          – Export theme bundle
 */
import { Router, type Request, type Response } from 'express';
import type { AuthenticatedRequest } from '@zipybills/factory-auth-middleware';
import { requireAuth, requireRole } from '@zipybills/factory-auth-middleware';
import type { ThemeResolutionContext, ThemeDefinition, TenantThemeConfig, ThemeLayer } from './types';
import { themeRegistry } from './registry';
import { ThemeResolver } from './resolver';

const router = Router();
const resolver = new ThemeResolver(themeRegistry);

/** Safely extract a route param as string (Express 5 types: string | string[]) */
function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0]! : val ?? '';
}

// ─── Public Endpoints (require authentication) ───

/**
 * POST /resolve
 * Resolve theme for the given context.
 * Body: ThemeResolutionContext
 */
router.post('/resolve', requireAuth, (req: Request, res: Response): void => {
  try {
    const context: ThemeResolutionContext = req.body;

    if (!context.baseTheme) {
      res.status(400).json({ success: false, error: 'baseTheme is required' });
      return;
    }

    const resolved = resolver.resolve(context);

    // Set ETag for caching
    res.setHeader('ETag', `"${resolved.cacheKey}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');

    res.json({ success: true, theme: resolved });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /available
 * Get available themes for the current user's context.
 */
router.get('/available', requireAuth, (req: Request, res: Response): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    const available = resolver.getAvailableThemes({
      tenantId: (req.query.tenantId as string) ?? undefined,
      role: authReq.user?.role?.toLowerCase(),
    });

    res.json({ success: true, ...available });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /definitions
 * List all theme definitions, optionally filtered by layer.
 */
router.get('/definitions', requireAuth, (req: Request, res: Response): void => {
  try {
    const layer = req.query.layer as string | undefined;
    const definitions = themeRegistry.getAll(layer as any);

    res.json({ success: true, definitions, count: definitions.length });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /definitions/:id
 * Get a specific theme definition.
 */
router.get('/definitions/:id', requireAuth, (req: Request, res: Response): void => {
  try {
    const theme = themeRegistry.get(param(req, "id"));
    if (!theme) {
      res.status(404).json({ success: false, error: `Theme "${req.params.id}" not found` });
      return;
    }
    res.json({ success: true, definition: theme });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ─── Admin Endpoints (ADMIN role required) ────────

/**
 * POST /definitions
 * Register a new custom theme definition.
 */
router.post('/definitions', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const definition: ThemeDefinition = req.body;

    if (!definition.id || !definition.name || !definition.layer || !definition.tokens) {
      res.status(400).json({
        success: false,
        error: 'id, name, layer, and tokens are required',
      });
      return;
    }

    themeRegistry.register(definition);
    res.status(201).json({ success: true, definition });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * PUT /definitions/:id
 * Update an existing custom theme definition.
 */
router.put('/definitions/:id', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    themeRegistry.update(param(req, "id"), req.body);
    const updated = themeRegistry.get(param(req, "id"));
    res.json({ success: true, definition: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * DELETE /definitions/:id
 * Remove a custom theme definition.
 */
router.delete('/definitions/:id', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const removed = themeRegistry.remove(param(req, "id"));
    if (!removed) {
      res.status(404).json({ success: false, error: `Theme "${req.params.id}" not found` });
      return;
    }
    res.json({ success: true, message: `Theme "${req.params.id}" removed` });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /tenants
 * List all tenant theme configurations.
 */
router.get('/tenants', requireAuth, requireRole('ADMIN'), (_req: Request, res: Response): void => {
  try {
    const configs = themeRegistry.getAllTenantConfigs();
    res.json({ success: true, tenants: configs, count: configs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /tenants/:tenantId
 * Get a specific tenant's theme configuration.
 */
router.get('/tenants/:tenantId', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const config = themeRegistry.getTenantConfig(param(req, "tenantId"));
    if (!config) {
      res.status(404).json({ success: false, error: `Tenant config for "${req.params.tenantId}" not found` });
      return;
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * PUT /tenants/:tenantId
 * Set or update tenant theme configuration.
 */
router.put('/tenants/:tenantId', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const config: TenantThemeConfig = {
      ...req.body,
      tenantId: param(req, "tenantId"),
    };

    if (!config.branding?.name) {
      res.status(400).json({ success: false, error: 'branding.name is required' });
      return;
    }

    themeRegistry.setTenantConfig(config);
    res.json({ success: true, config });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * DELETE /tenants/:tenantId
 * Remove tenant theme configuration.
 */
router.delete('/tenants/:tenantId', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const removed = themeRegistry.removeTenantConfig(param(req, "tenantId"));
    if (!removed) {
      res.status(404).json({ success: false, error: `Tenant config for "${req.params.tenantId}" not found` });
      return;
    }
    res.json({ success: true, message: `Tenant config for "${req.params.tenantId}" removed` });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * POST /preview
 * Preview a theme composition without saving.
 * Body: { context: ThemeResolutionContext, additionalLayer?: ThemeLayer }
 */
router.post('/preview', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const { context, additionalLayer } = req.body as {
      context: ThemeResolutionContext;
      additionalLayer?: ThemeLayer;
    };

    if (!context?.baseTheme) {
      res.status(400).json({ success: false, error: 'context.baseTheme is required' });
      return;
    }

    const preview = resolver.preview(context, additionalLayer);
    res.json({ success: true, theme: preview });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /stats
 * Registry statistics.
 */
router.get('/stats', requireAuth, requireRole('ADMIN'), (_req: Request, res: Response): void => {
  try {
    const stats = themeRegistry.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * POST /bundle/import
 * Import a theme bundle (for on-prem deployment or migration).
 */
router.post('/bundle/import', requireAuth, requireRole('ADMIN'), (req: Request, res: Response): void => {
  try {
    const { themes, tenants } = req.body as {
      themes?: ThemeDefinition[];
      tenants?: TenantThemeConfig[];
    };

    let imported = 0;
    if (themes?.length) {
      imported += themeRegistry.loadBundle(themes);
    }
    if (tenants?.length) {
      for (const tc of tenants) {
        themeRegistry.setTenantConfig(tc);
        imported++;
      }
    }

    res.json({ success: true, imported, message: `Imported ${imported} items` });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/**
 * GET /bundle/export
 * Export all custom themes and tenant configs as a bundle.
 */
router.get('/bundle/export', requireAuth, requireRole('ADMIN'), (_req: Request, res: Response): void => {
  try {
    const bundle = themeRegistry.exportBundle();
    res.setHeader('Content-Disposition', 'attachment; filename="factoryos-theme-bundle.json"');
    res.json({ success: true, ...bundle });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export { router as themeRouter };
