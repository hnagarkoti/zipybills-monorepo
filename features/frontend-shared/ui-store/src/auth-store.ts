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
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (user: AuthUser, token: string) => void;
  logout: () => void;
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
