/**
 * Compliance Store – Zustand state for compliance settings
 *
 * Fetches compliance settings from the server and provides guards/flags
 * that components can use to check whether operations are allowed.
 *
 * The store auto-fetches settings on first access and refreshes
 * after any settings update.
 */
import { create } from 'zustand';
import { apiFetch } from '@zipybills/factory-api-client';

// ─── Types ────────────────────────────────────

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

  // Actions
  fetchSettings: (force?: boolean) => Promise<void>;
  updateSettings: (partial: Partial<ComplianceSettings>) => Promise<void>;
  setPendingReason: (reason: string | null) => void;
}

const DEFAULT_SETTINGS: ComplianceSettings = {
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
};

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  isLoading: false,
  error: null,
  pendingReason: null,

  fetchSettings: async (force = false) => {
    if (!force && get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<ComplianceSettings & { success: boolean }>('/api/compliance/settings');
      set({
        settings: {
          compliance_mode: data.compliance_mode,
          can_create: data.can_create,
          can_edit: data.can_edit,
          can_delete: data.can_delete,
          can_export: data.can_export,
          can_modify_config: data.can_modify_config,
          requires_confirmation: data.requires_confirmation,
          requires_reason: data.requires_reason,
          activated_by: data.activated_by,
          activated_at: data.activated_at,
        },
        isLoaded: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  updateSettings: async (partial: Partial<ComplianceSettings>) => {
    const current = get().settings;
    const merged = { ...current, ...partial };
    // Optimistically update so UI reflects immediately
    set({ settings: merged, isLoading: true, error: null });
    try {
      const data = await apiFetch<ComplianceSettings & { success: boolean }>('/api/compliance/settings', {
        method: 'PUT',
        body: JSON.stringify(merged),
      });
      set({
        settings: {
          compliance_mode: data.compliance_mode,
          can_create: data.can_create,
          can_edit: data.can_edit,
          can_delete: data.can_delete,
          can_export: data.can_export,
          can_modify_config: data.can_modify_config,
          requires_confirmation: data.requires_confirmation,
          requires_reason: data.requires_reason,
          activated_by: data.activated_by,
          activated_at: data.activated_at,
        },
        isLoaded: true,
        isLoading: false,
      });
    } catch (err: any) {
      // Revert to previous settings on failure
      set({ settings: current, isLoading: false, error: err.message });
      throw err; // propagate so UI can show the error
    }
  },

  setPendingReason: (reason: string | null) => set({ pendingReason: reason }),
}));
