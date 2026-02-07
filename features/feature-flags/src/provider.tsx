import React, { useEffect } from 'react';
import { type FeatureFlags, useFeatureFlagStore } from './store';

export interface FeatureFlagProviderProps {
  initialFlags?: FeatureFlags;
  fetchFlags?: () => Promise<FeatureFlags>;
  children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  initialFlags = {},
  fetchFlags,
  children,
}) => {
  const setFlags = useFeatureFlagStore((state) => state.setFlags);

  useEffect(() => {
    setFlags(initialFlags);

    if (fetchFlags) {
      fetchFlags().then(setFlags).catch((error) => {
        console.error('Failed to fetch feature flags', error);
      });
    }
  }, [initialFlags, fetchFlags, setFlags]);

  return <>{children}</>;
};
