/**
 * FactoryOS Theme Service – Core (Browser-safe)
 *
 * This entry point exports everything EXCEPT the Express router.
 * Use this from frontend packages (theme-engine, etc.) to avoid
 * pulling Node.js-only dependencies (express, send, util) into
 * the Metro / web bundle.
 *
 * Backend code (api-gateway) should import from the main index
 * which includes the router.
 */

// Types (re-export everything)
export type {
  ThemeLayerId,
  BaseThemeId,
  RoleThemeId,
  EnvironmentThemeId,
  ComplianceThemeId,
  ColorScale,
  SemanticColor,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
  ThemeShadows,
  ThemeLayout,
  ThemeBehavior,
  ThemeBranding,
  ThemeTokens,
  ThemeLayer,
  ThemeDefinition,
  ThemeResolutionContext,
  ResolvedTheme,
  TenantThemeConfig,
  ThemeEventType,
  ThemeEvent,
  DeepPartial,
} from './types';

export { THEME_LAYER_ORDER } from './types';

// Registry
export { ThemeRegistry, themeRegistry } from './registry';

// Resolver
export { ThemeResolver } from './resolver';

// Composition Engine
export { composeTheme, deepMerge, generateCacheKey } from './composition';

// Default Bundles
export {
  BASE_THEMES,
  ROLE_THEMES,
  ENVIRONMENT_THEMES,
  COMPLIANCE_THEMES,
  DEFAULT_TOKENS,
} from './defaults/index';
