export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  properties?: Record<string, any>;
}

export interface AnalyticsProvider {
  identify: (user: AnalyticsUser) => void | Promise<void>;
  track: (event: AnalyticsEvent) => void | Promise<void>;
  page: (name: string, properties?: Record<string, any>) => void | Promise<void>;
  reset: () => void | Promise<void>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  providers?: AnalyticsProvider[];
}
