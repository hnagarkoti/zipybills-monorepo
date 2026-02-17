/**
 * FactoryOS Observability
 *
 * Unified observability package providing:
 * - Health checks (Kubernetes-compatible liveness/readiness/startup probes)
 * - Prometheus-compatible metrics
 * - Structured JSON logging  
 * - Request tracking middleware
 */

export { healthRouter } from './health.js';
export type { HealthCheck, HealthReport, HealthStatus } from './health.js';

export { metricsRouter, metricsMiddleware, metrics, trackDbQuery } from './metrics.js';

export {
  StructuredLogger,
  createLogger,
  requestLogger,
} from './structured-logger.js';
export type { LogLevel, LogEntry } from './structured-logger.js';
