import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { createContext, useContext, useCallback, useEffect, useRef, useState, } from 'react';
import { Modal, View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, } from 'react-native';
import { useComplianceStore } from './compliance-store';
import { setComplianceReason } from '@zipybills/factory-api-client';
const ComplianceContext = createContext(null);
// ─── Permission map ───────────────────────────
const PERM_MAP = {
    create: 'can_create',
    edit: 'can_edit',
    delete: 'can_delete',
    export: 'can_export',
    config: 'can_modify_config',
};
const PERM_LABELS = {
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    config: 'Configuration change',
};
// ─── Provider ─────────────────────────────────
export function ComplianceProvider({ children }) {
    const { settings, isLoaded, fetchSettings, setPendingReason, } = useComplianceStore();
    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState('confirm');
    const [mutationLabel, setMutationLabel] = useState('');
    const [reasonText, setReasonText] = useState('');
    // Promise resolver refs
    const resolverRef = useRef(null);
    // Fetch on mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);
    const guard = {
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
    const showDialog = useCallback((type, label) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialogType(type);
            setMutationLabel(label);
            setReasonText('');
            setDialogVisible(true);
        });
    }, []);
    const handleConfirm = useCallback(() => {
        if (dialogType === 'reason') {
            const trimmed = reasonText.trim();
            if (!trimmed)
                return; // don't allow empty reason
            resolverRef.current?.(trimmed);
        }
        else {
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
    const guardedMutate = useCallback(async (type, callback) => {
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
        let reason = null;
        // 2. If requires_reason, show reason dialog (implicitly confirms)
        if (settings.requires_reason) {
            const result = await showDialog('reason', label);
            if (result === false)
                return false;
            reason = result;
        }
        // 3. Else if requires_confirmation, show confirmation dialog
        else if (settings.requires_confirmation) {
            const result = await showDialog('confirm', label);
            if (result === false)
                return false;
        }
        // 4. Set the pending reason in the store AND api-client module
        setPendingReason(reason);
        setComplianceReason(reason);
        try {
            await callback(reason);
            return true;
        }
        finally {
            setPendingReason(null);
            setComplianceReason(null);
        }
    }, [settings, showDialog, setPendingReason]);
    const value = {
        guard,
        settings,
        guardedMutate,
        refresh: fetchSettings,
    };
    const isBlocked = dialogType === 'confirm' && mutationLabel.includes('Blocked');
    return (_jsxs(ComplianceContext.Provider, { value: value, children: [children, _jsx(Modal, { visible: dialogVisible, transparent: true, animationType: "fade", onRequestClose: handleCancel, children: _jsx(KeyboardAvoidingView, { behavior: Platform.OS === 'ios' ? 'padding' : 'height', style: { flex: 1 }, children: _jsx(Pressable, { onPress: handleCancel, style: {
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 24,
                        }, children: _jsxs(Pressable, { onPress: () => { }, style: {
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
                            }, children: [_jsxs(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, children: [_jsx(View, { style: {
                                                width: 36,
                                                height: 36,
                                                borderRadius: 8,
                                                backgroundColor: isBlocked ? '#FEE2E2' : '#FEF3C7',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                            }, children: _jsx(Text, { style: { fontSize: 18 }, children: isBlocked ? '🚫' : dialogType === 'reason' ? '📝' : '⚠️' }) }), _jsxs(View, { style: { flex: 1 }, children: [_jsx(Text, { style: {
                                                        fontSize: 16,
                                                        fontWeight: '600',
                                                        color: '#111827',
                                                    }, children: isBlocked
                                                        ? `${mutationLabel}`
                                                        : dialogType === 'reason'
                                                            ? 'Reason Required'
                                                            : 'Confirm Action' }), _jsx(Text, { style: { fontSize: 13, color: '#6B7280', marginTop: 2 }, children: isBlocked
                                                        ? `This operation is disabled in ${settings.compliance_mode} mode.`
                                                        : dialogType === 'reason'
                                                            ? `Compliance requires a reason for: ${mutationLabel}`
                                                            : `Please confirm this ${mutationLabel.toLowerCase()} action.` })] })] }), dialogType === 'reason' && !isBlocked && (_jsx(TextInput, { value: reasonText, onChangeText: setReasonText, placeholder: "Enter reason for this action...", placeholderTextColor: "#9CA3AF", multiline: true, numberOfLines: 3, autoFocus: true, style: {
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
                                    } })), _jsx(View, { style: {
                                        flexDirection: 'row',
                                        justifyContent: 'flex-end',
                                        gap: 8,
                                        marginTop: isBlocked || dialogType !== 'reason' ? 12 : 0,
                                    }, children: isBlocked ? (_jsx(Pressable, { onPress: () => {
                                            resolverRef.current?.(false);
                                            setDialogVisible(false);
                                            resolverRef.current = null;
                                        }, style: {
                                            backgroundColor: '#EF4444',
                                            paddingHorizontal: 20,
                                            paddingVertical: 10,
                                            borderRadius: 8,
                                        }, children: _jsx(Text, { style: { color: '#fff', fontWeight: '600', fontSize: 14 }, children: "OK" }) })) : (_jsxs(_Fragment, { children: [_jsx(Pressable, { onPress: handleCancel, style: {
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    backgroundColor: '#F3F4F6',
                                                }, children: _jsx(Text, { style: { color: '#374151', fontWeight: '500', fontSize: 14 }, children: "Cancel" }) }), _jsx(Pressable, { onPress: handleConfirm, style: {
                                                    paddingHorizontal: 20,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    backgroundColor: dialogType === 'reason' && !reasonText.trim()
                                                        ? '#93C5FD'
                                                        : '#2563EB',
                                                }, children: _jsx(Text, { style: { color: '#fff', fontWeight: '600', fontSize: 14 }, children: dialogType === 'reason' ? 'Submit' : 'Confirm' }) })] })) })] }) }) }) })] }));
}
// ─── Hook ─────────────────────────────────────
export function useCompliance() {
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
            refresh: async () => { },
        };
    }
    return ctx;
}
