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
import React from 'react';
import { type ComplianceSettings } from './compliance-store';
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
    guardedMutate: (type: MutationType, callback: (reason: string | null) => Promise<void>) => Promise<boolean>;
    /** Refresh settings from server */
    refresh: () => Promise<void>;
}
export declare function ComplianceProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCompliance(): ComplianceContextValue;
//# sourceMappingURL=compliance-provider.d.ts.map