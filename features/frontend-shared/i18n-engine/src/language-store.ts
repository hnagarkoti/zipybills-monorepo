/**
 * Zustand store for persisting the user's locale preference.
 *
 * Uses the same cross-platform appStorage adapter as the rest of the app
 * (localStorage on web, AsyncStorage on native).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

import { type I18nState, type SupportedLocale, DEFAULT_LOCALE } from './types';

/**
 * Minimal cross-platform storage (mirrors ui-store/storage.ts).
 * We duplicate this here so that i18n-engine has zero dependency on ui-store
 * and can initialise before other stores.
 */
function getStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string) => localStorage.getItem(name) ?? null,
      setItem: (name: string, value: string) => localStorage.setItem(name, value),
      removeItem: (name: string) => localStorage.removeItem(name),
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: async (name: string) => (await AsyncStorage.getItem(name)) ?? null,
    setItem: async (name: string, value: string) => await AsyncStorage.setItem(name, value),
    removeItem: async (name: string) => await AsyncStorage.removeItem(name),
  };
}

export const useLanguageStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      isHydrated: false,
      setLocale: (locale: SupportedLocale) => set({ locale }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'factoryos-language',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
