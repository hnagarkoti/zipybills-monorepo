/**
 * React ESLint Configuration
 * For React/Vite frontend applications
 */

import baseConfig from './base.js';

export default {
  ...baseConfig,
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    ...baseConfig.settings,
    react: {
      version: 'detect',
    },
  },
  parserOptions: {
    ...baseConfig.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [...(baseConfig.plugins || []), 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    ...(baseConfig.extends || []),
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  rules: {
    ...baseConfig.rules,
    
    // React
    'react/prop-types': 'off', // Using TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/jsx-uses-react': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // JSX Accessibility
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
  },
};
