/**
 * FactoryOS API Gateway
 *
 * Production-grade entry point that:
 * 1. Initializes the database schema
 * 2. Seeds default data (admin user, shifts)
 * 3. Mounts all per-feature Express routers behind versioned prefixes
 * 4. Guards every feature route with the Feature Registry
 * 5. Exposes admin endpoints for runtime feature management
 *
 * URL structure:
 *   /api/v1/machines   ← versioned (canonical)
 *   /api/v2/machines   ← future versions
 *   /api/health        ← unversioned (always available)
 *   /api/features      ← public feature status (for frontends)
 *   /api/v1/admin/features ← admin CRUD (ADMIN only)
 *
 * Each feature service is an independent package that exports an Express Router.
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Router } from 'express';
import cors from 'cors';

// Schema & seed helpers
import { initializeDatabase } from './schema.js';
import { authRouter, seedDefaultAdmin } from '@zipybills/factory-auth-service-runtime';
import { machinesRouter } from '@zipybills/factory-machines-service-runtime';
import { shiftsRouter, seedDefaultShifts } from '@zipybills/factory-shifts-service-runtime';
import { planningRouter } from '@zipybills/factory-planning-service-runtime';
import { downtimeRouter } from '@zipybills/factory-downtime-service-runtime';
import { dashboardRouter } from '@zipybills/factory-dashboard-service-runtime';
import { reportsRouter } from '@zipybills/factory-reports-service-runtime';

// Feature Registry
import { featureRegistry } from '@zipybills/factory-feature-registry';
import {
  requireFeature,
  apiVersionMiddleware,
  featureAdminRouter,
} from '@zipybills/factory-feature-registry/middleware';

// Auth middleware (for admin route protection)
import { requireAuth, requireRole } from '@zipybills/factory-auth-middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors());
app.use(express.json());

// ─── Global API‑Version Middleware ───────────

app.use('/api', apiVersionMiddleware());

// ─── Health Check (unversioned, always available) ──

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'FactoryOS API Gateway',
    apiVersions: ['v1'],
    timestamp: new Date().toISOString(),
  });
});

// ─── Public Feature Status (for frontend hydration) ─

app.get('/api/features', (_req, res) => {
  res.json({
    success: true,
    features: featureRegistry.getAllFeatures(),
    statusMap: featureRegistry.getStatusMap(),
  });
});

// ─── Admin Feature Management API ────────────
//
// MUST be mounted BEFORE feature routers so /api/v1/admin/*
// is matched first and not intercepted by requireFeature().

app.use(
  '/api/v1/admin/features',
  requireAuth,
  requireRole('ADMIN'),
  featureAdminRouter,
);

// ─── Version‑Based Feature Mount ─────────────
//
// Each feature declares its route prefixes (e.g. machines → ['/machines']).
// A path-scoped middleware checks the feature gate ONLY for matching paths.
//
// Auth is critical and always bypasses the gate.
// ──────────────────────────────────────────────

interface FeatureMount {
  /** Feature ID in the registry */
  featureId: string;
  /** The Express router exported by the service-runtime */
  router: Router;
  /** Route prefixes this router handles (e.g. ['/machines']) */
  prefixes: string[];
  /** Whether this is a critical feature (bypasses feature gate) */
  critical?: boolean;
}

const FEATURE_MOUNTS: FeatureMount[] = [
  { featureId: 'auth',      router: authRouter,      prefixes: ['/auth', '/users'], critical: true },
  { featureId: 'machines',  router: machinesRouter,  prefixes: ['/machines'] },
  { featureId: 'shifts',    router: shiftsRouter,    prefixes: ['/shifts'] },
  { featureId: 'planning',  router: planningRouter,  prefixes: ['/plans', '/production-logs'] },
  { featureId: 'downtime',  router: downtimeRouter,  prefixes: ['/downtime'] },
  { featureId: 'dashboard', router: dashboardRouter, prefixes: ['/dashboard'] },
  { featureId: 'reports',   router: reportsRouter,   prefixes: ['/reports'] },
];

/**
 * Path-scoped feature gate middleware.
 *
 * Only applies requireFeature() if the request path starts with one of
 * this feature's prefixes. Passes through for all other paths.
 * This prevents requireFeature('machines') from blocking /shifts or /admin.
 */
function scopedFeatureGate(featureId: string, prefixes: string[]) {
  const gate = requireFeature(featureId);
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const matches = prefixes.some((p) => req.path === p || req.path.startsWith(p + '/'));
    if (matches) {
      gate(req, res, next);
    } else {
      next();
    }
  };
}

/**
 * Mount all feature routers under versioned and unversioned prefixes.
 *
 * Strategy:
 *   1. Install scoped feature gates that check the path before blocking
 *   2. Mount actual routers afterward (auth always first)
 */
function mountVersionedRoutes(): void {
  const versions = ['v1']; // extend when v2 features exist

  // Step 1: Mount scoped feature gates for non-critical features
  for (const mount of FEATURE_MOUNTS) {
    if (mount.critical) continue;

    const gate = scopedFeatureGate(mount.featureId, mount.prefixes);
    for (const version of versions) {
      app.use(`/api/${version}`, gate);
    }
    app.use('/api', gate); // backward compat
  }

  // Step 2: Mount actual routers (gates already checked above)
  for (const mount of FEATURE_MOUNTS) {
    for (const version of versions) {
      app.use(`/api/${version}`, mount.router);
    }
    app.use('/api', mount.router); // backward compat
  }
}

mountVersionedRoutes();

// ─── Startup ─────────────────────────────────

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    await seedDefaultAdmin();
    await seedDefaultShifts();

    const features = featureRegistry.getAllFeatures();
    const enabledCount = features.filter((f) => f.api !== 'DISABLED').length;

    app.listen(PORT, () => {
      console.log(`\n🏭 FactoryOS API Gateway running on http://localhost:${PORT}`);
      console.log(`   Features:   ${enabledCount}/${features.length} enabled`);
      console.log(`   Versions:   v1`);
      console.log(`   ─────────────────────────────────────`);
      console.log(`   Health:     GET  /api/health`);
      console.log(`   Features:   GET  /api/features`);
      console.log(`   Auth:       POST /api/v1/auth/login`);
      console.log(`   Machines:   GET  /api/v1/machines`);
      console.log(`   Shifts:     GET  /api/v1/shifts`);
      console.log(`   Plans:      GET  /api/v1/plans`);
      console.log(`   Downtime:   GET  /api/v1/downtime`);
      console.log(`   Dashboard:  GET  /api/v1/dashboard`);
      console.log(`   Reports:    GET  /api/v1/reports/production`);
      console.log(`   Admin:      GET  /api/v1/admin/features`);
      console.log(`   ─────────────────────────────────────\n`);
    });
  } catch (err) {
    console.error('[FactoryOS] ❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
