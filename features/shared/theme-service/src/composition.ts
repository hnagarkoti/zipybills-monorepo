/**
 * Theme Composition Engine
 *
 * Core algorithm that deep-merges theme layers to produce the final resolved tokens.
 *
 * Resolution Order (lowest → highest priority):
 *   1. DEFAULT_TOKENS (complete baseline)
 *   2. Base System Theme layer
 *   3. Tenant Branding layer
 *   4. Role-Based Theme layer
 *   5. Environment Theme layer
 *   6. Compliance Theme layer
 *   7. User Preferences layer
 *
 * Merge Strategy:
 *   - Objects are deep-merged recursively
 *   - Primitives are overwritten by higher-priority layers
 *   - Arrays are replaced entirely (not concatenated)
 *   - null/undefined values in overlays are ignored (don't clear lower layers)
 *   - Empty objects {} are ignored
 */
import type { ThemeTokens, ThemeLayer, DeepPartial } from './types';
import { DEFAULT_TOKENS } from './defaults/default-tokens';

/**
 * Deep merge two objects. Source values override target values.
 * Only non-null, non-undefined values in source are applied.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>,
): T {
  if (!source || typeof source !== 'object') return target;

  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = target[key];

    // Skip null/undefined in source
    if (sourceVal === null || sourceVal === undefined) continue;

    // If source is an array, replace entirely
    if (Array.isArray(sourceVal)) {
      (result as Record<string, unknown>)[key as string] = [...sourceVal];
      continue;
    }

    // If source is an object and target is also an object, recurse
    if (
      typeof sourceVal === 'object' &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as DeepPartial<Record<string, unknown>>,
      );
      continue;
    }

    // Primitive: overwrite
    (result as Record<string, unknown>)[key as string] = sourceVal;
  }

  return result;
}

/**
 * Compose multiple theme layers into a single resolved ThemeTokens.
 *
 * @param layers - Array of partial theme overlays, in priority order (lowest first)
 * @returns Fully resolved ThemeTokens
 */
export function composeTheme(layers: ThemeLayer[]): ThemeTokens {
  let result = structuredClone(DEFAULT_TOKENS) as unknown as Record<string, unknown>;

  for (const layer of layers) {
    if (!layer || Object.keys(layer).length === 0) continue;
    result = deepMerge(result, layer as Record<string, unknown>);
  }

  return result as unknown as ThemeTokens;
}

/**
 * Generate a deterministic cache key from a set of layer IDs.
 * Used for ETag generation and client-side caching.
 */
export function generateCacheKey(layerIds: string[]): string {
  const sorted = [...layerIds].sort();
  // Simple hash: join and convert to base36
  let hash = 0;
  const str = sorted.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
