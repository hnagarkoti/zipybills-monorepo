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
import { View, Text, Pressable } from 'react-native';
import {
  Sun, Moon, Monitor, Palette, Check,
} from 'lucide-react-native';
import {
  useTheme,
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
  /** Preview colors for the card */
  previewBg: string;
  previewFg: string;
  previewAccent: string;
  /** Maps to BaseThemeId (null = use system/tenant default) */
  baseTheme: BaseThemeId | null;
}

interface AppearanceSettingsProps {
  /** Whether the tenant allows user theme overrides */
  allowUserOverride?: boolean;
  /** Tenant default theme label (shown when override is disabled) */
  tenantDefaultLabel?: string;
}

// ─── Component ────────────────────────────────

export function AppearanceSettings({
  allowUserOverride = true,
  tenantDefaultLabel = 'Tenant Default',
}: AppearanceSettingsProps) {
  const { context, setBaseTheme } = useTheme();
  const branding = useThemeBranding();
  const isDark = useIsDark();
  const appliedLayers = useAppliedLayers();

  // Current selection — derive from context
  const currentSelection = useMemo<ThemeOption['id']>(() => {
    if (!context.baseTheme) return 'default';
    if (context.baseTheme === 'light') return 'light';
    if (context.baseTheme === 'dark') return 'dark';
    return 'default';
  }, [context.baseTheme]);

  const themeOptions: ThemeOption[] = useMemo(
    () => [
      {
        id: 'light',
        label: 'Light',
        description: 'Clean and bright for daytime use',
        icon: <Sun size={22} />,
        previewBg: '#FFFFFF',
        previewFg: '#1F2937',
        previewAccent: '#3B82F6',
        baseTheme: 'light',
      },
      {
        id: 'dark',
        label: 'Dark',
        description: 'Easier on the eyes in low-light',
        icon: <Moon size={22} />,
        previewBg: '#111827',
        previewFg: '#F9FAFB',
        previewAccent: '#60A5FA',
        baseTheme: 'dark',
      },
      {
        id: 'system',
        label: 'System',
        description: 'Automatically matches your device',
        icon: <Monitor size={22} />,
        previewBg: 'linear', // sentinel — will render gradient
        previewFg: '#6B7280',
        previewAccent: '#8B5CF6',
        baseTheme: null,
      },
      {
        id: 'default',
        label: tenantDefaultLabel,
        description: 'Theme set by your organization',
        icon: <Palette size={22} />,
        previewBg: '#F0FDF4',
        previewFg: '#166534',
        previewAccent: '#22C55E',
        baseTheme: null,
      },
    ],
    [tenantDefaultLabel],
  );

  const handleSelect = useCallback(
    (option: ThemeOption) => {
      if (!allowUserOverride) return;
      if (option.id === 'system' || option.id === 'default') {
        setBaseTheme('light'); // Will be overridden by auto-detect in ThemeProvider
      } else if (option.baseTheme) {
        setBaseTheme(option.baseTheme);
      }
    },
    [allowUserOverride, setBaseTheme],
  );

  return (
    <View className="flex-1">
      {/* ─── Header ───────────────────────────── */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Appearance
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose how FactoryOS looks on your device.
          {!allowUserOverride && ' Theme selection is locked by your organization.'}
        </Text>
      </View>

      {/* ─── Theme Cards ─────────────────────── */}
      <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Theme
      </Text>

      <View className="flex-row flex-wrap gap-3 mb-8">
        {themeOptions.map((option) => {
          const isActive = option.id === currentSelection;
          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option)}
              disabled={!allowUserOverride}
              className={`
                flex-1 min-w-[150px] rounded-2xl border-2 overflow-hidden
                ${isActive
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
                }
                ${!allowUserOverride ? 'opacity-50' : 'active:scale-[0.98]'}
              `}
            >
              {/* Preview Strip */}
              <View
                className="h-20 items-center justify-center"
                style={{
                  backgroundColor:
                    option.previewBg === 'linear'
                      ? undefined
                      : option.previewBg,
                }}
              >
                {option.previewBg === 'linear' ? (
                  /* Split half-and-half for "System" */
                  <View className="flex-row flex-1 w-full">
                    <View className="flex-1 bg-white items-center justify-center">
                      <Sun size={18} color="#F59E0B" />
                    </View>
                    <View className="flex-1 bg-gray-900 items-center justify-center">
                      <Moon size={18} color="#60A5FA" />
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    {/* Fake UI dots */}
                    <View
                      className="w-8 h-2 rounded-full"
                      style={{ backgroundColor: option.previewAccent }}
                    />
                    <View
                      className="w-5 h-2 rounded-full opacity-40"
                      style={{ backgroundColor: option.previewFg }}
                    />
                    <View
                      className="w-6 h-2 rounded-full opacity-20"
                      style={{ backgroundColor: option.previewFg }}
                    />
                  </View>
                )}
              </View>

              {/* Info */}
              <View className="bg-white dark:bg-gray-800 px-4 py-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    {React.cloneElement(option.icon as React.ReactElement, {
                      color: isActive ? '#3B82F6' : '#6B7280',
                    })}
                    <Text
                      className={`text-sm font-semibold ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {isActive && (
                    <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                      <Check size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ─── Current Status ──────────────────── */}
      <View className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-4 py-3 flex-row items-center gap-3 mb-6">
        <View
          className={`w-3 h-3 rounded-full ${
            isDark ? 'bg-indigo-400' : 'bg-amber-400'
          }`}
        />
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Currently using{' '}
          <Text className="font-semibold text-gray-900 dark:text-gray-100">
            {isDark ? 'Dark' : 'Light'}
          </Text>{' '}
          mode
          {appliedLayers.length > 1 &&
            ` with ${appliedLayers.length} theme layers`}
        </Text>
      </View>

      {/* Branding Info */}
      {branding.name && branding.name !== 'FactoryOS' && (
        <View className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Organization Branding
          </Text>
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
