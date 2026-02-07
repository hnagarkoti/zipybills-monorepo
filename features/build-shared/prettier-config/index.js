/**
 * Shared Prettier Configuration
 * Consistent code formatting across all packages
 */

export default {
  // Line Length
  printWidth: 100,
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Semicolons
  semi: true,
  
  // Quotes
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  
  // Trailing Commas
  trailingComma: 'es5',
  
  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  
  // Line Endings
  endOfLine: 'lf',
  
  // Other
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
};
