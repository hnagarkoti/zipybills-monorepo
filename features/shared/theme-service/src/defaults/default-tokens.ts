/**
 * Default Token Values
 *
 * Complete token set that serves as the foundation.
 * Every resolved theme starts from these defaults.
 * Backward-compatible with the existing @zipybills/ui-theme tokens.
 */
import type {
  ThemeTokens, ThemeColors, ThemeTypography, ThemeSpacing,
  ThemeRadius, ThemeShadows, ThemeLayout, ThemeBehavior, ThemeBranding,
} from '../types.js';

export const DEFAULT_COLORS: ThemeColors = {
  primary: {
    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
    500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e',
  },
  secondary: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
    500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
    500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827',
  },
  success: { 50: '#f0fdf4', 500: '#10b981', 700: '#047857' },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
  error:   { 50: '#fef2f2', 500: '#ef4444', 700: '#b91c1c' },
  info:    { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  surface: {
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    muted: '#f3f4f6',
    mutedForeground: '#6b7280',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#0ea5e9',
  },
  brand: {
    primary: '#0ea5e9',
    primaryForeground: '#ffffff',
    accent: '#a855f7',
    accentForeground: '#ffffff',
  },
};

export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    display: 'Inter, system-ui, sans-serif',
  },
  fontSize: {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
    '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
  },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
  fontScale: 1.0,
};

export const DEFAULT_SPACING: ThemeSpacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128,
};

export const DEFAULT_RADIUS: ThemeRadius = {
  none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999,
};

export const DEFAULT_SHADOWS: ThemeShadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,  shadowRadius: 4, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2,  shadowRadius: 16, elevation: 12 },
};

export const DEFAULT_LAYOUT: ThemeLayout = {
  sidebarWidth: 256,
  headerHeight: 64,
  maxContentWidth: 1280,
  contentPadding: 24,
  cardRadius: 12,
  buttonRadius: 8,
};

export const DEFAULT_BEHAVIOR: ThemeBehavior = {
  animationsEnabled: true,
  reducedMotion: false,
  highContrast: false,
  complianceWatermark: false,
  auditTrailVisible: false,
  readOnlyMode: false,
  autoLockTimeout: 0,
  minTouchTarget: 44,
};

export const DEFAULT_BRANDING: ThemeBranding = {
  name: 'FactoryOS',
  poweredBy: 'Powered by FactoryOS',
};

export const DEFAULT_TOKENS: ThemeTokens = {
  colors: DEFAULT_COLORS,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  radius: DEFAULT_RADIUS,
  shadows: DEFAULT_SHADOWS,
  layout: DEFAULT_LAYOUT,
  behavior: DEFAULT_BEHAVIOR,
  branding: DEFAULT_BRANDING,
  isDark: false,
};
