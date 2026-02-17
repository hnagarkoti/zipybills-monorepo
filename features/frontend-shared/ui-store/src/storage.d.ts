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
export declare const appStorage: StateStorage;
//# sourceMappingURL=storage.d.ts.map