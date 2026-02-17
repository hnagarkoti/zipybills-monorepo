export interface ComplianceSettings {
    compliance_mode: string;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_export: boolean;
    can_modify_config: boolean;
    requires_confirmation: boolean;
    requires_reason: boolean;
    activated_by: number | null;
    activated_at: string | null;
}
export interface ComplianceState {
    settings: ComplianceSettings;
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
    /** Pending reason for the current mutation (set by reason dialog) */
    pendingReason: string | null;
    fetchSettings: (force?: boolean) => Promise<void>;
    updateSettings: (partial: Partial<ComplianceSettings>) => Promise<void>;
    setPendingReason: (reason: string | null) => void;
}
export declare const useComplianceStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ComplianceState>>;
//# sourceMappingURL=compliance-store.d.ts.map