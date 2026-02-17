/**
 * Theme Engine – React Hooks
 *
 * Typed hooks for consuming theme tokens in components.
 * These are the primary API for frontend developers.
 *
 * Usage:
 *   const { tokens, isDark } = useTheme();
 *   const colors = useThemeColors();
 *   const layout = useThemeLayout();
 *   const behavior = useThemeBehavior();
 */
import { useCallback, useMemo } from 'react';
import type {
  ThemeTokens, ThemeColors, ThemeTypography, ThemeLayout,
  ThemeBehavior, ThemeBranding, ThemeSpacing, ThemeRadius,
  ThemeShadows, BaseThemeId, EnvironmentThemeId, ComplianceThemeId,
  ThemeLayer, ResolvedTheme,
} from '@zipybills/factory-theme-service/core';
import { useThemeStore } from './theme-store';

// ─── Primary Hook ─────────────────────────────

/**
 * Main theme hook – access the resolved theme tokens and actions.
 */
export function useTheme() {
  const tokens = useThemeStore((s) => s.tokens);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const context = useThemeStore((s) => s.context);
  const isReady = useThemeStore((s) => s.isReady);
  const setBaseTheme = useThemeStore((s) => s.setBaseTheme);
  const setRole = useThemeStore((s) => s.setRole);
  const setEnvironment = useThemeStore((s) => s.setEnvironment);
  const setComplianceMode = useThemeStore((s) => s.setComplianceMode);
  const setUserPreferences = useThemeStore((s) => s.setUserPreferences);
  const updateContext = useThemeStore((s) => s.updateContext);
  const reset = useThemeStore((s) => s.reset);

  return {
    tokens,
    resolvedTheme,
    context,
    isReady,
    isDark: tokens.isDark,
    branding: tokens.branding,

    // Actions
    setBaseTheme,
    setRole,
    setEnvironment,
    setComplianceMode,
    setUserPreferences,
    updateContext,
    reset,

    // Convenience toggles
    toggleDarkMode: useCallback(() => {
      setBaseTheme(tokens.isDark ? 'light' : 'dark');
    }, [tokens.isDark, setBaseTheme]),
  };
}

// ─── Granular Token Hooks ─────────────────────
// These select specific slices of the token tree for better render performance.

/** Access only color tokens. */
export function useThemeColors(): ThemeColors {
  return useThemeStore((s) => s.tokens.colors);
}

/** Access only typography tokens. */
export function useThemeTypography(): ThemeTypography {
  return useThemeStore((s) => s.tokens.typography);
}

/** Access only spacing tokens. */
export function useThemeSpacing(): ThemeSpacing {
  return useThemeStore((s) => s.tokens.spacing);
}

/** Access only radius tokens. */
export function useThemeRadius(): ThemeRadius {
  return useThemeStore((s) => s.tokens.radius);
}

/** Access only shadow tokens. */
export function useThemeShadows(): ThemeShadows {
  return useThemeStore((s) => s.tokens.shadows);
}

/** Access only layout tokens. */
export function useThemeLayout(): ThemeLayout {
  return useThemeStore((s) => s.tokens.layout);
}

/** Access only behavior tokens. */
export function useThemeBehavior(): ThemeBehavior {
  return useThemeStore((s) => s.tokens.behavior);
}

/** Access only branding tokens. */
export function useThemeBranding(): ThemeBranding {
  return useThemeStore((s) => s.tokens.branding);
}

/** Access dark mode state. */
export function useIsDark(): boolean {
  return useThemeStore((s) => s.tokens.isDark);
}

// ─── Computed Hooks ───────────────────────────

/**
 * Get computed styles that respect the theme and are ready for React Native StyleSheet.
 * Returns platform-appropriate values.
 */
export function useThemeStyles() {
  const tokens = useThemeStore((s) => s.tokens);

  return useMemo(
    () => ({
      // Common container styles
      screenBackground: {
        backgroundColor: tokens.colors.surface?.background ?? tokens.colors.white,
        flex: 1,
      },
      cardStyle: {
        backgroundColor: tokens.colors.surface?.card ?? tokens.colors.white,
        borderRadius: tokens.layout.cardRadius ?? tokens.radius.lg,
        borderWidth: 1,
        borderColor: tokens.colors.surface?.border ?? tokens.colors.gray[200],
        ...tokens.shadows.sm,
      },
      textPrimary: {
        color: tokens.colors.surface?.foreground ?? tokens.colors.gray[900],
        fontSize: tokens.typography.fontSize.base * (tokens.typography.fontScale ?? 1),
      },
      textMuted: {
        color: tokens.colors.surface?.mutedForeground ?? tokens.colors.gray[500],
        fontSize: tokens.typography.fontSize.sm * (tokens.typography.fontScale ?? 1),
      },
      textHeading: {
        color: tokens.colors.surface?.foreground ?? tokens.colors.gray[900],
        fontSize: tokens.typography.fontSize.xl * (tokens.typography.fontScale ?? 1),
        fontWeight: tokens.typography.fontWeight.bold as any,
      },
      buttonPrimary: {
        backgroundColor: tokens.colors.brand?.primary ?? tokens.colors.primary[500],
        borderRadius: tokens.layout.buttonRadius ?? tokens.radius.md,
        paddingHorizontal: tokens.spacing[4],
        paddingVertical: tokens.spacing[3],
        minHeight: tokens.behavior.minTouchTarget,
      },
      buttonPrimaryText: {
        color: tokens.colors.brand?.primaryForeground ?? tokens.colors.white,
        fontWeight: tokens.typography.fontWeight.semibold as any,
        fontSize: tokens.typography.fontSize.sm * (tokens.typography.fontScale ?? 1),
      },
      divider: {
        height: 1,
        backgroundColor: tokens.colors.surface?.border ?? tokens.colors.gray[200],
      },
    }),
    [tokens],
  );
}

/**
 * Get the effective font size with user's font scale applied.
 */
export function useScaledFontSize(
  size: keyof ThemeTypography['fontSize'],
): number {
  const typography = useThemeTypography();
  return typography.fontSize[size] * (typography.fontScale ?? 1);
}

/**
 * Check if compliance watermark should be shown.
 */
export function useComplianceWatermark(): boolean {
  return useThemeBehavior().complianceWatermark;
}

/**
 * Check if animations should be enabled.
 */
export function useAnimationsEnabled(): boolean {
  const behavior = useThemeBehavior();
  return behavior.animationsEnabled && !behavior.reducedMotion;
}

/**
 * Get the applied layers for debugging/audit purposes.
 */
export function useAppliedLayers(): string[] {
  const resolved = useThemeStore((s) => s.resolvedTheme);
  return resolved?.appliedLayers ?? [];
}
