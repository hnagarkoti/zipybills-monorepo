import type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsProvider,
  AnalyticsUser,
} from './types';

class Analytics {
  private providers: AnalyticsProvider[] = [];
  private config: AnalyticsConfig = {
    enabled: true,
    debug: false,
  };

  configure(config: AnalyticsConfig) {
    this.config = { ...this.config, ...config };
    if (config.providers) {
      this.providers = config.providers;
    }
  }

  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  async identify(user: AnalyticsUser) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('[Analytics] Identify:', user);
    }

    await Promise.all(this.providers.map((provider) => provider.identify(user)));
  }

  async track(event: AnalyticsEvent) {
    if (!this.config.enabled) return;

    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    if (this.config.debug) {
      console.log('[Analytics] Track:', eventWithTimestamp);
    }

    await Promise.all(this.providers.map((provider) => provider.track(eventWithTimestamp)));
  }

  async page(name: string, properties?: Record<string, any>) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('[Analytics] Page:', name, properties);
    }

    await Promise.all(this.providers.map((provider) => provider.page(name, properties)));
  }

  async reset() {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log('[Analytics] Reset');
    }

    await Promise.all(this.providers.map((provider) => provider.reset()));
  }
}

export const analytics = new Analytics();
