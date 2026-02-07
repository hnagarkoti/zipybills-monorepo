/**
 * Feature Flags Configuration
 * 
 * This file manages feature toggles for the application.
 * Features can be enabled/disabled without code changes.
 */

export interface FeatureFlags {
  // Barcode Feature
  'barcode.scanning': boolean;
  'barcode.generation': boolean;
  'barcode.history': boolean;
  'barcode.machines': boolean;
  
  // Future Features
  'analytics.dashboard': boolean;
  'notifications.push': boolean;
  'offline.mode': boolean;
}

// Default feature flags - can be overridden by environment variables or remote config
const defaultFlags: FeatureFlags = {
  'barcode.scanning': true,
  'barcode.generation': true,
  'barcode.history': true,
  'barcode.machines': true,
  'analytics.dashboard': false,
  'notifications.push': false,
  'offline.mode': false,
};

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): FeatureFlags {
    // Load from environment variables if available
    const envFlags: Partial<FeatureFlags> = {};
    
    Object.keys(defaultFlags).forEach((key) => {
      const envKey = `NEXT_PUBLIC_FEATURE_${key.toUpperCase().replace(/\./g, '_')}`;
      const envValue = process.env[envKey];
      
      if (envValue !== undefined) {
        envFlags[key as keyof FeatureFlags] = envValue === 'true';
      }
    });

    return { ...defaultFlags, ...envFlags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  setFlags(flags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...flags };
  }
}

export const featureFlags = new FeatureFlagService();

/**
 * React Hook for feature flags
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  // For now, just return the value directly
  // In a real app, you'd use useState/useEffect to make this reactive
  const isEnabled = featureFlags.isEnabled(flag);
  console.log(`[FeatureFlag] ${flag} = ${isEnabled}`);
  return isEnabled;
}
