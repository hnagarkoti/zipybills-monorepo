/**
 * FactoryOS – Imperative Color Tokens
 *
 * Use these constants when you need color values as strings (e.g., icon `color` props,
 * inline styles, chart colors). For Tailwind className-based styling, use the utility
 * classes directly — this file is for the imperative / JavaScript-driven side.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  USAGE                                                             │
 * │                                                                    │
 * │  import { colors, statusColors, useSemanticColor } from            │
 * │    '@zipybills/theme-engine/color-tokens';                 │
 * │                                                                    │
 * │  // Static lookup:                                                 │
 * │  <Factory size={20} color={colors.gray[500]} />                    │
 * │  <AlertTriangle size={14} color={statusColors.error} />            │
 * │                                                                    │
 * │  // Dark-mode aware (inside a component):                          │
 * │  const iconColor = useSemanticColor('textSecondary');               │
 * │  <Settings size={16} color={iconColor} />                          │
 * └─────────────────────────────────────────────────────────────────────┘
 */
import { useThemeStore } from './theme-store';

// ─── Static Color Palette ────────────────────────────────────────────

export const colors = {
  white: '#FFFFFF',
  black: '#000000',

  gray: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  emerald: {
    50:  '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },

  red: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  amber: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  blue: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  purple: {
    50:  '#FAF5FF',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
  },

  orange: {
    50:  '#FFF7ED',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
  },

  pink: {
    50:  '#FDF2F8',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
  },

  violet: {
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
  },
} as const;

// ─── Semantic Status Colors ──────────────────────────────────────────
// Quick-access for status-related UI.

export const statusColors = {
  success: colors.emerald[500],
  warning: colors.amber[500],
  error:   colors.red[500],
  info:    colors.blue[500],
  neutral: colors.gray[500],
} as const;

// ─── Machine Status Colors ───────────────────────────────────────────
// Consistent mapping across all machine-related UI.

export const machineStatusColors = {
  ACTIVE:      { icon: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  MAINTENANCE: { icon: '#D97706', bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-800' },
  INACTIVE:    { icon: '#DC2626', bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-700 dark:text-red-400',         border: 'border-red-200 dark:border-red-800' },
} as const;

// ─── Downtime Category Colors ────────────────────────────────────────

export const downtimeCategoryColors = {
  BREAKDOWN:  { icon: colors.red[500],    accent: 'red' },
  MAINTENANCE:{ icon: colors.blue[500],   accent: 'blue' },
  CHANGEOVER: { icon: colors.purple[500], accent: 'purple' },
  MATERIAL:   { icon: colors.amber[500],  accent: 'yellow' },
  POWER:      { icon: colors.orange[500], accent: 'orange' },
  QUALITY:    { icon: colors.pink[500],   accent: 'pink' },
  OTHER:      { icon: colors.gray[500],   accent: 'gray' },
} as const;

// ─── Production KPI Colors ──────────────────────────────────────────

export const kpiColors = {
  target:     colors.blue[500],
  produced:   colors.emerald[500],
  rejected:   colors.red[500],
  efficiency: colors.violet[500],
  downtime:   colors.orange[500],
} as const;

// ─── Shift Colors ───────────────────────────────────────────────────
// Visual distinction for shifts in calendar/planning views.

export const shiftColors = {
  morning:   { icon: colors.blue[500],   bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-400' },
  afternoon: { icon: colors.amber[500],  bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
  night:     { icon: colors.violet[500], bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400' },
} as const;

// ─── Progress Bar Color Thresholds ──────────────────────────────────
// Returns Tailwind class based on percentage.

export function progressBarColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-400';
  if (pct >= 70) return 'bg-blue-400';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

// ─── Dark-Mode Aware Hook ───────────────────────────────────────────
// For icon colors / inline styles that need to respond to dark mode.

type SemanticColorKey =
  | 'textPrimary' | 'textSecondary' | 'textMuted'
  | 'iconDefault' | 'iconMuted'
  | 'border' | 'divider'
  | 'surfaceBg' | 'cardBg';

const SEMANTIC_MAP: Record<SemanticColorKey, { light: string; dark: string }> = {
  textPrimary:   { light: colors.gray[900], dark: '#F9FAFB' },
  textSecondary: { light: colors.gray[600], dark: '#9CA3AF' },
  textMuted:     { light: colors.gray[400], dark: '#6B7280' },
  iconDefault:   { light: colors.gray[500], dark: '#9CA3AF' },
  iconMuted:     { light: colors.gray[400], dark: '#6B7280' },
  border:        { light: colors.gray[200], dark: '#374151' },
  divider:       { light: colors.gray[100], dark: '#1F2937' },
  surfaceBg:     { light: colors.white,     dark: '#030712' },
  cardBg:        { light: colors.white,     dark: colors.gray[900] },
};

/**
 * Returns a hex color string that auto-switches between light and dark mode.
 * Use this for imperative style props like `color`, `tintColor` on icons.
 *
 * @example
 *   const iconColor = useSemanticColor('iconDefault');
 *   <Factory size={16} color={iconColor} />
 */
export function useSemanticColor(key: SemanticColorKey): string {
  const isDark = useThemeStore((s) => s.tokens.isDark);
  return isDark ? SEMANTIC_MAP[key].dark : SEMANTIC_MAP[key].light;
}

/**
 * Returns all semantic colors resolved for the current mode at once.
 * More efficient if you need multiple colors in one component.
 *
 * @example
 *   const sc = useSemanticColors();
 *   <Text style={{ color: sc.textPrimary }}>Title</Text>
 *   <Settings size={16} color={sc.iconDefault} />
 */
export function useSemanticColors(): Record<SemanticColorKey, string> {
  const isDark = useThemeStore((s) => s.tokens.isDark);
  const result = {} as Record<SemanticColorKey, string>;
  for (const key of Object.keys(SEMANTIC_MAP) as SemanticColorKey[]) {
    result[key] = isDark ? SEMANTIC_MAP[key].dark : SEMANTIC_MAP[key].light;
  }
  return result;
}
