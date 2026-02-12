/**
 * FactoryOS Feature Registry
 *
 * Production-grade feature flag engine.
 *
 * Design:
 * ┌───────────────────────────────────────────────────────┐
 * │  Feature = "machines"                                 │
 * │  ├─ api:  ENABLED | DISABLED | DEPRECATED             │
 * │  ├─ ui:   ENABLED | DISABLED                          │
 * │  ├─ api_version:  "v1" | "v2" | ...                   │
 * │  └─ meta: description, owner, since, deprecated_at    │
 * └───────────────────────────────────────────────────────┘
 *
 * Three scopes of control:
 *   1. API  – 503 "Feature Disabled" when api=DISABLED
 *   2. UI   – Hidden from nav/rendering when ui=DISABLED
 *   3. FULL – Both api + ui disabled
 *
 * Config source priority (highest wins):
 *   Runtime override → Environment vars → JSON file → Defaults
 */

// ─── Types ───────────────────────────────────

export type FeatureState = 'ENABLED' | 'DISABLED' | 'DEPRECATED';

export interface FeatureDefinition {
  /** Unique feature key, e.g. "machines", "downtime" */
  id: string;
  /** Human-readable label */
  label: string;
  /** Feature description */
  description?: string;
  /** API state – DISABLED returns 503, DEPRECATED adds Sunset header */
  api: FeatureState;
  /** UI state – DISABLED hides from nav and renders nothing */
  ui: FeatureState;
  /** Current API version for this feature (default "v1") */
  apiVersion: string;
  /** Available API versions this feature supports */
  availableVersions: string[];
  /** ISO date when feature was deprecated (if api/ui = DEPRECATED) */
  deprecatedAt?: string;
  /** ISO date when feature will be removed */
  sunsetAt?: string;
  /** Team/person owning this feature */
  owner?: string;
  /** ISO date when feature was introduced */
  since?: string;
}

export interface FeatureOverride {
  api?: FeatureState;
  ui?: FeatureState;
  apiVersion?: string;
}

export interface FeatureRegistryConfig {
  features: Record<string, FeatureDefinition>;
}

// ─── Default Feature Definitions ─────────────

const FACTORY_FEATURES: FeatureDefinition[] = [
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Login, user management, RBAC',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'machines',
    label: 'Machine Management',
    description: 'Machine CRUD, status tracking',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'shifts',
    label: 'Shift Management',
    description: 'Shift scheduling and configuration',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'planning',
    label: 'Production Planning',
    description: 'Production plans, operator log input',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'downtime',
    label: 'Downtime Tracking',
    description: 'Machine downtime logging and resolution',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Real-time production overview',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    description: 'Production, machine-wise, shift-wise, rejection reports',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2025-01-01',
  },
  {
    id: 'theme',
    label: 'Theme Service',
    description: 'Multi-layer enterprise theming engine with composition, tenant isolation, role-based overrides',
    api: 'ENABLED',
    ui: 'ENABLED',
    apiVersion: 'v1',
    availableVersions: ['v1'],
    since: '2026-02-01',
  },
];

// ─── Feature Registry ────────────────────────

export class FeatureRegistry {
  private features: Map<string, FeatureDefinition>;
  private overrides: Map<string, FeatureOverride>;
  private listeners: Set<() => void>;
  /** Cached snapshot – rebuilt only on mutations so useSyncExternalStore gets a stable reference */
  private _snapshot: FeatureDefinition[];

  constructor(definitions?: FeatureDefinition[]) {
    this.features = new Map();
    this.overrides = new Map();
    this.listeners = new Set();
    this._snapshot = [];

    const defs = definitions ?? FACTORY_FEATURES;
    for (const def of defs) {
      this.features.set(def.id, { ...def });
    }

    this.applyEnvironmentOverrides();
    this._snapshot = this.buildSnapshot();
  }

  // ─── Query ───────────────────────────────

  /** Get resolved feature definition (with overrides applied) */
  getFeature(id: string): FeatureDefinition | undefined {
    const base = this.features.get(id);
    if (!base) return undefined;

    const override = this.overrides.get(id);
    if (!override) return base;

    return {
      ...base,
      api: override.api ?? base.api,
      ui: override.ui ?? base.ui,
      apiVersion: override.apiVersion ?? base.apiVersion,
    };
  }

  /** Is this feature's API enabled? (ENABLED or DEPRECATED both allow traffic) */
  isApiEnabled(id: string): boolean {
    const f = this.getFeature(id);
    return f ? f.api !== 'DISABLED' : false;
  }

  /** Is this feature's UI enabled? (ENABLED or DEPRECATED both allow rendering) */
  isUiEnabled(id: string): boolean {
    const f = this.getFeature(id);
    return f ? f.ui !== 'DISABLED' : false;
  }

  /** Is this feature fully enabled (both API and UI)? */
  isFullyEnabled(id: string): boolean {
    return this.isApiEnabled(id) && this.isUiEnabled(id);
  }

  /** Get the current API version for a feature */
  getApiVersion(id: string): string {
    return this.getFeature(id)?.apiVersion ?? 'v1';
  }

  /** Get all features as a serializable object */
  getAllFeatures(): FeatureDefinition[] {
    return Array.from(this.features.keys()).map(
      (id) => this.getFeature(id)!,
    );
  }

  /** Get a compact status map { featureId: { api, ui, apiVersion } } */
  getStatusMap(): Record<string, { api: FeatureState; ui: FeatureState; apiVersion: string }> {
    const map: Record<string, { api: FeatureState; ui: FeatureState; apiVersion: string }> = {};
    for (const id of this.features.keys()) {
      const f = this.getFeature(id)!;
      map[id] = { api: f.api, ui: f.ui, apiVersion: f.apiVersion };
    }
    return map;
  }

  // ─── Mutations ────────────────────────────

  /** Override a feature at runtime (survives until process restart) */
  setOverride(id: string, override: FeatureOverride): void {
    if (!this.features.has(id)) {
      throw new Error(`Unknown feature: ${id}`);
    }
    this.overrides.set(id, { ...this.overrides.get(id), ...override });
    this.notify();
  }

  /** Disable a feature completely (API + UI) */
  disableFeature(id: string): void {
    this.setOverride(id, { api: 'DISABLED', ui: 'DISABLED' });
  }

  /** Enable a feature completely (API + UI) */
  enableFeature(id: string): void {
    this.setOverride(id, { api: 'ENABLED', ui: 'ENABLED' });
  }

  /** Disable only the UI (API stays as-is) */
  disableUi(id: string): void {
    this.setOverride(id, { ui: 'DISABLED' });
  }

  /** Disable only the API (UI stays as-is) */
  disableApi(id: string): void {
    this.setOverride(id, { api: 'DISABLED' });
  }

  /** Mark a feature as deprecated */
  deprecateFeature(id: string, sunsetAt?: string): void {
    this.setOverride(id, { api: 'DEPRECATED', ui: 'DEPRECATED' });
    const f = this.features.get(id);
    if (f) {
      f.deprecatedAt = new Date().toISOString();
      if (sunsetAt) f.sunsetAt = sunsetAt;
    }
  }

  /** Load overrides from a JSON config object */
  loadConfig(config: FeatureRegistryConfig): void {
    for (const [id, def] of Object.entries(config.features)) {
      if (this.features.has(id)) {
        this.setOverride(id, { api: def.api, ui: def.ui, apiVersion: def.apiVersion });
      }
    }
  }

  /** Clear all runtime overrides */
  clearOverrides(): void {
    this.overrides.clear();
    this.notify();
  }

  // ─── Subscriptions (for React) ─────────────

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getSnapshot(): FeatureDefinition[] {
    return this._snapshot;
  }

  // ─── Internal ──────────────────────────────

  private buildSnapshot(): FeatureDefinition[] {
    return Array.from(this.features.keys()).map((id) => this.getFeature(id)!);
  }

  private notify(): void {
    this._snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      listener();
    }
  }

  private applyEnvironmentOverrides(): void {
    for (const id of this.features.keys()) {
      const envKey = `FEATURE_${id.toUpperCase()}`;

      const apiEnv = this.readEnv(`${envKey}_API`);
      const uiEnv = this.readEnv(`${envKey}_UI`);
      const versionEnv = this.readEnv(`${envKey}_VERSION`);

      if (apiEnv || uiEnv || versionEnv) {
        this.overrides.set(id, {
          ...(apiEnv ? { api: apiEnv as FeatureState } : {}),
          ...(uiEnv ? { ui: uiEnv as FeatureState } : {}),
          ...(versionEnv ? { apiVersion: versionEnv } : {}),
        });
      }
    }
  }

  private readEnv(key: string): string | undefined {
    try {
      return typeof process !== 'undefined' ? process.env[key] : undefined;
    } catch {
      return undefined;
    }
  }
}

// ─── Singleton ───────────────────────────────

export const featureRegistry = new FeatureRegistry();
