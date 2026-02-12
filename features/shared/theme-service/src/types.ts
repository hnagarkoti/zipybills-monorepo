/**
 * FactoryOS Theme Service – Type Definitions
 *
 * Multi-Layer Enterprise Theming Engine type system.
 *
 * Theme Composition Order (lowest → highest priority):
 *   1. Base System Theme    (light / dark / high-contrast)
 *   2. Tenant Branding      (logo, colors, fonts, white-labeling)
 *   3. Role-Based Theme     (operator / supervisor / maintenance / admin / executive)
 *   4. Environment Theme    (factory-floor / control-room / office / mobile)
 *   5. Compliance Theme     (audit-mode / validation-mode / traceability-mode)
 *   6. User Preferences     (accessibility, font size, contrast, custom overrides)
 *
 * Each layer is a partial overlay. The Theme Composition Engine
 * deep-merges layers top-down to produce the final resolved theme.
 */

// ─── Theme Layer Identifiers ──────────────────

export type ThemeLayerId =
  | 'base'
  | 'tenant'
  | 'role'
  | 'environment'
  | 'compliance'
  | 'user';

/** Ordered list of theme layers from lowest to highest priority */
export const THEME_LAYER_ORDER: ThemeLayerId[] = [
  'base',
  'tenant',
  'role',
  'environment',
  'compliance',
  'user',
];

// ─── Base System Themes ───────────────────────

export type BaseThemeId = 'light' | 'dark' | 'high-contrast';

// ─── Role Themes ──────────────────────────────

export type RoleThemeId =
  | 'operator'
  | 'supervisor'
  | 'maintenance'
  | 'admin'
  | 'executive';

// ─── Environment Themes ───────────────────────

export type EnvironmentThemeId =
  | 'factory-floor'
  | 'control-room'
  | 'office'
  | 'mobile';

// ─── Compliance Themes ────────────────────────

export type ComplianceThemeId =
  | 'standard'
  | 'audit-mode'
  | 'validation-mode'
  | 'traceability-mode';

// ─── Color Scale ──────────────────────────────

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColor {
  50: string;
  500: string;
  700: string;
}

// ─── Design Token Types ───────────────────────

export interface ThemeColors {
  primary: ColorScale;
  secondary: ColorScale;
  gray: ColorScale;
  success: SemanticColor;
  warning: SemanticColor;
  error: SemanticColor;
  info: SemanticColor;
  white: string;
  black: string;
  transparent: string;
  /** Surface & background tokens */
  surface?: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  /** Brand overlay colors (tenant white-labeling) */
  brand?: {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
  };
}

export interface ThemeTypography {
  fontFamily: {
    sans: string;
    mono: string;
    /** Tenant can override display font */
    display?: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  /** User preference: global font size multiplier (0.8 = 80%, 1.0 = 100%, 1.5 = 150%) */
  fontScale?: number;
}

export interface ThemeSpacing {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
  20: number;
  24: number;
  32: number;
}

export interface ThemeRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeShadows {
  sm: ThemeShadow;
  md: ThemeShadow;
  lg: ThemeShadow;
  xl: ThemeShadow;
}

// ─── Layout & Behavior Tokens ─────────────────

export interface ThemeLayout {
  /** Sidebar width in desktop view */
  sidebarWidth: number;
  /** Header height */
  headerHeight: number;
  /** Max content width */
  maxContentWidth: number;
  /** Content padding */
  contentPadding: number;
  /** Card border radius override */
  cardRadius?: number;
  /** Button border radius override */
  buttonRadius?: number;
}

export interface ThemeBehavior {
  /** Enable animations (disable for accessibility / factory-floor) */
  animationsEnabled: boolean;
  /** Reduce motion for accessibility */
  reducedMotion: boolean;
  /** High contrast mode */
  highContrast: boolean;
  /** Show compliance watermarks */
  complianceWatermark: boolean;
  /** Audit trail visible */
  auditTrailVisible: boolean;
  /** Read-only mode for validation */
  readOnlyMode: boolean;
  /** Auto-lock timeout in seconds (0 = disabled) */
  autoLockTimeout: number;
  /** Minimum touch target size in dp (WCAG) */
  minTouchTarget: number;
}

// ─── Branding (Tenant White-Labeling) ─────────

export interface ThemeBranding {
  /** Tenant display name */
  name: string;
  /** Logo URL (light background version) */
  logoLight?: string;
  /** Logo URL (dark background version) */
  logoDark?: string;
  /** Favicon URL */
  favicon?: string;
  /** Login page background image */
  loginBackground?: string;
  /** Powered-by text (null = hide) */
  poweredBy?: string | null;
  /** Custom CSS class prefix for tenant isolation */
  cssPrefix?: string;
}

// ─── Complete Theme Token Set ─────────────────

export interface ThemeTokens {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  layout: ThemeLayout;
  behavior: ThemeBehavior;
  branding: ThemeBranding;
  isDark: boolean;
}

// ─── Theme Layer (partial overlay) ────────────

export type ThemeLayer = DeepPartial<ThemeTokens>;

// ─── Theme Definition (stored/registered) ─────

export interface ThemeDefinition {
  /** Unique theme ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description?: string;
  /** Which layer this theme belongs to */
  layer: ThemeLayerId;
  /** The partial token overlay */
  tokens: ThemeLayer;
  /** Metadata */
  meta?: {
    version?: string;
    author?: string;
    tags?: string[];
    /** WCAG conformance level */
    wcagLevel?: 'A' | 'AA' | 'AAA';
    /** Is this a system-provided theme? */
    isSystem?: boolean;
  };
}

// ─── Theme Resolution Context ─────────────────
//
// Sent by the client to resolve which layers to compose.

export interface ThemeResolutionContext {
  /** Base system theme preference */
  baseTheme: BaseThemeId;
  /** Tenant ID (for SaaS multi-tenant) */
  tenantId?: string;
  /** User role */
  role?: RoleThemeId | string;
  /** Environment context */
  environment?: EnvironmentThemeId;
  /** Compliance mode */
  complianceMode?: ComplianceThemeId;
  /** User preference overrides */
  userPreferences?: ThemeLayer;
  /** Deployment mode */
  deploymentMode?: 'saas' | 'on-prem';
}

// ─── Resolved Theme (final output) ────────────

export interface ResolvedTheme {
  /** The fully composed token set */
  tokens: ThemeTokens;
  /** Which layers were applied, in order */
  appliedLayers: string[];
  /** Resolution timestamp */
  resolvedAt: string;
  /** Cache key for ETag */
  cacheKey: string;
  /** Resolution context that produced this theme */
  context: ThemeResolutionContext;
}

// ─── Tenant Theme Configuration ───────────────
//
// Stored per-tenant (SaaS) or per-factory (On-Prem)

export interface TenantThemeConfig {
  tenantId: string;
  /** Tenant branding overrides */
  branding: ThemeBranding;
  /** Color overrides for tenant */
  colorOverrides?: Partial<ThemeColors>;
  /** Typography overrides */
  typographyOverrides?: Partial<ThemeTypography>;
  /** Role-based theme assignments */
  roleThemes?: Record<string, string>;
  /** Default base theme for this tenant */
  defaultBaseTheme?: BaseThemeId;
  /** Default environment for this tenant */
  defaultEnvironment?: EnvironmentThemeId;
  /** Allowed compliance modes */
  allowedComplianceModes?: ComplianceThemeId[];
  /** Created/updated timestamps */
  createdAt?: string;
  updatedAt?: string;
}

// ─── Theme Event (for subscriptions) ──────────

export type ThemeEventType =
  | 'theme:registered'
  | 'theme:updated'
  | 'theme:removed'
  | 'theme:resolved'
  | 'tenant:config-updated';

export interface ThemeEvent {
  type: ThemeEventType;
  themeId?: string;
  tenantId?: string;
  timestamp: string;
  payload?: unknown;
}

// ─── Utility Types ────────────────────────────

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
