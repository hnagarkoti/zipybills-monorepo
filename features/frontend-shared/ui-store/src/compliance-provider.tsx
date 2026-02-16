/**
 * ComplianceProvider – React context that gates mutations
 *
 * Wraps the app and:
 *   1. Fetches compliance settings from the server on mount
 *   2. Exposes a `guardedMutate()` function that feature components
 *      MUST call before performing any server mutation
 *   3. Shows a confirmation dialog when `requires_confirmation` is on
 *   4. Shows a reason-input dialog when `requires_reason` is on
 *   5. Blocks the action entirely when the relevant permission is off
 *
 * Usage in feature components:
 *   const { guardedMutate, guard } = useCompliance();
 *   guardedMutate('create', async (reason) => {
 *     await api.createMachine(payload, reason);
 *   });
 */
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useComplianceStore, type ComplianceSettings } from './compliance-store';
import { setComplianceReason } from '@zipybills/factory-api-client';

// ─── Types ────────────────────────────────────

export type MutationType = 'create' | 'edit' | 'delete' | 'export' | 'config';

export interface ComplianceGuard {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canModifyConfig: boolean;
  requiresConfirmation: boolean;
  requiresReason: boolean;
  complianceMode: string;
  isLoaded: boolean;
}

export interface ComplianceContextValue {
  /** The current permission guard derived from server settings */
  guard: ComplianceGuard;
  /** Full compliance settings from the server */
  settings: ComplianceSettings;
  /**
   * Gate a mutation through compliance checks.
   * If the action is blocked, shows an alert and resolves `false`.
   * If confirmation/reason is needed, shows the dialog and waits.
   * Returns the reason string (or null) on success, or `false` if cancelled/blocked.
   */
  guardedMutate: (
    type: MutationType,
    callback: (reason: string | null) => Promise<void>,
  ) => Promise<boolean>;
  /** Refresh settings from server */
  refresh: () => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

// ─── Permission map ───────────────────────────

const PERM_MAP: Record<MutationType, keyof ComplianceSettings> = {
  create: 'can_create',
  edit: 'can_edit',
  delete: 'can_delete',
  export: 'can_export',
  config: 'can_modify_config',
};

const PERM_LABELS: Record<MutationType, string> = {
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  config: 'Configuration change',
};

// ─── Provider ─────────────────────────────────

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
  const {
    settings,
    isLoaded,
    fetchSettings,
    setPendingReason,
  } = useComplianceStore();

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'confirm' | 'reason'>('confirm');
  const [mutationLabel, setMutationLabel] = useState('');
  const [reasonText, setReasonText] = useState('');

  // Promise resolver refs
  const resolverRef = useRef<((value: string | null | false) => void) | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const guard: ComplianceGuard = {
    canCreate: settings.can_create,
    canEdit: settings.can_edit,
    canDelete: settings.can_delete,
    canExport: settings.can_export,
    canModifyConfig: settings.can_modify_config,
    requiresConfirmation: settings.requires_confirmation,
    requiresReason: settings.requires_reason,
    complianceMode: settings.compliance_mode,
    isLoaded,
  };

  const showDialog = useCallback(
    (type: 'confirm' | 'reason', label: string): Promise<string | null | false> => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialogType(type);
        setMutationLabel(label);
        setReasonText('');
        setDialogVisible(true);
      });
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (dialogType === 'reason') {
      const trimmed = reasonText.trim();
      if (!trimmed) return; // don't allow empty reason
      resolverRef.current?.(trimmed);
    } else {
      resolverRef.current?.(null);
    }
    setDialogVisible(false);
    resolverRef.current = null;
  }, [dialogType, reasonText]);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    setDialogVisible(false);
    resolverRef.current = null;
  }, []);

  const guardedMutate = useCallback(
    async (
      type: MutationType,
      callback: (reason: string | null) => Promise<void>,
    ): Promise<boolean> => {
      const permKey = PERM_MAP[type];
      const label = PERM_LABELS[type];

      // 1. Check permission
      if (settings[permKey] === false) {
        // Show blocked dialog
        setDialogType('confirm');
        setMutationLabel(`${label} Blocked`);
        setDialogVisible(true);
        return new Promise((resolve) => {
          resolverRef.current = () => {
            setDialogVisible(false);
            resolverRef.current = null;
            resolve(false);
          };
        });
      }

      let reason: string | null = null;

      // 2. If requires_reason, show reason dialog (implicitly confirms)
      if (settings.requires_reason) {
        const result = await showDialog('reason', label);
        if (result === false) return false;
        reason = result as string;
      }
      // 3. Else if requires_confirmation, show confirmation dialog
      else if (settings.requires_confirmation) {
        const result = await showDialog('confirm', label);
        if (result === false) return false;
      }

      // 4. Set the pending reason in the store AND api-client module
      setPendingReason(reason);
      setComplianceReason(reason);

      try {
        await callback(reason);
        return true;
      } finally {
        setPendingReason(null);
        setComplianceReason(null);
      }
    },
    [settings, showDialog, setPendingReason],
  );

  const value: ComplianceContextValue = {
    guard,
    settings,
    guardedMutate,
    refresh: fetchSettings,
  };

  const isBlocked =
    dialogType === 'confirm' && mutationLabel.includes('Blocked');

  return (
    <ComplianceContext.Provider value={value}>
      {children}

      {/* ─── Modal ───────────────────────────── */}
      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={handleCancel}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                width: '100%',
                maxWidth: 400,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: isBlocked ? '#FEE2E2' : '#FEF3C7',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>
                    {isBlocked ? '🚫' : dialogType === 'reason' ? '📝' : '⚠️'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                    }}
                  >
                    {isBlocked
                      ? `${mutationLabel}`
                      : dialogType === 'reason'
                        ? 'Reason Required'
                        : 'Confirm Action'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    {isBlocked
                      ? `This operation is disabled in ${settings.compliance_mode} mode.`
                      : dialogType === 'reason'
                        ? `Compliance requires a reason for: ${mutationLabel}`
                        : `Please confirm this ${mutationLabel.toLowerCase()} action.`}
                  </Text>
                </View>
              </View>

              {/* Reason input */}
              {dialogType === 'reason' && !isBlocked && (
                <TextInput
                  value={reasonText}
                  onChangeText={setReasonText}
                  placeholder="Enter reason for this action..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  autoFocus
                  style={{
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: '#111827',
                    textAlignVertical: 'top',
                    minHeight: 80,
                    marginBottom: 16,
                    backgroundColor: '#F9FAFB',
                  }}
                />
              )}

              {/* Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: isBlocked || dialogType !== 'reason' ? 12 : 0,
                }}
              >
                {isBlocked ? (
                  <Pressable
                    onPress={() => {
                      resolverRef.current?.(false);
                      setDialogVisible(false);
                      resolverRef.current = null;
                    }}
                    style={{
                      backgroundColor: '#EF4444',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                      OK
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      onPress={handleCancel}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor: '#F3F4F6',
                      }}
                    >
                      <Text style={{ color: '#374151', fontWeight: '500', fontSize: 14 }}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleConfirm}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 8,
                        backgroundColor:
                          dialogType === 'reason' && !reasonText.trim()
                            ? '#93C5FD'
                            : '#2563EB',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                        {dialogType === 'reason' ? 'Submit' : 'Confirm'}
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ComplianceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────

export function useCompliance(): ComplianceContextValue {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    // Graceful fallback when provider is missing – allow everything
    return {
      guard: {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canModifyConfig: true,
        requiresConfirmation: false,
        requiresReason: false,
        complianceMode: 'standard',
        isLoaded: false,
      },
      settings: {
        compliance_mode: 'standard',
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_export: true,
        can_modify_config: true,
        requires_confirmation: false,
        requires_reason: false,
        activated_by: null,
        activated_at: null,
      },
      guardedMutate: async (_type, cb) => {
        await cb(null);
        return true;
      },
      refresh: async () => {},
    };
  }
  return ctx;
}
