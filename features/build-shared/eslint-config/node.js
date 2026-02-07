/**
 * Node.js ESLint Configuration
 * For backend services and Node.js packages
 */

import baseConfig from './base.js';

export default {
  ...baseConfig,
  env: {
    node: true,
    es2021: true,
  },
  rules: {
    ...baseConfig.rules,
    
    // Node.js specific
    'no-console': 'off', // Console logging is fine in backend
    '@typescript-eslint/no-var-requires': 'warn',
    
    // Allow any for Express middleware types
    '@typescript-eslint/no-explicit-any': [
      'warn',
      {
        ignoreRestArgs: true,
      },
    ],
  },
};
