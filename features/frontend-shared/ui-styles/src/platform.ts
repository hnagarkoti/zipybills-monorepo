import { Platform } from 'react-native';

/**
 * Platform-specific selector utility
 */
export const platformSelect = <T>(options: {
  web?: T;
  native?: T;
  ios?: T;
  android?: T;
  default?: T;
}): T | undefined => {
  return Platform.select({
    web: options.web ?? options.default,
    ios: options.ios ?? options.native ?? options.default,
    android: options.android ?? options.native ?? options.default,
    default: options.default,
  });
};

/**
 * Conditional rendering based on platform
 */
export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS !== 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Platform-specific component loader
 */
export const loadPlatformComponent = async (
  componentName: string,
  basePath: string
): Promise<any> => {
  try {
    // Try platform-specific first
    const platformExtension = Platform.OS === 'web' ? 'web' : 'native';
    return await import(`${basePath}/${componentName}.${platformExtension}`);
  } catch {
    // Fall back to shared component
    return await import(`${basePath}/${componentName}`);
  }
};
