/**
 * Auth store – Zustand with persistence
 *
 * Manages logged-in user, JWT token, login/logout actions.
 * State is persisted to localStorage (web) / AsyncStorage (native)
 * so that a browser refresh or app restart preserves the session.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAuthToken } from '@zipybills/factory-api-client';
import { appStorage } from './storage';

export interface AuthUser {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  /** H1: Tenant context from JWT */
  tenant_id?: number;
  /** H3: Plan awareness for UI restrictions */
  plan?: string;
  /** Tenant display name */
  tenant_name?: string;
  /** Tenant logo (base64 data URI or URL) */
  tenant_logo_url?: string;
  /** Fine-grained permissions from RBAC */
  permissions?: string[];
  /** True if this user is the platform super-admin */
  is_platform_admin?: boolean;
  /** Access scope: PLATFORM for super admin, TENANT for tenant users */
  scope?: 'PLATFORM' | 'TENANT';
  /** Trial expiry date (ISO string) */
  trial_ends_at?: string;
  /** Tenant account status: ACTIVE, TRIAL, SUSPENDED, etc. */
  tenant_status?: string;
  /** Plan limits */
  max_users?: number;
  max_machines?: number;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /** H1: Update tenant metadata after login */
  setTenantInfo: (info: { tenant_id?: number; plan?: string; tenant_name?: string; tenant_logo_url?: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        if (token) {
          setAuthToken(token);
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        setAuthToken('');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setTenantInfo: (info) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, ...info }
            : null,
        }));
      },
    }),
    {
      name: 'factoryos-auth',
      storage: createJSONStorage(() => appStorage),
      // Re-apply the JWT token to the API client when state is rehydrated
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    },
  ),
);
