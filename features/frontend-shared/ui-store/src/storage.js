import { Platform } from 'react-native';
function createWebStorage() {
    return {
        getItem: (name) => {
            return localStorage.getItem(name) ?? null;
        },
        setItem: (name, value) => {
            localStorage.setItem(name, value);
        },
        removeItem: (name) => {
            localStorage.removeItem(name);
        },
    };
}
function createNativeStorage() {
    // Lazy-load AsyncStorage so it's not imported on web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return {
        getItem: async (name) => {
            return (await AsyncStorage.getItem(name)) ?? null;
        },
        setItem: async (name, value) => {
            await AsyncStorage.setItem(name, value);
        },
        removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
        },
    };
}
export const appStorage = Platform.OS === 'web' ? createWebStorage() : createNativeStorage();
