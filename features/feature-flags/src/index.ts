export { 
  useFeatureFlagStore,
  type FeatureFlags,
  type FeatureFlagValue 
} from './store';

import { useFeatureFlagStore } from './store';
import type { FeatureFlagValue } from './store';

export const useFeatureFlag = (key: string, defaultValue: FeatureFlagValue = false) => {
  return useFeatureFlagStore((state) => state.getFlag(key, defaultValue));
};

export const useFeatureEnabled = (key: string) => {
  return useFeatureFlagStore((state) => state.isEnabled(key));
};

export { FeatureFlagProvider, type FeatureFlagProviderProps } from './provider';
