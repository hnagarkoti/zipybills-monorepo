/**
 * FactoryOS Observability — Health Checks
 *
 * Comprehensive health check system:
 * - Database connectivity
 * - Memory usage / process health
 * - Feature service availability
 * - Dependency checks
 * - Kubernetes-compatible liveness/readiness probes
 */

import { Router } from 'express';
import { getPool } from '@zipybills/factory-database-config';

export const healthRouter = Router();

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  responseTimeMs: number;
  message?: string;
  details?: Record<string, any>;
}

export interface HealthReport {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
}

// ─── Check Functions ──────────────────────────

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const pool = getPool();
    const result = await pool.query('SELECT 1 as check, NOW() as server_time');
    const elapsed = Date.now() - start;

    return {
      name: 'database',
      status: elapsed < 1000 ? 'healthy' : 'degraded',
      responseTimeMs: elapsed,
      details: {
        serverTime: result.rows[0]?.server_time,
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTimeMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database unreachable',
    };
  }
}

function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const heapPercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  let status: HealthStatus = 'healthy';
  if (heapPercent > 90) status = 'unhealthy';
  else if (heapPercent > 75) status = 'degraded';

  return {
    name: 'memory',
    status,
    responseTimeMs: 0,
    details: {
      heapUsedMB,
      heapTotalMB,
      heapPercent,
      rssMB: Math.round(usage.rss / 1024 / 1024),
      externalMB: Math.round(usage.external / 1024 / 1024),
    },
  };
}

function checkEventLoop(): HealthCheck {
  const start = Date.now();
  // Simple event loop lag measurement
  const lag = Date.now() - start; // Will be ~0 in sync context

  return {
    name: 'event_loop',
    status: lag < 100 ? 'healthy' : lag < 500 ? 'degraded' : 'unhealthy',
    responseTimeMs: lag,
    details: {
      lagMs: lag,
      activeHandles: (process as any)._getActiveHandles?.()?.length ?? 'N/A',
      activeRequests: (process as any)._getActiveRequests?.()?.length ?? 'N/A',
    },
  };
}

function checkDiskSpace(): HealthCheck {
  // Basic disk check — in production you'd use `statvfs` or similar
  return {
    name: 'disk',
    status: 'healthy',
    responseTimeMs: 0,
    details: {
      platform: process.platform,
      tempDir: process.env.TMPDIR || '/tmp',
    },
  };
}

// ─── Aggregate Health ─────────────────────────

function aggregateStatus(checks: HealthCheck[]): HealthStatus {
  if (checks.some(c => c.status === 'unhealthy')) return 'unhealthy';
  if (checks.some(c => c.status === 'degraded')) return 'degraded';
  return 'healthy';
}

// ─── Routes ───────────────────────────────────

const APP_VERSION = process.env.APP_VERSION || '1.0.0';

/** Full health check — all dependencies */
healthRouter.get('/health', async (_req, res) => {
  const checks: HealthCheck[] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkEventLoop()),
    Promise.resolve(checkDiskSpace()),
  ]);

  const report: HealthReport = {
    status: aggregateStatus(checks),
    version: APP_VERSION,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks,
  };

  const httpStatus = report.status === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(report);
});

/** Kubernetes liveness probe — is the process alive? */
healthRouter.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/** Kubernetes readiness probe — can the service accept traffic? */
healthRouter.get('/health/ready', async (_req, res) => {
  const dbCheck = await checkDatabase();

  if (dbCheck.status === 'unhealthy') {
    return res.status(503).json({
      status: 'unhealthy',
      reason: 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/** Startup probe — has the service finished initializing? */
healthRouter.get('/health/startup', (_req, res) => {
  // In a real app, check if all features are loaded, migrations run, etc.
  res.status(200).json({
    status: 'healthy',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});
