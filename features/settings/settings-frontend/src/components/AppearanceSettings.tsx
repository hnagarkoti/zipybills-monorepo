/**
 * AppearanceSettings – Theme selection UI
 *
 * Allows users to pick Light / Dark / System / Default (tenant).
 * Respects tenant policy: if overrides are disabled, the selector is locked.
 *
 * Resolution order reminder:
 *   User preference → Role policy → Tenant/Factory default → System default
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, Switch, Platform } from 'react-native';
import {
  Sun, Moon, Monitor, Palette, SlidersHorizontal, ZoomIn, ZoomOut,
} from 'lucide-react-native';
import {
  useTheme,
  useThemeColors,
  useThemeTypography,
  useThemeBehavior,
  useThemeBranding,
  useIsDark,
  useAppliedLayers,
  type BaseThemeId,
} from '@zipybills/theme-engine';

// ─── Types ────────────────────────────────────

interface ThemeOption {
  id: 'default' | 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Maps to BaseThemeId (null = use system/tenant default) */
  baseTheme: BaseThemeId | null;
}

interface AppearanceSettingsProps {
  /** Whether the tenant allows user theme overrides */
  allowUserOverride?: boolean;
  /** Tenant default theme label (shown when override is disabled) */
  tenantDefaultLabel?: string;
}

// ─── Constants ────────────────────────────────

const ICON_SIZE = 20;
const ICON_COLOR_ACTIVE = '#FFFFFF';
const ICON_COLOR_INACTIVE = '#6B7280';

// ─── Component ────────────────────────────────

export function AppearanceSettings({
  allowUserOverride = true,
  tenantDefaultLabel = 'Tenant Default',
}: AppearanceSettingsProps) {
  const {
    tokens, context, setBaseTheme, setUserPreferences, isDark,
  } = useTheme();
  const colors = useThemeColors();
  const typography = useThemeTypography();
  const behavior = useThemeBehavior();
  const branding = useThemeBranding();
  const appliedLayers = useAppliedLayers();

  // Current selection — derive from context
  const currentSelection = useMemo<ThemeOption['id']>(() => {
    if (!context.baseTheme) return 'default';
    if (context.baseTheme === 'light') return 'light';
    if (context.baseTheme === 'dark') return 'dark';
    return 'default';
  }, [context.baseTheme]);

  const themeOptions: ThemeOption[] = useMemo(() => [
    {
      id: 'default',
      label: tenantDefaultLabel,
      description: 'Use the theme set by your organization',
      icon: <Palette size={ICON_SIZE} />,
      baseTheme: null,
    },
    {
      id: 'light',
      label: 'Light',
      description: 'Standard light appearance',
      icon: <Sun size={ICON_SIZE} />,
      baseTheme: 'light',
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Reduced eye strain in low-light',
      icon: <Moon size={ICON_SIZE} />,
      baseTheme: 'dark',
    },
    {
      id: 'system',
      label: 'System',
      description: 'Follows your device setting',
      icon: <Monitor size={ICON_SIZE} />,
      baseTheme: null, // ThemeProvider auto-detects
    },
  ], [tenantDefaultLabel]);

  const handleSelect = useCallback((option: ThemeOption) => {
    if (!allowUserOverride) return;

    if (option.id === 'system' || option.id === 'default') {
      // Reset to auto-detect / tenant default
      setBaseTheme('light'); // Will be overridden by auto-detect in ThemeProvider
    } else if (option.baseTheme) {
      setBaseTheme(option.baseTheme);
    }
  }, [allowUserOverride, setBaseTheme]);

  // ─── Font Scale ─────────────────────────────
  const fontScale = typography.fontScale ?? 1;

  const adjustFontScale = useCallback((delta: number) => {
    const newScale = Math.max(0.8, Math.min(1.5, fontScale + delta));
    setUserPreferences({
      typography: { fontScale: Math.round(newScale * 100) / 100 },
    });
  }, [fontScale, setUserPreferences]);

  // ─── High Contrast Toggle ──────────────────
  const toggleHighContrast = useCallback(() => {
    if (behavior.highContrast) {
      setBaseTheme('light');
    } else {
      setBaseTheme('high-contrast' as BaseThemeId);
    }
  }, [behavior.highContrast, setBaseTheme]);

  // ─── Reduced Motion Toggle ─────────────────
  const toggleReducedMotion = useCallback(() => {
    setUserPreferences({
      behavior: { reducedMotion: !behavior.reducedMotion },
    });
  }, [behavior.reducedMotion, setUserPreferences]);

  return (
    <View className="flex-1">
      {/* ─── Section: Theme ─────────────────────── */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Appearance
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose how FactoryOS looks. {!allowUserOverride && 'Theme selection is locked by your organization.'}
      </Text>

      {/* Theme Picker Grid */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {themeOptions.map((option) => {
          const isActive = option.id === currentSelection;
          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option)}
              disabled={!allowUserOverride}
              className={`
                flex-1 min-w-[140px] p-4 rounded-xl border-2
                ${isActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
                ${!allowUserOverride ? 'opacity-50' : ''}
              `}
            >
              {/* Icon */}
              <View
                className={`
                  w-10 h-10 rounded-lg items-center justify-center mb-3
                  ${isActive ? 'bg-primary-500' : 'bg-gray-100 dark:bg-gray-700'}
                `}
              >
                {React.cloneElement(option.icon as React.ReactElement, {
                  color: isActive ? ICON_COLOR_ACTIVE : ICON_COLOR_INACTIVE,
                })}
              </View>
              {/* Label */}
              <Text
                className={`
                  text-sm font-semibold mb-1
                  ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}
                `}
              >
                {option.label}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </Text>
              {/* Active indicator */}
              {isActive && (
                <View className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary-500" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ─── Section: Accessibility ─────────────── */}
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Accessibility
      </Text>

      {/* Font Scale */}
      <View className="flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Font Size
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Scale: {Math.round(fontScale * 100)}%
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => adjustFontScale(-0.1)}
            disabled={fontScale <= 0.8}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center"
          >
            <ZoomOut size={16} color={ICON_COLOR_INACTIVE} />
          </Pressable>
          <Text className="text-sm font-mono text-gray-700 dark:text-gray-300 w-12 text-center">
            {Math.round(fontScale * 100)}%
          </Text>
          <Pressable
            onPress={() => adjustFontScale(0.1)}
            disabled={fontScale >= 1.5}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center"
          >
            <ZoomIn size={16} color={ICON_COLOR_INACTIVE} />
          </Pressable>
        </View>
      </View>

      {/* High Contrast */}
      <View className="flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            High Contrast
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Increases contrast for better readability
          </Text>
        </View>
        <Switch
          value={behavior.highContrast}
          onValueChange={toggleHighContrast}
        />
      </View>

      {/* Reduced Motion */}
      <View className="flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Reduce Motion
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Minimize animations throughout the interface
          </Text>
        </View>
        <Switch
          value={behavior.reducedMotion}
          onValueChange={toggleReducedMotion}
        />
      </View>

      {/* ─── Section: Active Theme Info ─────────── */}
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-3">
        Active Theme Layers
      </Text>
      <View className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        {appliedLayers.length > 0 ? (
          appliedLayers.map((layer, i) => (
            <View key={layer} className="flex-row items-center mb-1">
              <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />
              <Text className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {i + 1}. {layer}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-xs text-gray-400">System default</Text>
        )}
      </View>

      {/* Branding Info */}
      {branding.name && branding.name !== 'FactoryOS' && (
        <View className="mt-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Organization Branding
          </Text>
          <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {branding.name}
          </Text>
          {branding.poweredBy && (
            <Text className="text-xs text-gray-400 mt-1">
              Powered by {branding.poweredBy}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
