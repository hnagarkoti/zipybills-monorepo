/**
 * Role-Based Themes
 *
 * Layer 3: Role-specific UI adaptations.
 * Each role gets a distinct accent color and layout behavior
 * to provide visual identity and optimize for the role's workflow.
 */
import type { ThemeDefinition } from '../types.js';

export const ROLE_THEMES: ThemeDefinition[] = [
  // ─── Operator ─────────────────────────────────
  // Factory floor workers: large touch targets, bold colors, simplified UI
  {
    id: 'role:operator',
    name: 'Operator',
    description: 'Optimized for factory floor operators – large touch targets, high visibility, simplified navigation',
    layer: 'role',
    tokens: {
      colors: {
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        brand: {
          primary: '#10b981',
          primaryForeground: '#ffffff',
          accent: '#059669',
          accentForeground: '#ffffff',
        },
      },
      typography: {
        fontSize: { xs: 14, sm: 16, base: 18, lg: 20, xl: 24, '2xl': 28, '3xl': 34, '4xl': 40, '5xl': 52 },
        fontScale: 1.15,
      },
      layout: {
        contentPadding: 16,
        cardRadius: 16,
        buttonRadius: 12,
      },
      behavior: {
        minTouchTarget: 56,
        autoLockTimeout: 300,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['operator', 'factory-floor', 'large-ui'] },
  },

  // ─── Supervisor ───────────────────────────────
  // Overview dashboards, production monitoring, team management
  {
    id: 'role:supervisor',
    name: 'Supervisor',
    description: 'Balanced view for supervisors – clear status indicators, dashboard-optimized',
    layer: 'role',
    tokens: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
        },
        brand: {
          primary: '#3b82f6',
          primaryForeground: '#ffffff',
          accent: '#2563eb',
          accentForeground: '#ffffff',
        },
      },
      layout: {
        contentPadding: 20,
      },
      behavior: {
        autoLockTimeout: 600,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['supervisor', 'monitoring'] },
  },

  // ─── Maintenance ──────────────────────────────
  // Equipment-focused: warm palette, diagnostic views
  {
    id: 'role:maintenance',
    name: 'Maintenance',
    description: 'Equipment-focused theme for maintenance crews – warm palette, diagnostic-optimized',
    layer: 'role',
    tokens: {
      colors: {
        primary: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
          500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        },
        brand: {
          primary: '#f97316',
          primaryForeground: '#ffffff',
          accent: '#ea580c',
          accentForeground: '#ffffff',
        },
      },
      behavior: {
        minTouchTarget: 48,
        autoLockTimeout: 900,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['maintenance', 'equipment', 'diagnostics'] },
  },

  // ─── Admin ────────────────────────────────────
  // Full access, compact data-dense UI
  {
    id: 'role:admin',
    name: 'Administrator',
    description: 'Full-access admin theme – data-dense, compact, all features visible',
    layer: 'role',
    tokens: {
      colors: {
        primary: {
          50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
          500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87',
        },
        brand: {
          primary: '#a855f7',
          primaryForeground: '#ffffff',
          accent: '#9333ea',
          accentForeground: '#ffffff',
        },
      },
      typography: {
        fontSize: { xs: 11, sm: 13, base: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28, '4xl': 34, '5xl': 44 },
        fontScale: 0.9,
      },
      layout: {
        contentPadding: 16,
        sidebarWidth: 240,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['admin', 'data-dense', 'full-access'] },
  },

  // ─── Executive ────────────────────────────────
  // Clean, polished, report/KPI focused
  {
    id: 'role:executive',
    name: 'Executive',
    description: 'Executive dashboard theme – clean, polished, KPI-focused with premium feel',
    layer: 'role',
    tokens: {
      colors: {
        primary: {
          50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6',
          500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843',
        },
        secondary: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a',
        },
        brand: {
          primary: '#0f172a',
          primaryForeground: '#ffffff',
          accent: '#14b8a6',
          accentForeground: '#ffffff',
        },
      },
      typography: {
        fontFamily: {
          sans: '"SF Pro Display", Inter, system-ui, sans-serif',
          mono: '"SF Mono", Menlo, monospace',
          display: '"SF Pro Display", Inter, system-ui, sans-serif',
        },
      },
      layout: {
        maxContentWidth: 1400,
        contentPadding: 32,
        cardRadius: 16,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['executive', 'kpi', 'premium'] },
  },
];
