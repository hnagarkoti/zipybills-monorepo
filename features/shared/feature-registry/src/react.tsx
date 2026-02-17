/**
 * FactoryOS Feature Registry – React Integration
 *
 * Provides:
 *  - useFeature(id)       → { enabled, apiEnabled, uiEnabled, apiVersion, feature }
 *  - useFeatureFlags()    → all features status map
 *  - FeatureGate          → Conditionally render children based on feature state
 *  - FeatureProvider      → Context provider (optional, uses singleton by default)
 */

import React, { createContext, useContext, useCallback, useSyncExternalStore, useMemo, type ReactNode } from 'react';
import {
  featureRegistry,
  FeatureRegistry,
  type FeatureDefinition,
  type FeatureState,
} from './index';

// ─── Context ─────────────────────────────────

const FeatureRegistryContext = createContext<FeatureRegistry>(featureRegistry);

interface FeatureProviderProps {
  registry?: FeatureRegistry;
  children: ReactNode;
}

/**
 * Optional provider – override the default singleton registry.
 * Useful for testing or multi-tenant scenarios.
 */
export function FeatureProvider({ registry, children }: FeatureProviderProps) {
  return (
    <FeatureRegistryContext.Provider value={registry ?? featureRegistry}>
      {children}
    </FeatureRegistryContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────

interface FeatureStatus {
  /** Feature exists and both api + ui are not DISABLED */
  enabled: boolean;
  /** API is ENABLED or DEPRECATED (traffic allowed) */
  apiEnabled: boolean;
  /** UI is ENABLED or DEPRECATED (rendering allowed) */
  uiEnabled: boolean;
  /** Current API version */
  apiVersion: string;
  /** Full feature definition */
  feature: FeatureDefinition | undefined;
}

/**
 * Check if a feature is enabled.
 *
 * Usage:
 *   const { uiEnabled } = useFeature('machines');
 *   if (!uiEnabled) return null;
 */
export function useFeature(featureId: string): FeatureStatus {
  const registry = useContext(FeatureRegistryContext);

  const subscribe = useCallback(
    (cb: () => void) => registry.subscribe(cb),
    [registry],
  );
  const getSnapshot = useCallback(
    () => registry.getSnapshot(),
    [registry],
  );

  const features = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const feature = features.find((f) => f.id === featureId);
    return {
      enabled: feature ? feature.api !== 'DISABLED' && feature.ui !== 'DISABLED' : false,
      apiEnabled: feature ? feature.api !== 'DISABLED' : false,
      uiEnabled: feature ? feature.ui !== 'DISABLED' : false,
      apiVersion: feature?.apiVersion ?? 'v1',
      feature,
    };
  }, [features, featureId]);
}

/**
 * Get the full status map of all features.
 *
 * Usage:
 *   const flags = useFeatureFlags();
 *   // flags = { machines: { api: 'ENABLED', ui: 'ENABLED', apiVersion: 'v1' }, ... }
 */
export function useFeatureFlags(): Record<string, { api: FeatureState; ui: FeatureState; apiVersion: string }> {
  const registry = useContext(FeatureRegistryContext);

  const subscribe = useCallback(
    (cb: () => void) => registry.subscribe(cb),
    [registry],
  );
  const getSnapshot = useCallback(
    () => registry.getSnapshot(),
    [registry],
  );

  const features = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(() => {
    const map: Record<string, { api: FeatureState; ui: FeatureState; apiVersion: string }> = {};
    for (const f of features) {
      map[f.id] = { api: f.api, ui: f.ui, apiVersion: f.apiVersion };
    }
    return map;
  }, [features]);
}

// ─── Components ──────────────────────────────

interface FeatureGateProps {
  /** Feature ID to check */
  feature: string;
  /** Which scope to check: 'api' | 'ui' | 'full' (default: 'ui') */
  scope?: 'api' | 'ui' | 'full';
  /** Render when feature is disabled (default: null) */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditionally render children based on feature state.
 *
 * Usage:
 *   <FeatureGate feature="machines">
 *     <MachinesPage />
 *   </FeatureGate>
 *
 *   <FeatureGate feature="reports" fallback={<UpgradeBanner />}>
 *     <ReportsPage />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, scope = 'ui', fallback = null, children }: FeatureGateProps) {
  const status = useFeature(feature);

  const isEnabled = scope === 'api'
    ? status.apiEnabled
    : scope === 'full'
      ? status.enabled
      : status.uiEnabled;

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
