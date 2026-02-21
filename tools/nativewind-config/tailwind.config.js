/**
 * FactoryOS – Base Tailwind Config (NativeWind)
 *
 * Static token values that work on BOTH web and native (iOS/Android).
 * Dynamic theming is handled by:
 *   - Web: theme-engine injects CSS variables on :root via applyCSSVariables()
 *   - Native: components use theme-engine hooks (useThemeColors, useThemeStyles, etc.)
 *
 * ── COLOR SYSTEM ──────────────────────────────────────────────────────────
 *
 * ┌─────────────────┬──────────────────────────────────────────────────────┐
 * │ Token           │ Purpose                                             │
 * ├─────────────────┼──────────────────────────────────────────────────────┤
 * │ primary.*       │ Brand / CTA / primary actions (blue)                │
 * │ secondary.*     │ Accent / secondary actions (indigo)                 │
 * │ gray.*          │ Neutrals / text / borders                           │
 * │ emerald.*       │ Success / active / positive stats                   │
 * │ amber.*         │ Warning / caution / maintenance                     │
 * │ red.*           │ Error / danger / breakdown / downtime               │
 * │ blue.*          │ Info / neutral data / production stats              │
 * │ purple.*        │ Duplication / batch operations                      │
 * │ orange.*        │ Duration / time-based metrics                       │
 * │ success/warn..  │ Semantic status shorthands                          │
 * │ surface.*       │ Layout surfaces (background, card, border)          │
 * │ brand.*         │ Tenant white-labeling tokens                        │
 * │ factory.*       │ Factory-floor specific semantic colors              │
 * └─────────────────┴──────────────────────────────────────────────────────┘
 *
 * ── DARK MODE ─────────────────────────────────────────────────────────────
 * darkMode: 'class' — toggled via `dark` class on root View / <html>.
 *
 * Mapping convention (use dark: prefix on Tailwind classes):
 *   bg-white        → dark:bg-gray-900     (card surface)
 *   bg-gray-50      → dark:bg-gray-950     (page background)
 *   bg-gray-100     → dark:bg-gray-800     (inset / muted)
 *   text-gray-900   → dark:text-gray-100   (primary text)
 *   text-gray-600   → dark:text-gray-400   (secondary text)
 *   border-gray-200 → dark:border-gray-700 (default border)
 *   bg-{color}-50   → dark:bg-{color}-900/20 (tinted surfaces)
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          50:  '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B3FF',
          400: '#3399FF',
          500: '#007AFF',
          600: '#0062CC',
          700: '#004999',
          800: '#003166',
          900: '#001833',
        },
        secondary: {
          DEFAULT: '#5856D6',
          50:  '#EEEEFC',
          100: '#DDDDF9',
          200: '#BCBBF3',
          300: '#9A99ED',
          400: '#7977E7',
          500: '#5856D6',
          600: '#4644AB',
          700: '#353380',
          800: '#232255',
          900: '#12112A',
        },
        // Gray scale uses slate-tinted values (600–950) for a richer dark mode.
        // Light shades (50–500) remain neutral; dark shades carry a subtle
        // blue undertone that provides better visual hierarchy and warmth
        // compared to pure gray.
        gray: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#475569',   // slate-600 (was #4B5563)
          700: '#334155',   // slate-700 (was #374151)
          800: '#1e293b',   // slate-800 (was #1F2937)
          900: '#0f172a',   // slate-900 (was #111827)
          950: '#020617',   // slate-950 (was #030712)
        },

        // ─── Semantic status colors ─────────────────────────────
        success: {
          DEFAULT: '#10B981',
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444',
          50:  '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#3B82F6',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // ─── Factory-floor semantic colors ──────────────────────
        // Use these for domain-specific UI: machine status, production KPIs, etc.
        factory: {
          // Machine status
          'machine-active':      '#10B981',  // emerald-500  → running
          'machine-maintenance': '#F59E0B',  // amber-500    → planned stop
          'machine-inactive':    '#EF4444',  // red-500      → down / fault

          // Production KPIs
          'target':              '#3B82F6',  // blue-500     → target / planned
          'produced':            '#10B981',  // emerald-500  → actual output
          'rejected':            '#EF4444',  // red-500      → scrap / reject
          'efficiency':          '#8B5CF6',  // violet-500   → OEE / efficiency

          // Downtime categories
          'breakdown':           '#EF4444',  // red
          'changeover':          '#A855F7',  // purple
          'material':            '#F59E0B',  // amber
          'power':               '#F97316',  // orange
          'quality':             '#EC4899',  // pink

          // Shift colors (for visual distinction)
          'shift-morning':       '#3B82F6',  // blue
          'shift-afternoon':     '#F59E0B',  // amber
          'shift-night':         '#8B5CF6',  // violet
        },

        // ─── Surface tokens (backgrounds, cards, borders) ───────────
        surface: {
          background:        '#FFFFFF',
          foreground:        '#111827',
          card:              '#FFFFFF',
          'card-foreground': '#111827',
          muted:             '#F5F5F5',
          'muted-foreground':'#6B7280',
          border:            '#E5E7EB',
          input:             '#E5E7EB',
          ring:              '#007AFF',
        },

        // ─── Brand tokens (tenant white-labeling) ───────────────────
        brand: {
          primary:              '#007AFF',
          'primary-foreground': '#FFFFFF',
          accent:               '#5856D6',
          'accent-foreground':  '#FFFFFF',
        },
      },
      screens: {
        'xs': '320px',   // Very small phones
        'sm': '640px',   // Phones
        'md': '768px',   // Tablets
        'lg': '1024px',  // Laptops
        'xl': '1280px',  // Desktops
        '2xl': '1536px', // Large desktops / 4K
        '3xl': '1920px', // Ultra-wide
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontFamily: {
        sans: 'System',
        mono: 'Courier',
      },
      fontSize: {
        'xs':  12,
        'sm':  14,
        'base': 16,
        'lg':  18,
        'xl':  20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
      },
      borderRadius: {
        'theme-sm':   4,
        'theme-md':   8,
        'theme-lg':   12,
        'theme-xl':   16,
        'theme-2xl':  24,
        'theme-full': 9999,
      },
    },
  },
  plugins: [],
};
