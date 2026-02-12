/**
 * Theme Registry
 *
 * Central registry for all theme definitions.
 * Manages theme storage, lookup, and lifecycle.
 *
 * SaaS mode: themes stored in PostgreSQL with tenant isolation.
 * On-Prem mode: themes loaded from local JSON bundles + DB overrides.
 *
 * The registry is the single source of truth for available themes.
 */
import type {
  ThemeDefinition, ThemeLayerId, TenantThemeConfig,
  ThemeEvent, ThemeEventType,
} from './types';
import { BASE_THEMES, ROLE_THEMES, ENVIRONMENT_THEMES, COMPLIANCE_THEMES } from './defaults/index';

type ThemeEventListener = (event: ThemeEvent) => void;

export class ThemeRegistry {
  /** All registered themes, keyed by ID */
  private themes = new Map<string, ThemeDefinition>();

  /** Tenant configurations, keyed by tenant ID */
  private tenantConfigs = new Map<string, TenantThemeConfig>();

  /** Event listeners */
  private listeners: ThemeEventListener[] = [];

  /** Whether system defaults have been loaded */
  private initialized = false;

  constructor() {
    this.loadSystemDefaults();
  }

  // ─── Initialization ────────────────────────────

  /**
   * Load all system-provided themes (base, role, environment, compliance).
   * Called once on construction. Safe to call again for re-initialization.
   */
  loadSystemDefaults(): void {
    const allDefaults = [
      ...BASE_THEMES,
      ...ROLE_THEMES,
      ...ENVIRONMENT_THEMES,
      ...COMPLIANCE_THEMES,
    ];

    for (const theme of allDefaults) {
      this.themes.set(theme.id, {
        ...theme,
        meta: { ...theme.meta, isSystem: true },
      });
    }

    this.initialized = true;
  }

  // ─── Theme CRUD ────────────────────────────────

  /**
   * Register a theme definition.
   * System themes cannot be overwritten by non-system themes.
   */
  register(theme: ThemeDefinition): void {
    const existing = this.themes.get(theme.id);
    if (existing?.meta?.isSystem && !theme.meta?.isSystem) {
      throw new Error(
        `Cannot overwrite system theme "${theme.id}". Use a different ID for custom themes.`,
      );
    }
    this.themes.set(theme.id, theme);
    this.emit({ type: 'theme:registered', themeId: theme.id, timestamp: new Date().toISOString() });
  }

  /**
   * Update a theme definition (merge into existing).
   */
  update(themeId: string, updates: Partial<ThemeDefinition>): void {
    const existing = this.themes.get(themeId);
    if (!existing) {
      throw new Error(`Theme "${themeId}" not found in registry.`);
    }
    if (existing.meta?.isSystem) {
      throw new Error(`Cannot modify system theme "${themeId}". Create a custom override instead.`);
    }
    this.themes.set(themeId, { ...existing, ...updates });
    this.emit({ type: 'theme:updated', themeId, timestamp: new Date().toISOString() });
  }

  /**
   * Remove a theme from the registry.
   * System themes cannot be removed.
   */
  remove(themeId: string): boolean {
    const existing = this.themes.get(themeId);
    if (existing?.meta?.isSystem) {
      throw new Error(`Cannot remove system theme "${themeId}".`);
    }
    const deleted = this.themes.delete(themeId);
    if (deleted) {
      this.emit({ type: 'theme:removed', themeId, timestamp: new Date().toISOString() });
    }
    return deleted;
  }

  // ─── Lookup ────────────────────────────────────

  /**
   * Get a theme by ID.
   */
  get(themeId: string): ThemeDefinition | undefined {
    return this.themes.get(themeId);
  }

  /**
   * Get all themes, optionally filtered by layer.
   */
  getAll(layer?: ThemeLayerId): ThemeDefinition[] {
    const all = Array.from(this.themes.values());
    if (layer) {
      return all.filter((t) => t.layer === layer);
    }
    return all;
  }

  /**
   * Get all system themes.
   */
  getSystemThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values()).filter((t) => t.meta?.isSystem);
  }

  /**
   * Get all custom (non-system) themes.
   */
  getCustomThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values()).filter((t) => !t.meta?.isSystem);
  }

  /**
   * Check if a theme exists.
   */
  has(themeId: string): boolean {
    return this.themes.has(themeId);
  }

  // ─── Tenant Configuration ──────────────────────

  /**
   * Set or update tenant theme configuration.
   */
  setTenantConfig(config: TenantThemeConfig): void {
    this.tenantConfigs.set(config.tenantId, {
      ...config,
      updatedAt: new Date().toISOString(),
    });
    this.emit({
      type: 'tenant:config-updated',
      tenantId: config.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get tenant theme configuration.
   */
  getTenantConfig(tenantId: string): TenantThemeConfig | undefined {
    return this.tenantConfigs.get(tenantId);
  }

  /**
   * Remove tenant configuration.
   */
  removeTenantConfig(tenantId: string): boolean {
    return this.tenantConfigs.delete(tenantId);
  }

  /**
   * Get all tenant configurations.
   */
  getAllTenantConfigs(): TenantThemeConfig[] {
    return Array.from(this.tenantConfigs.values());
  }

  // ─── Bulk Operations ───────────────────────────

  /**
   * Load themes from a JSON bundle (for on-prem offline support).
   */
  loadBundle(themes: ThemeDefinition[]): number {
    let count = 0;
    for (const theme of themes) {
      if (!this.themes.has(theme.id) || !this.themes.get(theme.id)?.meta?.isSystem) {
        this.themes.set(theme.id, theme);
        count++;
      }
    }
    return count;
  }

  /**
   * Export all non-system themes as a bundle (for backup/transfer).
   */
  exportBundle(): { themes: ThemeDefinition[]; tenants: TenantThemeConfig[] } {
    return {
      themes: this.getCustomThemes(),
      tenants: this.getAllTenantConfigs(),
    };
  }

  // ─── Statistics ────────────────────────────────

  getStats(): {
    total: number;
    system: number;
    custom: number;
    byLayer: Record<string, number>;
    tenants: number;
  } {
    const all = Array.from(this.themes.values());
    const byLayer: Record<string, number> = {};
    for (const t of all) {
      byLayer[t.layer] = (byLayer[t.layer] ?? 0) + 1;
    }
    return {
      total: all.length,
      system: all.filter((t) => t.meta?.isSystem).length,
      custom: all.filter((t) => !t.meta?.isSystem).length,
      byLayer,
      tenants: this.tenantConfigs.size,
    };
  }

  // ─── Event System ──────────────────────────────

  subscribe(listener: ThemeEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: ThemeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors to prevent cascade
      }
    }
  }
}

/** Singleton registry instance */
export const themeRegistry = new ThemeRegistry();
