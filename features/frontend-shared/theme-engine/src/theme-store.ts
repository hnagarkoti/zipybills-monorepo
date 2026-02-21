/**
 * Theme Store – Zustand State Management
 *
 * Persisted store for theme preferences.
 * Manages the ThemeResolutionContext and caches the resolved theme.
 *
 * Cross-platform: uses localStorage on web, AsyncStorage on native.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import type {
  ThemeResolutionContext, ResolvedTheme, ThemeTokens,
  BaseThemeId, EnvironmentThemeId, ComplianceThemeId,
  ThemeLayer,
} from '@zipybills/factory-theme-service/core';
import {
  ThemeResolver, themeRegistry, DEFAULT_TOKENS,
} from '@zipybills/factory-theme-service/core';

// ─── Cross-platform storage (same pattern as ui-store) ─

function createWebStorage() {
  return {
    getItem: (name: string) => localStorage.getItem(name) ?? null,
    setItem: (name: string, value: string) => localStorage.setItem(name, value),
    removeItem: (name: string) => localStorage.removeItem(name),
  };
}

function createNativeStorage() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: async (name: string) => (await AsyncStorage.getItem(name)) ?? null,
    setItem: async (name: string, value: string) => await AsyncStorage.setItem(name, value),
    removeItem: async (name: string) => await AsyncStorage.removeItem(name),
  };
}

const themeStorage = Platform.OS === 'web' ? createWebStorage() : createNativeStorage();

// ─── Store Types ──────────────────────────────

export interface ThemeState {
  /** Current resolution context */
  context: ThemeResolutionContext;

  /** Last resolved theme (cached) */
  resolvedTheme: ResolvedTheme | null;

  /** Quick access to final tokens */
  tokens: ThemeTokens;

  /** Whether theme has been resolved at least once */
  isReady: boolean;

  /** Whether a remote resolution is in-flight */
  isLoading: boolean;

  /**
   * Whether the user has explicitly chosen a theme via the Settings UI.
   * When true, the ThemeProvider will NOT override with the OS colour-scheme
   * preference on (re)mount — the user's choice always wins.
   */
  isExplicitChoice: boolean;

  // ─── Actions ────────────────────────────────

  /** Set base theme (light/dark/high-contrast) */
  setBaseTheme: (baseTheme: BaseThemeId) => void;

  /**
   * Clear the explicit user choice so the OS colour-scheme preference
   * is used again on the next mount. Call this when the user selects
   * the "Follow system" / "Auto" option in Settings.
   */
  clearExplicitChoice: () => void;

  /** Set tenant ID (triggers re-resolution) */
  setTenantId: (tenantId: string | undefined) => void;

  /** Set user role (triggers re-resolution) */
  setRole: (role: string | undefined) => void;

  /** Set environment (triggers re-resolution) */
  setEnvironment: (environment: EnvironmentThemeId | undefined) => void;

  /** Set compliance mode (triggers re-resolution) */
  setComplianceMode: (mode: ComplianceThemeId) => void;

  /** Set user preferences overlay */
  setUserPreferences: (prefs: ThemeLayer) => void;

  /** Full context update + resolve */
  updateContext: (partial: Partial<ThemeResolutionContext>) => void;

  /** Force re-resolve from current context */
  resolveTheme: () => void;

  /** Reset to defaults */
  reset: () => void;
}

const DEFAULT_CONTEXT: ThemeResolutionContext = {
  baseTheme: 'light',
  deploymentMode: 'saas',
};

const resolver = new ThemeResolver(themeRegistry);

function resolveFromContext(context: ThemeResolutionContext): {
  resolvedTheme: ResolvedTheme;
  tokens: ThemeTokens;
} {
  const resolvedTheme = resolver.resolve(context);
  return { resolvedTheme, tokens: resolvedTheme.tokens };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      context: DEFAULT_CONTEXT,
      resolvedTheme: null,
      tokens: DEFAULT_TOKENS,
      isReady: false,
      isLoading: false,
      isExplicitChoice: false,

      setBaseTheme: (baseTheme) => {
        const context = { ...get().context, baseTheme };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        // Mark that the user has made a deliberate choice — this persists
        // across refreshes and prevents the OS colour-scheme from overriding.
        set({ context, resolvedTheme, tokens, isReady: true, isExplicitChoice: true });
      },

      clearExplicitChoice: () => {
        // Drop back to OS colour-scheme detection. The actual baseTheme will
        // be re-applied by ThemeProvider on the next mount (e.g. page refresh).
        set({ isExplicitChoice: false });
      },

      setTenantId: (tenantId) => {
        const context = { ...get().context, tenantId };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      setRole: (role) => {
        const context = { ...get().context, role };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      setEnvironment: (environment) => {
        const context = { ...get().context, environment };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      setComplianceMode: (complianceMode) => {
        const context = { ...get().context, complianceMode };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      setUserPreferences: (userPreferences) => {
        const context = { ...get().context, userPreferences };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      updateContext: (partial) => {
        const context = { ...get().context, ...partial };
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ context, resolvedTheme, tokens, isReady: true });
      },

      resolveTheme: () => {
        const { context } = get();
        const { resolvedTheme, tokens } = resolveFromContext(context);
        set({ resolvedTheme, tokens, isReady: true });
      },

      reset: () => {
        const { resolvedTheme, tokens } = resolveFromContext(DEFAULT_CONTEXT);
        // Clearing isExplicitChoice so OS colour-scheme detection resumes.
        set({
          context: DEFAULT_CONTEXT,
          resolvedTheme,
          tokens,
          isReady: true,
          isExplicitChoice: false,
        });
      },
    }),
    {
      name: 'factoryos-theme',
      storage: createJSONStorage(() => themeStorage),
      // Only persist user preferences, not the full resolved theme
      partialize: (state) => ({
        context: state.context,
        isExplicitChoice: state.isExplicitChoice,
      }),
      onRehydrateStorage: () => (state) => {
        // Defer re-resolution to avoid state updates before mount
        if (state) {
          setTimeout(() => {
            const current = useThemeStore.getState();
            const { resolvedTheme, tokens } = resolveFromContext(current.context);
            useThemeStore.setState({ resolvedTheme, tokens, isReady: true });
          }, 0);
        }
      },
    },
  ),
);
