/**
 * ComplianceSettings – Compliance mode management UI
 *
 * Admin-facing component for activating/deactivating compliance modes:
 *   - Standard (normal operation)
 *   - Audit Mode (read-only views, watermark, no destructive actions)
 *   - Validation Mode (full read-only, validation indicators)
 *   - Traceability Mode (every action logged, timestamps visible)
 *
 * Only visible to ADMIN and SUPERVISOR roles.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Shield, ShieldCheck, ShieldAlert, Search, FileCheck,
  AlertTriangle, Info,
} from 'lucide-react-native';
import { useTheme, type ComplianceThemeId, colors } from '@zipybills/theme-engine';
import {
  useComplianceMode,
  useComplianceGuard,
  useComplianceAuditMeta,
} from '@zipybills/theme-engine/compliance';

// ─── Types ────────────────────────────────────

interface ComplianceModeOption {
  id: ComplianceThemeId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  /** What happens when this mode is active */
  effects: string[];
}

interface ComplianceSettingsProps {
  /** Only admins should see this section */
  userRole?: string;
}

// ─── Constants ────────────────────────────────

const ICON_SIZE = 20;

const COMPLIANCE_OPTIONS: ComplianceModeOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Normal operation – no compliance overlay',
    icon: <Shield size={ICON_SIZE} />,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    effects: [
      'All actions available',
      'No watermark',
      'Standard audit logging',
    ],
  },
  {
    id: 'audit-mode',
    label: 'Audit Mode',
    description: 'For internal/external audits – restricts destructive actions',
    icon: <Search size={ICON_SIZE} />,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900',
    borderColor: 'border-amber-300 dark:border-amber-700',
    effects: [
      'AUDIT watermark displayed',
      'Delete operations blocked',
      'Configuration changes locked',
      'All reads/exports logged',
      'Expanded audit metadata visible',
    ],
  },
  {
    id: 'validation-mode',
    label: 'Validation Mode',
    description: 'For regulated inspections – entire UI is read-only',
    icon: <FileCheck size={ICON_SIZE} />,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900',
    borderColor: 'border-blue-300 dark:border-blue-700',
    effects: [
      'VALIDATION watermark displayed',
      'All mutations disabled',
      'Full read-only mode',
      'Export for review allowed',
      'Validation indicators shown',
    ],
  },
  {
    id: 'traceability-mode',
    label: 'Traceability Mode',
    description: 'Chain-of-custody – every action requires justification',
    icon: <ShieldCheck size={ICON_SIZE} />,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900',
    borderColor: 'border-green-300 dark:border-green-700',
    effects: [
      'TRACEABILITY watermark displayed',
      'Trace IDs assigned to every action',
      'Mandatory reason/comment for mutations',
      'Confirmation required for all changes',
      'Batch/lot lineage visible',
      'Full chain-of-custody logging',
    ],
  },
];

// ─── Component ────────────────────────────────

export function ComplianceSettings({
  userRole = 'ADMIN',
}: ComplianceSettingsProps) {
  const { setComplianceMode } = useTheme();
  const compliance = useComplianceMode();
  const guard = useComplianceGuard();
  const auditMeta = useComplianceAuditMeta();

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERVISOR';

  const handleSelect = useCallback((mode: ComplianceThemeId) => {
    if (!isAdmin) return;
    setComplianceMode(mode);
  }, [isAdmin, setComplianceMode]);

  return (
    <View className="flex-1">
      {/* ─── Header ────────────────────────────── */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Compliance Mode
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Activate compliance overlays for audits, validations, and traceability requirements.
        {!isAdmin && ' Only administrators can change compliance modes.'}
      </Text>

      {/* Active Status Banner */}
      {compliance.isActive && (
        <View
          className={`
            flex-row items-center p-3 rounded-xl mb-4
            ${compliance.isAuditMode ? 'bg-amber-50 border border-amber-300 dark:bg-amber-900 dark:border-amber-700' : ''}
            ${compliance.isValidationMode ? 'bg-blue-50 border border-blue-300 dark:bg-blue-900 dark:border-blue-700' : ''}
            ${compliance.isTraceabilityMode ? 'bg-green-50 border border-green-300 dark:bg-green-900 dark:border-green-700' : ''}
          `}
        >
          <ShieldAlert size={18} color={
            compliance.isAuditMode ? '#D97706'
            : compliance.isValidationMode ? '#2563EB'
            : '#16A34A'
          } />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {compliance.label} is Active
            </Text>
            {auditMeta.activatedAt && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Since {new Date(auditMeta.activatedAt).toLocaleString()}
              </Text>
            )}
            {auditMeta.traceId && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                Trace: {auditMeta.traceId.slice(0, 16)}...
              </Text>
            )}
          </View>
        </View>
      )}

      {/* ─── Mode Selector ─────────────────────── */}
      <View className="gap-3 mb-6">
        {COMPLIANCE_OPTIONS.map((option) => {
          const isActive = option.id === compliance.mode;
          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              disabled={!isAdmin}
              className={`
                p-4 rounded-xl border-2
                ${isActive
                  ? `${option.borderColor} ${option.bgColor}`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
                ${!isAdmin ? 'opacity-50' : ''}
              `}
            >
              <View className="flex-row items-center mb-2">
                {/* Icon */}
                <View
                  className={`
                    w-9 h-9 rounded-lg items-center justify-center mr-3
                    ${isActive ? option.bgColor : 'bg-gray-100 dark:bg-gray-700'}
                  `}
                >
                  {React.cloneElement(option.icon as React.ReactElement, {
                    color: isActive ? undefined : '#6B7280',
                  })}
                </View>
                {/* Label */}
                <View className="flex-1">
                  <Text
                    className={`
                      text-sm font-semibold
                      ${isActive ? option.color : 'text-gray-900 dark:text-gray-100'}
                    `}
                  >
                    {option.label}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </Text>
                </View>
                {/* Active dot */}
                {isActive && (
                  <View className="w-3 h-3 rounded-full bg-primary-500" />
                )}
              </View>

              {/* Effects list (shown when active or expanded) */}
              {isActive && (
                <View className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <Text className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Active effects:
                  </Text>
                  {option.effects.map((effect, i) => (
                    <View key={i} className="flex-row items-start mb-0.5">
                      <Text className="text-xs text-gray-400 mr-1.5">•</Text>
                      <Text className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                        {effect}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ─── Current Permissions ────────────────── */}
      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Current Permissions
      </Text>
      <View className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <PermissionRow label="Create records" allowed={guard.canCreate} />
        <PermissionRow label="Edit records" allowed={guard.canEdit} />
        <PermissionRow label="Delete records" allowed={guard.canDelete} />
        <PermissionRow label="Export data" allowed={guard.canExport} />
        <PermissionRow label="Modify configuration" allowed={guard.canModifyConfig} />
        <PermissionRow label="Requires confirmation" allowed={guard.requiresConfirmation} isFlag />
        <PermissionRow label="Requires reason" allowed={guard.requiresReason} isFlag />
      </View>

      {/* ─── Info Box ──────────────────────────── */}
      <View className="flex-row items-start mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-xl">
        <Info size={16} color={colors.blue[500]} />
        <Text className="text-xs text-blue-700 dark:text-blue-300 ml-2 flex-1">
          Compliance modes affect the entire factory/tenant. Changes are logged
          in the audit trail. Auto-activation can be configured for regulated
          workflows in the Admin panel.
        </Text>
      </View>
    </View>
  );
}

// ─── Permission Row ───────────────────────────

function PermissionRow({
  label,
  allowed,
  isFlag = false,
}: {
  label: string;
  allowed: boolean;
  isFlag?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-sm text-gray-700 dark:text-gray-300">{label}</Text>
      <Text
        className={`text-xs font-medium ${
          isFlag
            ? (allowed ? 'text-amber-600' : 'text-gray-400')
            : (allowed ? 'text-green-600' : 'text-red-500')
        }`}
      >
        {isFlag ? (allowed ? 'Yes' : 'No') : (allowed ? 'Allowed' : 'Blocked')}
      </Text>
    </View>
  );
}
