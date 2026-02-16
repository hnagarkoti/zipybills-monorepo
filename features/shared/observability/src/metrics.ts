/**
 * FactoryOS Observability — Prometheus-Compatible Metrics
 *
 * Application metrics with Prometheus exposition format:
 * - HTTP request counters & latency histograms
 * - Database query metrics
 * - Business metrics (active users, tenants, machines)
 * - Custom counters & gauges
 * - Express middleware for automatic request tracking
 */

import { Router, type Request, type Response, type NextFunction } from 'express';

// ─── Metric Types ─────────────────────────────

interface CounterMetric {
  type: 'counter';
  name: string;
  help: string;
  labels: Record<string, number>;
}

interface GaugeMetric {
  type: 'gauge';
  name: string;
  help: string;
  value: number;
  labels?: Record<string, number>;
}

interface HistogramMetric {
  type: 'histogram';
  name: string;
  help: string;
  buckets: number[];
  observations: number[];
  sum: number;
  count: number;
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// ─── Metrics Registry ─────────────────────────

class MetricsRegistry {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();

  // ─── Counter ──────────────────────────────

  counter(name: string, help: string): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, { type: 'counter', name, help, labels: {} });
    }
  }

  increment(name: string, label: string = 'default', value: number = 1): void {
    const counter = this.counters.get(name);
    if (counter) {
      counter.labels[label] = (counter.labels[label] ?? 0) + value;
    }
  }

  // ─── Gauge ────────────────────────────────

  gauge(name: string, help: string, initialValue: number = 0): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, { type: 'gauge', name, help, value: initialValue });
    }
  }

  setGauge(name: string, value: number): void {
    const gauge = this.gauges.get(name);
    if (gauge) gauge.value = value;
  }

  incrementGauge(name: string, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (gauge) gauge.value += value;
  }

  decrementGauge(name: string, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (gauge) gauge.value -= value;
  }

  // ─── Histogram ────────────────────────────

  histogram(name: string, help: string, buckets: number[] = [5, 10, 25, 50, 100, 250, 500, 1000, 5000]): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        type: 'histogram',
        name,
        help,
        buckets: [...buckets].sort((a, b) => a - b),
        observations: new Array(buckets.length + 1).fill(0),
        sum: 0,
        count: 0,
      });
    }
  }

  observe(name: string, value: number): void {
    const hist = this.histograms.get(name);
    if (!hist) return;

    hist.sum += value;
    hist.count++;

    for (let i = 0; i < hist.buckets.length; i++) {
      if (value <= hist.buckets[i]!) {
        hist.observations[i]!++;
      }
    }
    // +Inf bucket
    hist.observations[hist.buckets.length]!++;
  }

  // ─── Prometheus Export ────────────────────

  toPrometheus(): string {
    const lines: string[] = [];

    // Counters
    for (const [, counter] of this.counters) {
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);
      for (const [label, value] of Object.entries(counter.labels)) {
        if (label === 'default') {
          lines.push(`${counter.name} ${value}`);
        } else {
          lines.push(`${counter.name}{label="${label}"} ${value}`);
        }
      }
    }

    // Gauges
    for (const [, gauge] of this.gauges) {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);
      lines.push(`${gauge.name} ${gauge.value}`);
    }

    // Histograms
    for (const [, hist] of this.histograms) {
      lines.push(`# HELP ${hist.name} ${hist.help}`);
      lines.push(`# TYPE ${hist.name} histogram`);
      let cumulative = 0;
      for (let i = 0; i < hist.buckets.length; i++) {
        cumulative += hist.observations[i]!;
        lines.push(`${hist.name}_bucket{le="${hist.buckets[i]}"} ${cumulative}`);
      }
      lines.push(`${hist.name}_bucket{le="+Inf"} ${hist.count}`);
      lines.push(`${hist.name}_sum ${hist.sum}`);
      lines.push(`${hist.name}_count ${hist.count}`);
    }

    return lines.join('\n') + '\n';
  }

  // ─── JSON Export ──────────────────────────

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, counter] of this.counters) {
      result[name] = { type: 'counter', labels: counter.labels };
    }
    for (const [name, gauge] of this.gauges) {
      result[name] = { type: 'gauge', value: gauge.value };
    }
    for (const [name, hist] of this.histograms) {
      result[name] = {
        type: 'histogram',
        count: hist.count,
        sum: hist.sum,
        avg: hist.count > 0 ? Math.round(hist.sum / hist.count) : 0,
      };
    }

    return result;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// ─── Global Registry ─────────────────────────

export const metrics = new MetricsRegistry();

// Register default metrics
metrics.counter('http_requests_total', 'Total HTTP requests');
metrics.histogram('http_request_duration_ms', 'HTTP request duration in milliseconds');
metrics.counter('http_errors_total', 'Total HTTP error responses');
metrics.gauge('http_active_connections', 'Active HTTP connections');
metrics.counter('db_queries_total', 'Total database queries');
metrics.histogram('db_query_duration_ms', 'Database query duration in milliseconds');
metrics.gauge('process_uptime_seconds', 'Process uptime in seconds');
metrics.gauge('process_memory_heap_bytes', 'Process heap memory usage');

// ─── Express Middleware ───────────────────────

/**
 * Middleware to automatically track HTTP request metrics.
 * Mount this early in your Express app:
 *   app.use(metricsMiddleware);
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  metrics.incrementGauge('http_active_connections');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const route = req.route?.path || req.path;
    const status = res.statusCode;
    const label = `${method} ${route} ${status}`;

    metrics.increment('http_requests_total', label);
    metrics.observe('http_request_duration_ms', duration);
    metrics.decrementGauge('http_active_connections');

    if (status >= 400) {
      metrics.increment('http_errors_total', `${status}`);
    }
  });

  next();
}

// ─── Metrics Router ───────────────────────────

export const metricsRouter = Router();

/** Prometheus exposition format */
metricsRouter.get('/metrics', (_req, res) => {
  // Update runtime gauges
  metrics.setGauge('process_uptime_seconds', Math.round(process.uptime()));
  metrics.setGauge('process_memory_heap_bytes', process.memoryUsage().heapUsed);

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics.toPrometheus());
});

/** JSON format (for internal dashboards) */
metricsRouter.get('/metrics/json', (_req, res) => {
  metrics.setGauge('process_uptime_seconds', Math.round(process.uptime()));
  metrics.setGauge('process_memory_heap_bytes', process.memoryUsage().heapUsed);

  res.json({
    success: true,
    metrics: metrics.toJSON(),
    timestamp: new Date().toISOString(),
  });
});

// ─── DB Query Tracking Helper ─────────────────

/**
 * Wrap a database query function to track metrics:
 *   const trackedQuery = trackDbQuery(originalQueryFn);
 */
export function trackDbQuery<T extends (...args: any[]) => Promise<any>>(queryFn: T): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await queryFn(...args);
      metrics.increment('db_queries_total', 'success');
      metrics.observe('db_query_duration_ms', Date.now() - start);
      return result;
    } catch (error) {
      metrics.increment('db_queries_total', 'error');
      metrics.observe('db_query_duration_ms', Date.now() - start);
      throw error;
    }
  }) as T;
}
