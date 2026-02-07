import React from 'react';

import { analytics } from './analytics';
import type { AnalyticsConfig } from './types';

export interface AnalyticsProviderProps {
  config: AnalyticsConfig;
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ config, children }) => {
  React.useEffect(() => {
    analytics.configure(config);
  }, [config]);

  return <>{children}</>;
};
