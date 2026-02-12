/**
 * CSS Variables Generator
 *
 * Converts resolved theme tokens into CSS custom properties.
 * This enables dynamic theme switching without page reload on web.
 *
 * NativeWind/Tailwind Integration:
 *   - Injects CSS variables into :root
 *   - Tailwind config references these variables
 *   - Theme changes update variables → UI updates instantly
 *
 * Native (iOS/Android):
 *   - CSS variables are not used
 *   - Tokens are accessed directly via React context/hooks
 */
import type { ThemeTokens, ColorScale, SemanticColor } from '@zipybills/factory-theme-service/core';
import { Platform } from 'react-native';

/**
 * Convert theme tokens to a flat map of CSS custom properties.
 */
export function tokensToCSSVariables(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  // ─── Colors ─────────────────────────────────
  flattenColorScale(vars, '--color-primary', tokens.colors.primary);
  flattenColorScale(vars, '--color-secondary', tokens.colors.secondary);
  flattenColorScale(vars, '--color-gray', tokens.colors.gray);
  flattenSemanticColor(vars, '--color-success', tokens.colors.success);
  flattenSemanticColor(vars, '--color-warning', tokens.colors.warning);
  flattenSemanticColor(vars, '--color-error', tokens.colors.error);
  flattenSemanticColor(vars, '--color-info', tokens.colors.info);

  vars['--color-white'] = tokens.colors.white;
  vars['--color-black'] = tokens.colors.black;

  // Surface colors
  if (tokens.colors.surface) {
    const s = tokens.colors.surface;
    vars['--surface-background'] = s.background;
    vars['--surface-foreground'] = s.foreground;
    vars['--surface-card'] = s.card;
    vars['--surface-card-foreground'] = s.cardForeground;
    vars['--surface-muted'] = s.muted;
    vars['--surface-muted-foreground'] = s.mutedForeground;
    vars['--surface-border'] = s.border;
    vars['--surface-input'] = s.input;
    vars['--surface-ring'] = s.ring;
  }

  // Brand colors
  if (tokens.colors.brand) {
    const b = tokens.colors.brand;
    vars['--brand-primary'] = b.primary;
    vars['--brand-primary-foreground'] = b.primaryForeground;
    vars['--brand-accent'] = b.accent;
    vars['--brand-accent-foreground'] = b.accentForeground;
  }

  // ─── Typography ─────────────────────────────
  vars['--font-sans'] = tokens.typography.fontFamily.sans;
  vars['--font-mono'] = tokens.typography.fontFamily.mono;
  if (tokens.typography.fontFamily.display) {
    vars['--font-display'] = tokens.typography.fontFamily.display;
  }

  const fs = tokens.typography.fontSize;
  vars['--text-xs'] = `${fs.xs}px`;
  vars['--text-sm'] = `${fs.sm}px`;
  vars['--text-base'] = `${fs.base}px`;
  vars['--text-lg'] = `${fs.lg}px`;
  vars['--text-xl'] = `${fs.xl}px`;
  vars['--text-2xl'] = `${fs['2xl']}px`;
  vars['--text-3xl'] = `${fs['3xl']}px`;
  vars['--text-4xl'] = `${fs['4xl']}px`;
  vars['--text-5xl'] = `${fs['5xl']}px`;

  vars['--font-scale'] = String(tokens.typography.fontScale ?? 1);

  // ─── Spacing ────────────────────────────────
  const sp = tokens.spacing;
  for (const [key, val] of Object.entries(sp)) {
    vars[`--spacing-${key}`] = `${val}px`;
  }

  // ─── Radius ─────────────────────────────────
  const r = tokens.radius;
  vars['--radius-none'] = `${r.none}px`;
  vars['--radius-sm'] = `${r.sm}px`;
  vars['--radius-md'] = `${r.md}px`;
  vars['--radius-lg'] = `${r.lg}px`;
  vars['--radius-xl'] = `${r.xl}px`;
  vars['--radius-2xl'] = `${r['2xl']}px`;
  vars['--radius-full'] = `${r.full}px`;

  // ─── Layout ─────────────────────────────────
  vars['--sidebar-width'] = `${tokens.layout.sidebarWidth}px`;
  vars['--header-height'] = `${tokens.layout.headerHeight}px`;
  vars['--max-content-width'] = `${tokens.layout.maxContentWidth}px`;
  vars['--content-padding'] = `${tokens.layout.contentPadding}px`;
  if (tokens.layout.cardRadius !== undefined) {
    vars['--card-radius'] = `${tokens.layout.cardRadius}px`;
  }
  if (tokens.layout.buttonRadius !== undefined) {
    vars['--button-radius'] = `${tokens.layout.buttonRadius}px`;
  }

  // ─── Behavior flags (as data attributes) ────
  vars['--animations-enabled'] = tokens.behavior.animationsEnabled ? '1' : '0';
  vars['--reduced-motion'] = tokens.behavior.reducedMotion ? '1' : '0';
  vars['--high-contrast'] = tokens.behavior.highContrast ? '1' : '0';
  vars['--min-touch-target'] = `${tokens.behavior.minTouchTarget}px`;

  // ─── Dark mode flag ─────────────────────────
  vars['--is-dark'] = tokens.isDark ? '1' : '0';

  return vars;
}

function flattenColorScale(
  vars: Record<string, string>,
  prefix: string,
  scale: ColorScale,
): void {
  for (const [shade, value] of Object.entries(scale)) {
    vars[`${prefix}-${shade}`] = value;
  }
}

function flattenSemanticColor(
  vars: Record<string, string>,
  prefix: string,
  color: SemanticColor,
): void {
  vars[`${prefix}-50`] = color[50];
  vars[`${prefix}-500`] = color[500];
  vars[`${prefix}-700`] = color[700];
}

/**
 * Apply CSS variables to the document root.
 * Only works on web platform.
 */
export function applyCSSVariables(tokens: ThemeTokens): void {
  if (Platform.OS !== 'web') return;

  const doc = (globalThis as any).document;
  if (!doc?.documentElement) return;

  const vars = tokensToCSSVariables(tokens);
  const root = doc.documentElement;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Set dark mode class for Tailwind
  if (tokens.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set data attributes for behavior-driven CSS
  root.dataset.themeMode = tokens.isDark ? 'dark' : 'light';
  root.dataset.highContrast = tokens.behavior.highContrast ? 'true' : 'false';
  root.dataset.reducedMotion = tokens.behavior.reducedMotion ? 'true' : 'false';
  root.dataset.complianceWatermark = tokens.behavior.complianceWatermark ? 'true' : 'false';
}

/**
 * Generate a <style> tag content with CSS variables.
 * Useful for SSR or static generation.
 */
export function generateCSSVariableStylesheet(tokens: ThemeTokens): string {
  const vars = tokensToCSSVariables(tokens);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}
