import { colors, spacing, radius, typography } from '@zipybills/ui-theme';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    '../../apps/**/*.{js,jsx,ts,tsx}',
    '../**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        gray: colors.gray,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
      },
      spacing: {
        ...spacing,
      },
      borderRadius: {
        ...radius,
      },
      fontSize: {
        xs: `${typography.fontSize.xs}px`,
        sm: `${typography.fontSize.sm}px`,
        base: `${typography.fontSize.base}px`,
        lg: `${typography.fontSize.lg}px`,
        xl: `${typography.fontSize.xl}px`,
        '2xl': `${typography.fontSize['2xl']}px`,
        '3xl': `${typography.fontSize['3xl']}px`,
        '4xl': `${typography.fontSize['4xl']}px`,
        '5xl': `${typography.fontSize['5xl']}px`,
      },
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },
    },
  },
  plugins: [],
};
