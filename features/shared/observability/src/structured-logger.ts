/**
 * FactoryOS Observability — Structured Logger
 *
 * Production-grade structured logging:
 * - JSON output for log aggregation (ELK, Datadog, CloudWatch)
 * - Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Request correlation IDs
 * - Context propagation (tenant, user, request)
 * - Child loggers for scoped context
 * - Redaction of sensitive fields
 */

import { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';

// ─── Types ────────────────────────────────────

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  correlationId?: string;
  tenantId?: number;
  userId?: number;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

interface LoggerContext {
  service: string;
  correlationId?: string;
  tenantId?: number;
  userId?: number;
  requestId?: string;
  [key: string]: any;
}

// ─── Sensitive Field Redaction ─────────────────

const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie',
  'api_key', 'apiKey', 'access_token', 'refresh_token',
  'credit_card', 'ssn', 'encryption_key',
]);

function redact(obj: Record<string, any>, depth = 0): Record<string, any> {
  if (depth > 5) return obj; // Prevent infinite recursion
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redact(value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ─── Logger Class ─────────────────────────────

export class StructuredLogger {
  private context: LoggerContext;
  private minLevel: LogLevel;
  private output: (entry: LogEntry) => void;

  constructor(
    context: LoggerContext,
    options: { minLevel?: LogLevel; output?: (entry: LogEntry) => void } = {},
  ) {
    this.context = context;
    this.minLevel = options.minLevel ?? (process.env.LOG_LEVEL as LogLevel) ?? 'INFO';
    this.output = options.output ?? this.defaultOutput;
  }

  private defaultOutput(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    if (entry.level === 'ERROR' || entry.level === 'FATAL') {
      process.stderr.write(json + '\n');
    } else {
      process.stdout.write(json + '\n');
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level]! >= LOG_LEVELS[this.minLevel]!;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.context.service,
    };

    if (this.context.correlationId) entry.correlationId = this.context.correlationId;
    if (this.context.tenantId) entry.tenantId = this.context.tenantId;
    if (this.context.userId) entry.userId = this.context.userId;
    if (this.context.requestId) entry.requestId = this.context.requestId;

    if (metadata) {
      entry.metadata = redact(metadata);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      };
    }

    this.output(entry);
  }

  // ─── Log Methods ────────────────────────

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', message, metadata, error ?? undefined);
  }

  fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('FATAL', message, metadata, error ?? undefined);
  }

  // ─── Child Logger ───────────────────────

  /** Create a child logger with additional context */
  child(additionalContext: Partial<LoggerContext>): StructuredLogger {
    return new StructuredLogger(
      { ...this.context, ...additionalContext },
      { minLevel: this.minLevel, output: this.output },
    );
  }

  // ─── Timing Helper ─────────────────────

  /** Start a timer, returns a function to stop and log */
  startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${operation} completed`, { duration, operation });
    };
  }
}

// ─── Factory ──────────────────────────────────

export function createLogger(service: string, options?: { minLevel?: LogLevel }): StructuredLogger {
  return new StructuredLogger({ service }, options);
}

// ─── Express Middleware ───────────────────────

/**
 * Middleware that adds a correlation ID and request logger.
 * Attaches `req.log` for per-request structured logging.
 *
 * Usage:
 *   app.use(requestLogger('api-gateway'));
 *   // Then in routes:
 *   (req as any).log.info('Processing request', { someData: true });
 */
export function requestLogger(service: string) {
  const logger = createLogger(service);

  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID();
    const requestId = crypto.randomUUID();
    const start = Date.now();

    // Set correlation ID header for downstream services
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', requestId);

    // Attach request-scoped logger
    const requestLog = logger.child({
      correlationId,
      requestId,
      tenantId: (req as any).user?.tenant_id,
      userId: (req as any).user?.userId,
    });

    (req as any).log = requestLog;

    // Log request start
    requestLog.debug('Request started', {
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // Log request completion
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      requestLog[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
        `${req.method} ${req.path} ${res.statusCode}`,
        { method: req.method, path: req.path, statusCode: res.statusCode, duration },
      );
    });

    next();
  };
}
