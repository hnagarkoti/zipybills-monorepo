import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
};

export const lightTheme: Theme = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    ...colors,
    // Override colors for dark mode
    gray: {
      50: '#111827',
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      400: '#6b7280',
      500: '#9ca3af',
      600: '#d1d5db',
      700: '#e5e7eb',
      800: '#f3f4f6',
      900: '#f9fafb',
    },
  },
  spacing,
  typography,
  radius,
  shadows,
  isDark: true,
};

export const theme = {
  light: lightTheme,
  dark: darkTheme,
};
