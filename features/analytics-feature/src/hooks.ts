import { useCallback } from 'react';

import { analytics } from './analytics';
import type { AnalyticsEvent, AnalyticsUser } from './types';

export const useAnalytics = () => {
  const identify = useCallback((user: AnalyticsUser) => {
    analytics.identify(user);
  }, []);

  const track = useCallback((event: AnalyticsEvent) => {
    analytics.track(event);
  }, []);

  const page = useCallback((name: string, properties?: Record<string, any>) => {
    analytics.page(name, properties);
  }, []);

  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  return { identify, track, page, reset };
};
