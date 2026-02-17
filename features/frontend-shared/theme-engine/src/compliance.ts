/**
 * FactoryOS Compliance Engine – Frontend
 *
 * Provides hooks and guards for audit-mode, validation-mode,
 * and traceability-mode. These compliance modes are activated
 * by tenant admins or auto-enabled for regulated workflows.
 *
 * Architecture:
 *   - Reads compliance state from the theme-engine store
 *   - Provides boolean guards for UI components
 *   - Exposes metadata hooks for audit overlays
 *   - All state is derived from the active ThemeResolutionContext
 *
 * Usage:
 *   const { isAuditMode, isReadOnly } = useComplianceMode();
 *   const guard = useComplianceGuard();
 *   if (!guard.canDelete) { ... }
 */
import { useMemo, useCallback } from 'react';
import type {
  ComplianceThemeId,
  ThemeBehavior,
} from '@zipybills/factory-theme-service/core';
import { useThemeStore } from './theme-store';

// ─── Types ────────────────────────────────────

export interface ComplianceModeInfo {
  /** Current compliance mode ID */
  mode: ComplianceThemeId;
  /** Human-readable label */
  label: string;
  /** Whether any compliance mode is active (not 'standard') */
  isActive: boolean;
  /** audit-mode specifically */
  isAuditMode: boolean;
  /** validation-mode specifically */
  isValidationMode: boolean;
  /** traceability-mode specifically */
  isTraceabilityMode: boolean;
  /** UI is locked to read-only */
  isReadOnly: boolean;
  /** Watermark is visible */
  hasWatermark: boolean;
  /** Audit trail panel should be shown */
  showAuditTrail: boolean;
  /** Animations are suppressed */
  animationsDisabled: boolean;
}

export interface ComplianceGuard {
  /** Can the user perform create operations */
  canCreate: boolean;
  /** Can the user perform update/edit operations */
  canEdit: boolean;
  /** Can the user perform delete/destructive operations */
  canDelete: boolean;
  /** Can the user export data */
  canExport: boolean;
  /** Can the user modify configuration */
  canModifyConfig: boolean;
  /** Must extra confirmation be shown for mutations */
  requiresConfirmation: boolean;
  /** Must a reason/comment be attached to every mutation */
  requiresReason: boolean;
}

export interface ComplianceAuditMeta {
  /** Trace ID for the current session (for traceability-mode) */
  traceId: string | null;
  /** ISO timestamp of when compliance mode was activated */
  activatedAt: string | null;
  /** Actor who activated it */
  activatedBy: string | null;
  /** Compliance mode label for display/export */
  modeLabel: string;
}

// ─── Label Map ────────────────────────────────

const MODE_LABELS: Record<ComplianceThemeId, string> = {
  standard: 'Standard',
  'audit-mode': 'Audit Mode',
  'validation-mode': 'Validation Mode',
  'traceability-mode': 'Traceability Mode',
};

// ─── Hooks ────────────────────────────────────

/**
 * Primary compliance hook – returns the active compliance mode
 * and all derived boolean flags.
 *
 * @example
 * const { isAuditMode, isReadOnly, showAuditTrail } = useComplianceMode();
 */
export function useComplianceMode(): ComplianceModeInfo {
  const mode = useThemeStore(
    (s) => s.context.complianceMode ?? 'standard',
  ) as ComplianceThemeId;
  const behavior = useThemeStore((s) => s.tokens.behavior);

  return useMemo<ComplianceModeInfo>(
    () => ({
      mode,
      label: MODE_LABELS[mode] ?? mode,
      isActive: mode !== 'standard',
      isAuditMode: mode === 'audit-mode',
      isValidationMode: mode === 'validation-mode',
      isTraceabilityMode: mode === 'traceability-mode',
      isReadOnly: behavior.readOnlyMode,
      hasWatermark: behavior.complianceWatermark,
      showAuditTrail: behavior.auditTrailVisible,
      animationsDisabled: !behavior.animationsEnabled,
    }),
    [mode, behavior],
  );
}

/**
 * Compliance guard – returns permission flags for UI actions.
 *
 * In standard mode everything is allowed.
 * In audit-mode: deletes & config changes are blocked; exports require logging.
 * In validation-mode: entire UI is read-only.
 * In traceability-mode: all mutations require a reason + confirmation.
 *
 * @example
 * const guard = useComplianceGuard();
 * <Button disabled={!guard.canDelete} onPress={handleDelete} />
 */
export function useComplianceGuard(): ComplianceGuard {
  const { mode, isReadOnly } = useComplianceMode();

  return useMemo<ComplianceGuard>(() => {
    // Standard – everything allowed
    if (mode === 'standard') {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canModifyConfig: true,
        requiresConfirmation: false,
        requiresReason: false,
      };
    }

    // Validation – full read-only
    if (mode === 'validation-mode') {
      return {
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true, // export for review is allowed
        canModifyConfig: false,
        requiresConfirmation: false,
        requiresReason: false,
      };
    }

    // Audit – no destructive actions, no config changes
    if (mode === 'audit-mode') {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: false,       // destructive actions blocked
        canExport: true,        // export allowed (logged)
        canModifyConfig: false, // config locked during audit
        requiresConfirmation: true,
        requiresReason: false,
      };
    }

    // Traceability – everything requires justification
    if (mode === 'traceability-mode') {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canModifyConfig: true,
        requiresConfirmation: true,
        requiresReason: true, // every mutation must have a reason
      };
    }

    // Fallback (unknown future mode) – permissive
    return {
      canCreate: !isReadOnly,
      canEdit: !isReadOnly,
      canDelete: !isReadOnly,
      canExport: true,
      canModifyConfig: !isReadOnly,
      requiresConfirmation: false,
      requiresReason: false,
    };
  }, [mode, isReadOnly]);
}

/**
 * Returns audit metadata for display in audit trail panels
 * and export headers.
 */
export function useComplianceAuditMeta(): ComplianceAuditMeta {
  const mode = useThemeStore(
    (s) => s.context.complianceMode ?? 'standard',
  ) as ComplianceThemeId;
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  return useMemo<ComplianceAuditMeta>(
    () => ({
      traceId: mode === 'traceability-mode'
        ? resolvedTheme?.cacheKey ?? null
        : null,
      activatedAt: mode !== 'standard'
        ? resolvedTheme?.resolvedAt ?? null
        : null,
      activatedBy: null, // will be populated from auth context in production
      modeLabel: MODE_LABELS[mode] ?? mode,
    }),
    [mode, resolvedTheme],
  );
}

/**
 * Convenience: boolean check for any active compliance mode.
 */
export function useIsComplianceActive(): boolean {
  return useThemeStore(
    (s) => (s.context.complianceMode ?? 'standard') !== 'standard',
  );
}

/**
 * Shorthand hooks for specific modes.
 */
export function useIsAuditMode(): boolean {
  return useThemeStore((s) => s.context.complianceMode === 'audit-mode');
}

export function useIsValidationMode(): boolean {
  return useThemeStore((s) => s.context.complianceMode === 'validation-mode');
}

export function useIsTraceabilityMode(): boolean {
  return useThemeStore((s) => s.context.complianceMode === 'traceability-mode');
}
