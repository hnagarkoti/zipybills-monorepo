/**
 * Auth store – Zustand
 *
 * Manages logged-in user, JWT token, login/logout actions.
 * This replaces the useState-based auth in HomePage.
 */
import { create } from 'zustand';
import { setAuthToken } from '@zipybills/factory-api-client';

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

export const useAuthStore = create<AuthState>((set) => ({
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
}));
