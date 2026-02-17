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
export const useAuthStore = create()(persist((set) => ({
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
}), {
    name: 'factoryos-auth',
    storage: createJSONStorage(() => appStorage),
    // Re-apply the JWT token to the API client when state is rehydrated
    onRehydrateStorage: () => (state) => {
        if (state?.token) {
            setAuthToken(state.token);
        }
    },
}));
