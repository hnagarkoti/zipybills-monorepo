/**
 * FactoryOS Theme Service
 *
 * Multi-Layer Enterprise Theming Engine
 *
 * Exports:
 *   - ThemeRegistry (class + singleton)
 *   - ThemeResolver (class)
 *   - Theme Composition utilities
 *   - Express Router for REST API
 *   - All type definitions
 *   - Default theme bundles
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

// Router (Express API)
export { themeRouter } from './router';

// Default Bundles
export {
  BASE_THEMES,
  ROLE_THEMES,
  ENVIRONMENT_THEMES,
  COMPLIANCE_THEMES,
  DEFAULT_TOKENS,
} from './defaults/index';
