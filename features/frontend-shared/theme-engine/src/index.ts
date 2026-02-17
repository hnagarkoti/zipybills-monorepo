/**
 * FactoryOS Theme Engine – Frontend Package
 *
 * Complete frontend runtime for the multi-layer enterprise theming system.
 *
 * Re-exports:
 *   - ThemeProvider (root component)
 *   - All React hooks (useTheme, useThemeColors, etc.)
 *   - Theme store (Zustand)
 *   - CSS variable utilities
 *   - All types from theme-service
 */

// Provider
export { ThemeProvider } from './ThemeProvider';

// Hooks
export {
  useTheme,
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
  useThemeRadius,
  useThemeShadows,
  useThemeLayout,
  useThemeBehavior,
  useThemeBranding,
  useIsDark,
  useThemeStyles,
  useScaledFontSize,
  useComplianceWatermark,
  useAnimationsEnabled,
  useAppliedLayers,
} from './hooks';

// Store
export { useThemeStore, type ThemeState } from './theme-store';

// CSS Variables (web)
export {
  tokensToCSSVariables,
  applyCSSVariables,
  generateCSSVariableStylesheet,
} from './css-vars';

// Compliance Engine
export {
  useComplianceMode,
  useComplianceGuard,
  useComplianceAuditMeta,
  useIsComplianceActive,
  useIsAuditMode,
  useIsValidationMode,
  useIsTraceabilityMode,
  type ComplianceModeInfo,
  type ComplianceGuard,
  type ComplianceAuditMeta,
} from './compliance';

// Color Tokens (imperative / icon colors)
export {
  colors,
  statusColors,
  machineStatusColors,
  downtimeCategoryColors,
  kpiColors,
  shiftColors,
  progressBarColor,
  useSemanticColor,
  useSemanticColors,
} from './color-tokens';

// Re-export all types from theme-service for convenience
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
} from '@zipybills/factory-theme-service/core';
