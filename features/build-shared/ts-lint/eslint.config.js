import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ─── TypeScript ────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // ─── Code quality ──────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', { max: 4 }],
      'max-depth': ['warn', { max: 4 }],
      'complexity': ['warn', { max: 15 }],

      // ─── Best practices ────────────────────────
      'no-nested-ternary': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'multi-line'],
      'no-throw-literal': 'error',
      'prefer-template': 'warn',

      // ─── Import restrictions ───────────────────
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@expo/vector-icons', message: 'Use lucide-react-native instead.' },
            { name: 'react-native-vector-icons', message: 'Use lucide-react-native instead.' },
            { name: '@untitledui/icons', message: 'Use lucide-react-native instead.' },
            { name: 'redux', message: 'Use zustand for state management.' },
            { name: '@reduxjs/toolkit', message: 'Use zustand for state management.' },
            { name: 'react-redux', message: 'Use zustand for state management.' },
          ],
          patterns: [
            { group: ['@expo/vector-icons/*'], message: 'Use lucide-react-native instead.' },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.expo/**',
      '**/.next/**',
    ],
  }
);
