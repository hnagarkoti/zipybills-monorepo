/**
 * ThemeProvider – Root provider for the FactoryOS theming system
 *
 * Wraps the application to:
 *   1. Initialize theme resolution on mount
 *   2. Sync with auth store (role, tenant)
 *   3. Apply CSS variables on web for NativeWind/Tailwind
 *   4. Auto-detect system color scheme preference
 *   5. Provide compliance watermark overlay
 *
 * Usage:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 */
import React, { useEffect, useCallback, type PropsWithChildren } from 'react';
import { View, Text, Platform, useColorScheme } from 'react-native';
import type { BaseThemeId, EnvironmentThemeId } from '@zipybills/factory-theme-service/core';
import { useThemeStore } from './theme-store';
import { applyCSSVariables } from './css-vars';

interface ThemeProviderProps {
  /** Override the initial base theme (otherwise auto-detected from system) */
  initialBaseTheme?: BaseThemeId;
  /** Tenant ID (for SaaS multi-tenant deployments) */
  tenantId?: string;
  /** Environment context override */
  environment?: EnvironmentThemeId;
  /** Whether to auto-detect system dark mode preference */
  autoDetectColorScheme?: boolean;
  /** Whether to show compliance watermark when active */
  showComplianceWatermark?: boolean;
  /** Deployment mode override */
  deploymentMode?: 'saas' | 'on-prem';
}

export function ThemeProvider({
  children,
  initialBaseTheme,
  tenantId,
  environment,
  autoDetectColorScheme = true,
  showComplianceWatermark = true,
  deploymentMode = 'saas',
}: PropsWithChildren<ThemeProviderProps>) {
  const tokens = useThemeStore((s) => s.tokens);
  const context = useThemeStore((s) => s.context);
  const isReady = useThemeStore((s) => s.isReady);
  const updateContext = useThemeStore((s) => s.updateContext);
  const resolveTheme = useThemeStore((s) => s.resolveTheme);

  const systemColorScheme = useColorScheme();

  // ─── Initialize on mount ────────────────────
  useEffect(() => {
    const updates: Partial<typeof context> = { deploymentMode };

    // Set base theme: prop > stored > system preference > light
    if (initialBaseTheme) {
      updates.baseTheme = initialBaseTheme;
    } else if (!context.baseTheme || context.baseTheme === 'light') {
      if (autoDetectColorScheme && systemColorScheme === 'dark') {
        updates.baseTheme = 'dark';
      }
    }

    if (tenantId && tenantId !== context.tenantId) {
      updates.tenantId = tenantId;
    }

    if (environment && environment !== context.environment) {
      updates.environment = environment;
    }

    if (Object.keys(updates).length > 0) {
      updateContext(updates);
    } else if (!isReady) {
      resolveTheme();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync system color scheme changes ───────
  useEffect(() => {
    if (!autoDetectColorScheme) return;
    // Only auto-switch if user hasn't explicitly chosen high-contrast
    if (context.baseTheme === 'high-contrast') return;

    const preferred: BaseThemeId = systemColorScheme === 'dark' ? 'dark' : 'light';
    if (preferred !== context.baseTheme) {
      updateContext({ baseTheme: preferred });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemColorScheme, autoDetectColorScheme]);

  // ─── Apply CSS variables on web ─────────────
  useEffect(() => {
    if (Platform.OS === 'web' && isReady) {
      applyCSSVariables(tokens);
    }
  }, [tokens, isReady]);

  // ─── Compliance Watermark ───────────────────
  const shouldShowWatermark =
    showComplianceWatermark &&
    tokens.behavior.complianceWatermark &&
    isReady;

  return (
    <View style={{ flex: 1 }} className={tokens.isDark ? 'dark' : ''}>
      {children}
      {shouldShowWatermark && <ComplianceWatermark mode={context.complianceMode ?? 'standard'} />}
    </View>
  );
}

/**
 * Compliance Watermark Overlay
 * Shows a subtle diagonal watermark for audit/validation/traceability modes.
 */
function ComplianceWatermark({ mode }: { mode: string }) {
  const label = mode.replace(/-/g, ' ').toUpperCase();

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: 0.06,
        transform: [{ rotate: '-30deg' }],
      }}
    >
      <Text
        style={{
          fontSize: 72,
          fontWeight: '900',
          color: '#000000',
          letterSpacing: 8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
