/**
 * Theme Resolver Engine
 *
 * Takes a ThemeResolutionContext and resolves it to a fully composed theme.
 *
 * Resolution Algorithm:
 *   1. Resolve base theme ID from context.baseTheme
 *   2. Resolve tenant theme from context.tenantId (lookup tenant config)
 *   3. Resolve role theme from context.role
 *   4. Resolve environment theme from context.environment
 *   5. Resolve compliance theme from context.complianceMode
 *   6. Apply user preferences as the final overlay
 *   7. Feed all layers into the composition engine
 *   8. Generate cache key + metadata
 *
 * The resolver handles:
 *   - Missing layers (graceful skip)
 *   - Tenant-specific role overrides (tenant assigns custom theme per role)
 *   - Cache key generation for ETags
 *   - SaaS vs On-Prem deployment awareness
 */
import type {
  ThemeResolutionContext, ResolvedTheme, ThemeLayer,
  ThemeDefinition, TenantThemeConfig,
} from './types';
import { ThemeRegistry } from './registry';
import { composeTheme, generateCacheKey } from './composition';

export class ThemeResolver {
  constructor(private registry: ThemeRegistry) {}

  /**
   * Resolve a theme from the given context.
   *
   * This is the main entry point for theme resolution.
   */
  resolve(context: ThemeResolutionContext): ResolvedTheme {
    const layers: ThemeLayer[] = [];
    const appliedLayers: string[] = [];

    // ─── Layer 1: Base System Theme ───────────────
    const baseId = `base:${context.baseTheme}`;
    const baseTheme = this.registry.get(baseId);
    if (baseTheme) {
      layers.push(baseTheme.tokens);
      appliedLayers.push(baseId);
    }

    // ─── Layer 2: Tenant Branding ─────────────────
    let tenantConfig: TenantThemeConfig | undefined;
    if (context.tenantId) {
      tenantConfig = this.registry.getTenantConfig(context.tenantId);
      if (tenantConfig) {
        const tenantLayer: ThemeLayer = {};

        // Apply branding
        if (tenantConfig.branding) {
          tenantLayer.branding = tenantConfig.branding;
        }

        // Apply color overrides
        if (tenantConfig.colorOverrides) {
          tenantLayer.colors = tenantConfig.colorOverrides;
        }

        // Apply typography overrides
        if (tenantConfig.typographyOverrides) {
          tenantLayer.typography = tenantConfig.typographyOverrides;
        }

        if (Object.keys(tenantLayer).length > 0) {
          layers.push(tenantLayer);
          appliedLayers.push(`tenant:${context.tenantId}`);
        }
      }

      // Check for tenant-registered custom themes
      const tenantThemeId = `tenant:${context.tenantId}`;
      const tenantTheme = this.registry.get(tenantThemeId);
      if (tenantTheme) {
        layers.push(tenantTheme.tokens);
        appliedLayers.push(tenantThemeId);
      }
    }

    // ─── Layer 3: Role-Based Theme ────────────────
    if (context.role) {
      // Check tenant-specific role override first
      let roleThemeId: string | undefined;
      if (tenantConfig?.roleThemes?.[context.role]) {
        roleThemeId = tenantConfig.roleThemes[context.role];
      } else {
        roleThemeId = `role:${context.role}`;
      }

      if (roleThemeId) {
        const roleTheme = this.registry.get(roleThemeId);
        if (roleTheme) {
          layers.push(roleTheme.tokens);
          appliedLayers.push(roleThemeId);
        }
      }
    }

    // ─── Layer 4: Environment Theme ───────────────
    if (context.environment) {
      const envId = `env:${context.environment}`;
      const envTheme = this.registry.get(envId);
      if (envTheme) {
        layers.push(envTheme.tokens);
        appliedLayers.push(envId);
      }
    }

    // ─── Layer 5: Compliance Theme ────────────────
    if (context.complianceMode && context.complianceMode !== 'standard') {
      const compId = `compliance:${context.complianceMode}`;
      const compTheme = this.registry.get(compId);
      if (compTheme) {
        layers.push(compTheme.tokens);
        appliedLayers.push(compId);
      }
    }

    // ─── Layer 6: User Preferences ────────────────
    if (context.userPreferences && Object.keys(context.userPreferences).length > 0) {
      layers.push(context.userPreferences);
      appliedLayers.push('user:preferences');
    }

    // ─── Compose Final Theme ──────────────────────
    const tokens = composeTheme(layers);
    const cacheKey = generateCacheKey(appliedLayers);

    return {
      tokens,
      appliedLayers,
      resolvedAt: new Date().toISOString(),
      cacheKey,
      context,
    };
  }

  /**
   * Preview a theme without applying it.
   * Useful for admin theme editor previews.
   */
  preview(context: ThemeResolutionContext, additionalLayer?: ThemeLayer): ResolvedTheme {
    const resolved = this.resolve(context);
    if (additionalLayer) {
      const previewLayers: ThemeLayer[] = [resolved.tokens, additionalLayer];
      const previewTokens = composeTheme(previewLayers);
      return {
        ...resolved,
        tokens: previewTokens,
        appliedLayers: [...resolved.appliedLayers, 'preview'],
        cacheKey: generateCacheKey([...resolved.appliedLayers, 'preview']),
      };
    }
    return resolved;
  }

  /**
   * Get available themes for a given context.
   * Returns which themes the user can choose from based on their
   * tenant and role permissions.
   */
  getAvailableThemes(context: Pick<ThemeResolutionContext, 'tenantId' | 'role'>): {
    baseThemes: ThemeDefinition[];
    roleThemes: ThemeDefinition[];
    environmentThemes: ThemeDefinition[];
    complianceThemes: ThemeDefinition[];
  } {
    // Get tenant-allowed compliance modes
    let allowedComplianceModes: string[] | undefined;
    if (context.tenantId) {
      const tc = this.registry.getTenantConfig(context.tenantId);
      allowedComplianceModes = tc?.allowedComplianceModes;
    }

    const complianceThemes = this.registry.getAll('compliance');
    const filteredCompliance = allowedComplianceModes
      ? complianceThemes.filter(
          (t) => allowedComplianceModes!.includes(t.id.replace('compliance:', '')) || t.id === 'compliance:standard',
        )
      : complianceThemes;

    return {
      baseThemes: this.registry.getAll('base'),
      roleThemes: this.registry.getAll('role'),
      environmentThemes: this.registry.getAll('environment'),
      complianceThemes: filteredCompliance,
    };
  }
}
