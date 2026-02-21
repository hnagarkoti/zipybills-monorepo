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

import https from 'https';
import http from 'http';
import express, { Router } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Schema & seed helpers
import { initializeDatabase } from './schema.js';
import { query as dbQuery } from '@zipybills/factory-database-config';
import { authRouter, seedDefaultAdmin } from '@zipybills/factory-auth-service-runtime';
import { machinesRouter } from '@zipybills/factory-machines-service-runtime';
import { shiftsRouter, seedDefaultShifts } from '@zipybills/factory-shifts-service-runtime';
import { planningRouter } from '@zipybills/factory-planning-service-runtime';
import { downtimeRouter } from '@zipybills/factory-downtime-service-runtime';
import { dashboardRouter } from '@zipybills/factory-dashboard-service-runtime';
import { reportsRouter } from '@zipybills/factory-reports-service-runtime';
import { themeRouter } from '@zipybills/factory-theme-service';

// Phase 2 services
import { initializeLicenseSchema } from '@zipybills/factory-license-system';
import { licenseRouter } from '@zipybills/factory-license-system/router';
import { initializePermissionsSchema } from '@zipybills/factory-permissions';
import { permissionsRouter } from '@zipybills/factory-permissions/router';
import { auditRouter } from '@zipybills/factory-audit-service';
import { backupRouter, initBackupSchema } from '@zipybills/factory-backup-system';
import { adminRouter } from '@zipybills/factory-admin-panel';
import { exportRouter } from '@zipybills/factory-export-reports';

// Phase 3 services (SaaS Conversion)
import { initializeMultiTenancySchema } from '@zipybills/factory-multi-tenancy';
import { tenantRouter } from '@zipybills/factory-multi-tenancy/router';
import { initializeSubscriptionSchema } from '@zipybills/factory-subscription-billing';
import { billingRouter } from '@zipybills/factory-subscription-billing/router';
import { cloudAuthRouter } from '@zipybills/factory-cloud-auth/router';
import { seedPlatformAdmin } from '@zipybills/factory-cloud-auth';
import { saasDashboardRouter } from '@zipybills/factory-saas-dashboard/router';

// Phase 4 services (Enterprise Enhancements)
import { superAdminRouter, initializeSuperAdminSchema } from '@zipybills/factory-admin-panel/enterprise';
import { offlineSyncRouter, initializeOfflineSyncSchema } from '@zipybills/factory-offline-sync';
import { healthRouter, metricsRouter, metricsMiddleware } from '@zipybills/factory-observability';
import { initializeEnterpriseBackupSchema } from '@zipybills/factory-backup-system/enterprise';
import { tenantBackupRouter, initTenantBackupSchema } from '@zipybills/factory-backup-system/tenant';

// Multi-tenancy middleware (tenant isolation for SaaS mode)
import { requireTenant, requirePlanFeature, enforceFreePlanReadOnly } from '@zipybills/factory-multi-tenancy/middleware';

// Compliance enforcement
import { complianceRouter, enforceCompliance } from './compliance.js';

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
const SAAS_MODE = process.env.SAAS_MODE === 'true';

// Trust the first hop from Render / any reverse proxy so that:
//  - req.ip returns the real client IP (not the proxy IP)
//  - express-rate-limit reads X-Forwarded-For correctly
//  - secure cookies work over HTTPS behind the proxy
app.set('trust proxy', 1);

// CORS configuration - allow production domains
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://factoryos.zipybills.com',
    'https://app.factoryos.zipybills.com',
    'https://zipybills-monorepo-marketing-site.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-compliance-reason'],
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── J2: Rate Limiting ───────────────────────

// Global API rate limit: 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
  keyGenerator: (req) => {
    // Use tenant_id from JWT if available for per-tenant limiting, else use IP
    const tenantId = (req as any).user?.tenant_id;
    return tenantId ? `tenant:${tenantId}` : req.ip || 'unknown';
  },
  validate: { xForwardedForHeader: false, ip: false, default: false },
});

// Strict rate limit on auth routes: 10 attempts per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.', code: 'AUTH_RATE_LIMITED' },
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false, ip: false, default: false },
});

// J4: Slug enumeration protection: 5 attempts per minute
const enumLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.', code: 'ENUM_RATE_LIMITED' },
  validate: { xForwardedForHeader: false, ip: false, default: false },
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/v1/saas/login', authLimiter);
app.use('/api/v1/saas/signup', enumLimiter);
app.use('/api/saas/signup', enumLimiter);

// ─── Observability Middleware ─────────────────

app.use(metricsMiddleware);

// ─── Global API‑Version Middleware ───────────

app.use('/api', apiVersionMiddleware());

// ─── Health Check (unversioned, always available) ──

app.use('/api', healthRouter);       // /api/health, /api/health/live, /api/health/ready
app.use('/api', metricsRouter);      // /api/metrics, /api/metrics/json

// ─── Dev: Database Reset (protected by platform admin creds) ──

app.post('/api/v1/dev/reset-db', async (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin';
  const adminPass = process.env.PLATFORM_ADMIN_PASSWORD || 'admin123!';

  if (!username || !password || username !== adminUser || password !== adminPass) {
    res.status(401).json({ success: false, error: 'Invalid credentials. Provide platform admin username & password.' });
    return;
  }

  try {
    console.log('[FactoryOS] ⚠️  Database reset requested by platform admin...');

    // Drop all tables by resetting the public schema
    await dbQuery('DROP SCHEMA public CASCADE');
    await dbQuery('CREATE SCHEMA public');
    await dbQuery('GRANT ALL ON SCHEMA public TO PUBLIC');

    // Re-initialize all schemas (order matters — base tables first)
    await initializeDatabase();
    await initializeLicenseSchema();
    await initializePermissionsSchema();
    await initBackupSchema();
    await initializeMultiTenancySchema();
    await initializeSubscriptionSchema();
    await initializeSuperAdminSchema();
    await initializeOfflineSyncSchema();
    await initializeEnterpriseBackupSchema();
    await initTenantBackupSchema();

    // Re-seed
    if (SAAS_MODE) {
      await seedPlatformAdmin();
    } else {
      await seedDefaultAdmin();
      await seedDefaultShifts();
    }

    console.log('[FactoryOS] ✅ Database reset complete — all schemas re-initialized and seeded.');
    res.json({ success: true, message: 'Database wiped and re-initialized successfully.' });
  } catch (err: any) {
    console.error('[FactoryOS] ❌ Database reset failed:', err);
    res.status(500).json({ success: false, error: 'Database reset failed.', details: err.message });
  }
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
//
// Query-param token support: For browser-initiated downloads (window.open),
// JWT can't be sent via headers. Allow ?token= on download endpoints and
// promote it to the Authorization header before requireAuth runs.
// ──────────────────────────────────────────────

app.use('/api', (req, _res, next) => {
  const queryToken = req.query.token as string | undefined;
  if (queryToken && !req.headers.authorization && req.path.includes('/download')) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
});

// Paths that must bypass requireAuth (OAuth callbacks from external providers)
const AUTH_BYPASS_PATHS = ['/gdrive/callback'];

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
  { featureId: 'theme',     router: themeRouter,     prefixes: ['/theme'] },

  // Phase 2 features
  { featureId: 'license',    router: licenseRouter,    prefixes: ['/license'], critical: true },
  { featureId: 'permissions', router: permissionsRouter, prefixes: ['/permissions'] },
  { featureId: 'audit',      router: auditRouter,      prefixes: ['/audit'] },
  { featureId: 'backups',    router: backupRouter,     prefixes: ['/backups'] },
  { featureId: 'admin',      router: adminRouter,      prefixes: ['/admin'], critical: true },
  { featureId: 'export',     router: exportRouter,     prefixes: ['/export'] },

  // Phase 3 features (SaaS Conversion)
  { featureId: 'tenants',       router: tenantRouter,        prefixes: ['/tenants', '/tenant'], critical: true },
  { featureId: 'billing',       router: billingRouter,       prefixes: ['/billing'] },
  { featureId: 'cloud-auth',    router: cloudAuthRouter,     prefixes: ['/saas'], critical: true },
  { featureId: 'saas-dashboard', router: saasDashboardRouter, prefixes: ['/saas-dashboard'] },

  // Phase 4 features (Enterprise Enhancements)
  // I3: super-admin only available in SaaS mode (guarded in mountVersionedRoutes)
  { featureId: 'super-admin',   router: superAdminRouter,    prefixes: ['/super-admin'], critical: true },
  { featureId: 'offline-sync',  router: offlineSyncRouter,   prefixes: ['/sync'] },

  // Tenant backup & export (available to all tenants, some features plan-gated internally)
  { featureId: 'tenant-backup', router: tenantBackupRouter,  prefixes: ['/tenant-backups'], critical: true },

  // Compliance settings API
  { featureId: 'compliance',    router: complianceRouter,    prefixes: ['/compliance'], critical: true },
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
 * Feature IDs whose routes require tenant isolation in SaaS mode.
 * Critical/platform-level features (auth, license, tenants, cloud-auth,
 * super-admin, admin) are excluded — they handle tenant context internally
 * or operate cross-tenant.
 */
const TENANT_SCOPED_FEATURES = new Set([
  'machines', 'shifts', 'planning', 'downtime', 'dashboard',
  'reports', 'theme', 'permissions', 'audit', 'backups',
  'export', 'billing', 'offline-sync', 'tenant-backup',
]);

/**
 * Mount all feature routers under versioned and unversioned prefixes.
 *
 * Strategy:
 *   1. Install scoped feature gates that check the path before blocking
 *   2. For tenant-scoped features, apply requireTenant middleware
 *   2.5. Apply plan feature gating for plan-restricted features
 *   3. Mount actual routers afterward (auth always first)
 *
 * I3: Super-admin and SaaS-only features are skipped in on-prem mode.
 */

// Features that are only available in SaaS mode
const SAAS_ONLY_FEATURES = new Set([
  'super-admin', 'billing', 'cloud-auth', 'saas-dashboard', 'tenants',
]);

function mountVersionedRoutes(): void {
  const versions = ['v1']; // extend when v2 features exist

  // I3: Filter out SaaS-only features in on-prem mode
  const activeMounts = FEATURE_MOUNTS.filter((mount) => {
    if (!SAAS_MODE && SAAS_ONLY_FEATURES.has(mount.featureId)) {
      console.log(`[Gateway] Skipping SaaS-only feature in on-prem mode: ${mount.featureId}`);
      return false;
    }
    return true;
  });

  // Step 1: Mount scoped feature gates for non-critical features
  for (const mount of activeMounts) {
    if (mount.critical) continue;

    const gate = scopedFeatureGate(mount.featureId, mount.prefixes);
    for (const version of versions) {
      app.use(`/api/${version}`, gate);
    }
    app.use('/api', gate); // backward compat
  }

  // Step 2: Mount auth + tenant isolation middleware for business features
  // requireAuth populates req.user from JWT, requireTenant resolves tenant from it
  for (const mount of activeMounts) {
    if (!TENANT_SCOPED_FEATURES.has(mount.featureId)) continue;

    for (const prefix of mount.prefixes) {
      for (const version of versions) {
        app.use(`/api/${version}${prefix}`, (req, res, next) => {
          // Skip auth for OAuth callback paths (e.g. Google Drive redirect)
          if (AUTH_BYPASS_PATHS.some((p) => req.path.includes(p))) return next();
          requireAuth(req, res, next);
        }, (req, res, next) => {
          if (AUTH_BYPASS_PATHS.some((p) => req.path.includes(p))) return next();
          requireTenant(req, res, next);
        });
      }
      app.use(`/api${prefix}`, (req, res, next) => {
        if (AUTH_BYPASS_PATHS.some((p) => req.path.includes(p))) return next();
        requireAuth(req, res, next);
      }, (req, res, next) => {
        if (AUTH_BYPASS_PATHS.some((p) => req.path.includes(p))) return next();
        requireTenant(req, res, next);
      }); // backward compat
    }
  }

  // Step 2.3: Enforce read-only mode for FREE-plan tenants on data routes
  // After trial expiry → downgrade to FREE, users can VIEW but not CREATE/EDIT/DELETE
  if (SAAS_MODE) {
    for (const version of versions) {
      app.use(`/api/${version}`, enforceFreePlanReadOnly);
    }
    app.use('/api', enforceFreePlanReadOnly);
  }

  // Step 2.5: D4 — Plan feature gating for plan-restricted features
  // Only features NOT included in every plan need gating
  const PLAN_GATED_FEATURES = new Set([
    'downtime', 'reports', 'export', 'audit', 'theme',
    'backups', 'admin', 'permissions',
  ]);

  for (const mount of activeMounts) {
    if (!PLAN_GATED_FEATURES.has(mount.featureId)) continue;

    const gate = requirePlanFeature(mount.featureId);
    for (const prefix of mount.prefixes) {
      for (const version of versions) {
        app.use(`/api/${version}${prefix}`, gate);
      }
      app.use(`/api${prefix}`, gate); // backward compat
    }
  }

  // Step 2.7: Compliance enforcement — blocks mutations based on tenant compliance settings
  for (const version of versions) {
    app.use(`/api/${version}`, enforceCompliance);
  }
  app.use('/api', enforceCompliance);

  // Step 3: Mount actual routers (gates already checked above)
  for (const mount of activeMounts) {
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
    // Phase 2 schemas
    await initializeLicenseSchema();
    await initializePermissionsSchema();
    await initBackupSchema();

    // Phase 3 schemas (SaaS)
    await initializeMultiTenancySchema();
    await initializeSubscriptionSchema();

    // Phase 4 schemas (Enterprise)
    await initializeSuperAdminSchema();
    await initializeOfflineSyncSchema();
    await initializeEnterpriseBackupSchema();
    await initTenantBackupSchema();

    if (SAAS_MODE) {
      // SaaS: seed platform admin which creates its own tenant + admin user
      await seedPlatformAdmin();
    } else {
      // On-prem: seed default admin into the default tenant
      await seedDefaultAdmin();
      await seedDefaultShifts();
    }

    // I4: Validate license on startup for on-prem mode
    if (!SAAS_MODE) {
      try {
        const { validateLicense } = await import('@zipybills/factory-license-system');
        const licenseResult = await validateLicense();
        if (!licenseResult.valid) {
          console.warn(`[FactoryOS] ⚠️  License validation failed: ${licenseResult.warnings?.[0] || 'No valid license'}`);
          console.warn(`[FactoryOS] ⚠️  Running in degraded mode. Some features may be restricted.`);
        } else {
          console.log(`[FactoryOS] ✅ License valid (${licenseResult.tier}) — ${licenseResult.daysRemaining ?? '∞'} days remaining`);
        }
      } catch {
        console.warn(`[FactoryOS] ⚠️  License system not available — running without license validation`);
      }
    }

    const features = featureRegistry.getAllFeatures();
    const enabledCount = features.filter((f) => f.api !== 'DISABLED').length;

    const HOST = '0.0.0.0'; // Bind to all interfaces for cloud deployment
    app.listen(PORT, HOST, () => {
      // ── Keep-alive ping (prevents Render free tier from spinning down) ──
      // Render sets RENDER_EXTERNAL_URL automatically; falls back to localhost in dev.
      const selfUrl = process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
        : `http://localhost:${PORT}/api/health`;
      const pingInterval = 12 * 60 * 1000; // 12 minutes
      setInterval(() => {
        const client = selfUrl.startsWith('https') ? https : http;
        client
          .get(selfUrl, (res) => {
            console.log(`[KeepAlive] 🏓 Self-ping → ${selfUrl} (${res.statusCode})`);
            res.resume(); // consume response to free socket
          })
          .on('error', (err) => {
            console.warn(`[KeepAlive] ⚠️  Self-ping failed: ${err.message}`);
          });
      }, pingInterval);
      console.log(`[KeepAlive] ✅ Self-ping enabled every 12 min → ${selfUrl}`);
      console.log(`\n🏭 FactoryOS API Gateway running on http://${HOST}:${PORT}`);
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
      console.log(`   Theme:      POST /api/v1/theme/resolve`);
      console.log(`   Admin:      GET  /api/v1/admin/features`);
      console.log(`   ─── Phase 2 ────────────────────────`);
      console.log(`   License:    GET  /api/v1/license/status`);
      console.log(`   Perms:      GET  /api/v1/permissions/me`);
      console.log(`   Audit:      GET  /api/v1/audit/logs`);
      console.log(`   Backups:    GET  /api/v1/backups`);
      console.log(`   Admin:      GET  /api/v1/admin/dashboard`);
      console.log(`   Export:     GET  /api/v1/export/production`);
      console.log(`   ─── Phase 3 (SaaS) ────────────────`);
      console.log(`   Tenants:    GET  /api/v1/tenants`);
      console.log(`   Billing:    GET  /api/v1/billing/plans`);
      console.log(`   SaaS Auth:  POST /api/v1/saas/login`);
      console.log(`   Signup:     POST /api/v1/saas/signup`);
      console.log(`   SaaS Dash:  GET  /api/v1/saas-dashboard/overview`);
      console.log(`   ─── Phase 4 (Enterprise) ──────────`);
      console.log(`   SuperAdmin: GET  /api/v1/super-admin/dashboard`);
      console.log(`   Sync:       POST /api/v1/sync/push`);
      console.log(`   Health:     GET  /api/health`);
      console.log(`   Metrics:    GET  /api/metrics`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`   ─── Dev Tools ─────────────────────`);
        console.log(`   Reset DB:   POST /api/v1/dev/reset-db`);
      }
      console.log(`   ─────────────────────────────────────\n`);
    });
  } catch (err) {
    console.error('[FactoryOS] ❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
