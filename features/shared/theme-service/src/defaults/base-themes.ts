/**
 * Base System Themes – Light, Dark, High-Contrast
 *
 * Layer 1: Foundational visual mode.
 * These define the surface, text, and border color mappings.
 */
import type { ThemeDefinition } from '../types.js';

export const BASE_THEMES: ThemeDefinition[] = [
  // ─── Light Theme ──────────────────────────────
  {
    id: 'base:light',
    name: 'Light',
    description: 'Default light theme – optimal for office and well-lit environments',
    layer: 'base',
    tokens: {
      isDark: false,
      colors: {
        gray: {
          50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
          500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827',
        },
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
      },
      behavior: {
        highContrast: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, wcagLevel: 'AA', tags: ['light', 'default'] },
  },

  // ─── Dark Theme ───────────────────────────────
  {
    id: 'base:dark',
    name: 'Dark',
    description: 'Dark theme – optimal for control rooms, night shifts, and low-light environments',
    layer: 'base',
    tokens: {
      isDark: true,
      colors: {
        gray: {
          50: '#0f172a', 100: '#1e293b', 200: '#334155', 300: '#475569', 400: '#6b7280',
          500: '#9ca3af', 600: '#d1d5db', 700: '#e5e7eb', 800: '#f3f4f6', 900: '#f9fafb',
        },
        surface: {
          background: '#0f172a',
          foreground: '#f8fafc',
          card: '#1e293b',
          cardForeground: '#f1f5f9',
          muted: '#1e293b',
          mutedForeground: '#94a3b8',
          border: '#334155',
          input: '#334155',
          ring: '#38bdf8',
        },
      },
      behavior: {
        highContrast: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, wcagLevel: 'AA', tags: ['dark', 'night-shift'] },
  },

  // ─── High Contrast Theme ──────────────────────
  {
    id: 'base:high-contrast',
    name: 'High Contrast',
    description: 'WCAG AAA high-contrast theme – maximum readability for accessibility',
    layer: 'base',
    tokens: {
      isDark: false,
      colors: {
        primary: {
          50: '#e0f2ff', 100: '#b3daff', 200: '#80bfff', 300: '#4da3ff', 400: '#1a87ff',
          500: '#0055cc', 600: '#004399', 700: '#003166', 800: '#001f33', 900: '#000d1a',
        },
        gray: {
          50: '#ffffff', 100: '#f5f5f5', 200: '#e0e0e0', 300: '#bdbdbd', 400: '#757575',
          500: '#424242', 600: '#303030', 700: '#212121', 800: '#121212', 900: '#000000',
        },
        success: { 50: '#e8f5e9', 500: '#1b5e20', 700: '#0d3311' },
        warning: { 50: '#fff8e1', 500: '#e65100', 700: '#bf360c' },
        error:   { 50: '#ffebee', 500: '#b71c1c', 700: '#7f0000' },
        info:    { 50: '#e3f2fd', 500: '#0d47a1', 700: '#002171' },
        surface: {
          background: '#ffffff',
          foreground: '#000000',
          card: '#ffffff',
          cardForeground: '#000000',
          muted: '#f5f5f5',
          mutedForeground: '#424242',
          border: '#000000',
          input: '#000000',
          ring: '#0055cc',
        },
      },
      behavior: {
        highContrast: true,
        animationsEnabled: false,
        reducedMotion: true,
        minTouchTarget: 48,
      },
    },
    meta: { version: '1.0.0', isSystem: true, wcagLevel: 'AAA', tags: ['high-contrast', 'accessibility', 'wcag-aaa'] },
  },
];
