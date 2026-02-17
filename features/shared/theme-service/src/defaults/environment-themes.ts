/**
 * Environment Themes
 *
 * Layer 4: Context-aware UI adaptations based on physical environment.
 * Factory floor needs high visibility; office needs compact data views.
 */
import type { ThemeDefinition } from '../types.js';

export const ENVIRONMENT_THEMES: ThemeDefinition[] = [
  // ─── Factory Floor ────────────────────────────
  // Bright, high-contrast, large elements, reduced animations
  {
    id: 'env:factory-floor',
    name: 'Factory Floor',
    description: 'High-visibility theme for factory floor displays – large text, bold indicators, minimal distractions',
    layer: 'environment',
    tokens: {
      typography: {
        fontSize: { xs: 16, sm: 18, base: 20, lg: 24, xl: 28, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64 },
        fontWeight: { normal: '500', medium: '600', semibold: '700', bold: '800' },
        fontScale: 1.3,
      },
      layout: {
        headerHeight: 80,
        contentPadding: 32,
        cardRadius: 20,
        buttonRadius: 16,
      },
      behavior: {
        animationsEnabled: false,
        reducedMotion: true,
        minTouchTarget: 64,
        autoLockTimeout: 120,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['factory-floor', 'high-visibility', 'industrial'] },
  },

  // ─── Control Room ─────────────────────────────
  // Dark by default, data-dense, multi-monitor friendly
  {
    id: 'env:control-room',
    name: 'Control Room',
    description: 'Multi-monitor control room – dark background, data-dense, status-indicator optimized',
    layer: 'environment',
    tokens: {
      isDark: true,
      colors: {
        surface: {
          background: '#020617',
          foreground: '#e2e8f0',
          card: '#0f172a',
          cardForeground: '#e2e8f0',
          muted: '#1e293b',
          mutedForeground: '#94a3b8',
          border: '#1e293b',
          input: '#1e293b',
          ring: '#38bdf8',
        },
      },
      typography: {
        fontFamily: {
          sans: '"JetBrains Mono", "Roboto Mono", monospace',
          mono: '"JetBrains Mono", Menlo, monospace',
        },
        fontSize: { xs: 11, sm: 12, base: 13, lg: 14, xl: 16, '2xl': 20, '3xl': 24, '4xl': 30, '5xl': 36 },
        fontScale: 0.85,
      },
      layout: {
        sidebarWidth: 200,
        headerHeight: 48,
        contentPadding: 12,
        maxContentWidth: 1920,
        cardRadius: 6,
      },
      behavior: {
        animationsEnabled: true,
        autoLockTimeout: 0,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['control-room', 'dark', 'data-dense', 'multi-monitor'] },
  },

  // ─── Office ───────────────────────────────────
  // Standard comfortable working environment
  {
    id: 'env:office',
    name: 'Office',
    description: 'Standard office environment – balanced for comfortable extended use',
    layer: 'environment',
    tokens: {
      layout: {
        sidebarWidth: 256,
        headerHeight: 64,
        contentPadding: 24,
        maxContentWidth: 1280,
      },
      behavior: {
        animationsEnabled: true,
        autoLockTimeout: 900,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['office', 'standard', 'default'] },
  },

  // ─── Mobile ───────────────────────────────────
  // Touch-optimized, space-efficient
  {
    id: 'env:mobile',
    name: 'Mobile',
    description: 'Touch-optimized mobile theme – larger targets, simplified navigation, space-efficient',
    layer: 'environment',
    tokens: {
      layout: {
        sidebarWidth: 0,
        headerHeight: 56,
        contentPadding: 16,
        maxContentWidth: 428,
        cardRadius: 16,
        buttonRadius: 12,
      },
      behavior: {
        minTouchTarget: 48,
        autoLockTimeout: 180,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['mobile', 'touch', 'compact'] },
  },
];
