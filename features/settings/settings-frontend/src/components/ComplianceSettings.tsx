/**
 * ComplianceSettings – Admin-facing compliance configuration UI
 *
 * Reads and writes compliance settings from the server via the
 * compliance store. Admin can:
 *   1. Choose a compliance mode (Standard / Audit / Validation / Traceability)
 *   2. Toggle individual permission flags (Create / Edit / Delete / Export / Config)
 *   3. Enable "Requires Confirmation" and "Requires Reason" enforcement
 *
 * All changes are persisted to the server immediately and enforced
 * by the API gateway middleware.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ActivityIndicator } from 'react-native';
import {
  Shield, Search, FileCheck, ShieldCheck,
  ShieldAlert, Info, CheckCircle, XCircle,
} from 'lucide-react-native';
import { useComplianceStore, useCompliance, type ComplianceSettings as ComplianceSettingsType } from '@zipybills/ui-store';
import { useTheme } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';

// ─── Types ────────────────────────────────────

type ComplianceMode = 'standard' | 'audit-mode' | 'validation-mode' | 'traceability-mode';

interface ModeOption {
  id: ComplianceMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  accentBg: string;
  accentBorder: string;
}

interface PermToggle {
  key: keyof ComplianceSettingsType;
  label: string;
  description: string;
}

interface ComplianceSettingsProps {
  userRole?: string;
}

// ─── Constants ────────────────────────────────

const ICON_SIZE = 20;

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Normal operation – no restrictions',
    icon: <Shield size={ICON_SIZE} color="#6B7280" />,
    color: '#6B7280',
    accentBg: 'bg-gray-50 dark:bg-gray-800',
    accentBorder: 'border-gray-300 dark:border-gray-600',
  },
  {
    id: 'audit-mode',
    label: 'Audit Mode',
    description: 'Restricts destructive actions for audits',
    icon: <Search size={ICON_SIZE} color="#D97706" />,
    color: '#D97706',
    accentBg: 'bg-amber-50 dark:bg-amber-900/30',
    accentBorder: 'border-amber-400 dark:border-amber-600',
  },
  {
    id: 'validation-mode',
    label: 'Validation Mode',
    description: 'Full read-only for regulated inspections',
    icon: <FileCheck size={ICON_SIZE} color="#2563EB" />,
    color: '#2563EB',
    accentBg: 'bg-blue-50 dark:bg-blue-900/30',
    accentBorder: 'border-blue-400 dark:border-blue-600',
  },
  {
    id: 'traceability-mode',
    label: 'Traceability Mode',
    description: 'Every action requires justification',
    icon: <ShieldCheck size={ICON_SIZE} color="#16A34A" />,
    color: '#16A34A',
    accentBg: 'bg-green-50 dark:bg-green-900/30',
    accentBorder: 'border-green-400 dark:border-green-600',
  },
];

const PERMISSION_TOGGLES: PermToggle[] = [
  { key: 'can_create', label: 'Allow Create', description: 'Users can create new records' },
  { key: 'can_edit', label: 'Allow Edit', description: 'Users can edit existing records' },
  { key: 'can_delete', label: 'Allow Delete', description: 'Users can delete records' },
  { key: 'can_export', label: 'Allow Export', description: 'Users can export data' },
  { key: 'can_modify_config', label: 'Allow Config Changes', description: 'Users can modify settings' },
];

const ENFORCEMENT_TOGGLES: PermToggle[] = [
  {
    key: 'requires_confirmation',
    label: 'Require Confirmation',
    description: 'Show confirmation dialog before every mutation',
  },
  {
    key: 'requires_reason',
    label: 'Require Reason',
    description: 'Require a written reason for every mutation',
  },
];

// ─── Component ────────────────────────────────

export function ComplianceSettings({ userRole = 'ADMIN' }: ComplianceSettingsProps) {
  const { t } = useLocale();
  const { settings, isLoaded, isLoading, fetchSettings, updateSettings } = useComplianceStore();
  const { setComplianceMode } = useTheme();
  const [saving, setSaving] = useState(false);
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERVISOR';

  useEffect(() => {
    if (!isLoaded && !isLoading) {
      fetchSettings();
    }
  }, [isLoaded, isLoading, fetchSettings]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleModeSelect = useCallback(
    async (mode: ComplianceMode) => {
      if (!isAdmin || saving) return;
      setSaveError(null);

      // Apply preset permissions for the selected mode
      let preset: Partial<ComplianceSettingsType> = { compliance_mode: mode };

      switch (mode) {
        case 'standard':
          preset = {
            ...preset,
            can_create: true,
            can_edit: true,
            can_delete: true,
            can_export: true,
            can_modify_config: true,
            requires_confirmation: false,
            requires_reason: false,
          };
          break;
        case 'audit-mode':
          preset = {
            ...preset,
            can_create: true,
            can_edit: true,
            can_delete: false,
            can_export: true,
            can_modify_config: false,
            requires_confirmation: true,
            requires_reason: false,
          };
          break;
        case 'validation-mode':
          preset = {
            ...preset,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_export: true,
            can_modify_config: false,
            requires_confirmation: false,
            requires_reason: false,
          };
          break;
        case 'traceability-mode':
          preset = {
            ...preset,
            can_create: true,
            can_edit: true,
            can_delete: true,
            can_export: true,
            can_modify_config: true,
            requires_confirmation: true,
            requires_reason: true,
          };
          break;
      }

      setSaving(true);
      try {
        await updateSettings(preset);
        // Sync theme store so watermark updates immediately
        setComplianceMode(mode as any);
        // Force re-fetch to guarantee UI shows fresh server state
        await fetchSettings(true);
      } catch (err: any) {
        setSaveError(err?.message || 'Failed to update compliance mode');
      } finally {
        setSaving(false);
      }
    },
    [isAdmin, saving, updateSettings, fetchSettings, setComplianceMode],
  );

  const handleToggle = useCallback(
    async (key: keyof ComplianceSettingsType, value: boolean) => {
      if (!isAdmin || saving) return;
      setSaveError(null);
      setSaving(true);
      try {
        await updateSettings({ [key]: value });
        await fetchSettings(true);
      } catch (err: any) {
        setSaveError(err?.message || 'Failed to update setting');
      } finally {
        setSaving(false);
      }
    },
    [isAdmin, saving, updateSettings, fetchSettings],
  );

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-sm text-gray-500 mt-3">{t('compliance.loading')}</Text>
      </View>
    );
  }

  const activeMode = settings.compliance_mode as ComplianceMode;

  return (
    <View className="flex-1">
      {/* ─── Header ────────────────────────────── */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {t('compliance.title')}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('compliance.subtitle')}
        {!isAdmin && ` ${t('compliance.adminOnly')}`}
      </Text>

      {/* Active banner */}
      {activeMode !== 'standard' && (
        <View
          className={`flex-row items-center p-3 rounded-xl mb-4 border ${
            activeMode === 'audit-mode'
              ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700'
              : activeMode === 'validation-mode'
                ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                : 'bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700'
          }`}
        >
          <ShieldAlert
            size={18}
            color={
              activeMode === 'audit-mode'
                ? '#D97706'
                : activeMode === 'validation-mode'
                  ? '#2563EB'
                  : '#16A34A'
            }
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {MODE_OPTIONS.find((m) => m.id === activeMode)?.label} {t('compliance.isActive')}
            </Text>
            {settings.activated_at && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('compliance.since')} {new Date(settings.activated_at).toLocaleString()}
              </Text>
            )}
          </View>
          {saving && <ActivityIndicator size="small" color="#6B7280" />}
        </View>
      )}

      {/* ─── Error Banner ────────────────────────── */}
      {saveError && (
        <Pressable
          onPress={() => setSaveError(null)}
          className="flex-row items-center p-3 rounded-xl mb-4 border bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700"
        >
          <XCircle size={18} color="#DC2626" />
          <Text className="ml-3 flex-1 text-sm text-red-700 dark:text-red-300">
            {saveError}
          </Text>
          <Text className="text-xs text-red-400">{t('compliance.tapToDismiss')}</Text>
        </Pressable>
      )}

      {/* ─── Mode Selector ─────────────────────── */}
      <View className="gap-3 mb-6">
        {MODE_OPTIONS.map((option) => {
          const isActive = option.id === activeMode;
          return (
            <Pressable
              key={option.id}
              onPress={() => handleModeSelect(option.id)}
              disabled={!isAdmin || saving}
              className={`
                p-4 rounded-xl border-2
                ${isActive ? `${option.accentBorder} ${option.accentBg}` : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
                ${!isAdmin ? 'opacity-50' : ''}
              `}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
                    isActive ? option.accentBg : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {option.icon}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </Text>
                </View>
                {isActive && <View className="w-3 h-3 rounded-full bg-primary-500" />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ─── Permission Toggles ────────────────── */}
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('compliance.operationPermissions')}
      </Text>
      <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        {PERMISSION_TOGGLES.map((toggle, i) => (
          <View
            key={toggle.key}
            className={`flex-row items-center justify-between px-4 py-3 ${
              i < PERMISSION_TOGGLES.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                {settings[toggle.key] ? (
                  <CheckCircle size={14} color="#16A34A" />
                ) : (
                  <XCircle size={14} color="#EF4444" />
                )}
                <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2">
                  {toggle.label}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                {toggle.description}
              </Text>
            </View>
            <Switch
              value={settings[toggle.key] as boolean}
              onValueChange={(val) => handleToggle(toggle.key, val)}
              disabled={!isAdmin || saving}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={settings[toggle.key] ? '#16A34A' : '#9CA3AF'}
            />
          </View>
        ))}
      </View>

      {/* ─── Enforcement Toggles ───────────────── */}
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('compliance.enforcementRules')}
      </Text>
      <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        {ENFORCEMENT_TOGGLES.map((toggle, i) => (
          <View
            key={toggle.key}
            className={`flex-row items-center justify-between px-4 py-3 ${
              i < ENFORCEMENT_TOGGLES.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-center">
                {settings[toggle.key] ? (
                  <ShieldAlert size={14} color="#D97706" />
                ) : (
                  <Shield size={14} color="#9CA3AF" />
                )}
                <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2">
                  {toggle.label}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                {toggle.description}
              </Text>
            </View>
            <Switch
              value={settings[toggle.key] as boolean}
              onValueChange={(val) => handleToggle(toggle.key, val)}
              disabled={!isAdmin || saving}
              trackColor={{ false: '#D1D5DB', true: '#FDE68A' }}
              thumbColor={settings[toggle.key] ? '#D97706' : '#9CA3AF'}
            />
          </View>
        ))}
      </View>

      {/* ─── Info ──────────────────────────────── */}
      <View className="flex-row items-start p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <Info size={16} color="#3B82F6" />
        <Text className="text-xs text-blue-700 dark:text-blue-300 ml-2 flex-1">
          {t('compliance.serverSideInfo')}
        </Text>
      </View>
    </View>
  );
}
