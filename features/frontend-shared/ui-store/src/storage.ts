/**
 * Cross-platform storage adapter for Zustand persist middleware.
 *
 * - Web: uses localStorage (synchronous, always available)
 * - Native (iOS/Android): uses @react-native-async-storage/async-storage
 *
 * Zustand's persist middleware accepts a `getStorage` that returns
 * a StateStorage-compatible object with getItem/setItem/removeItem.
 */
import { type StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

function createWebStorage(): StateStorage {
  return {
    getItem: (name: string) => {
      return localStorage.getItem(name) ?? null;
    },
    setItem: (name: string, value: string) => {
      localStorage.setItem(name, value);
    },
    removeItem: (name: string) => {
      localStorage.removeItem(name);
    },
  };
}

function createNativeStorage(): StateStorage {
  // Lazy-load AsyncStorage so it's not imported on web
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return {
    getItem: async (name: string) => {
      return (await AsyncStorage.getItem(name)) ?? null;
    },
    setItem: async (name: string, value: string) => {
      await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string) => {
      await AsyncStorage.removeItem(name);
    },
  };
}

export const appStorage: StateStorage =
  Platform.OS === 'web' ? createWebStorage() : createNativeStorage();
