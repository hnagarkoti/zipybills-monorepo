# Production NativeWind Setup for Expo + React Native Web SaaS

## Architecture Overview

**Single Codebase → Multiple Platforms**
- Web (browser via react-native-web)
- iOS (native)
- Android (native)

**Responsive Breakpoints:**
- `xs`: 320px - Very small phones
- `sm`: 640px - Phones
- `md`: 768px - Tablets  
- `lg`: 1024px - Laptops
- `xl`: 1280px - Desktops
- `2xl`: 1536px - Large desktops / 4K
- `3xl`: 1920px - Ultra-wide

## Installation

```bash
# Already installed in your monorepo
pnpm add -w nativewind tailwindcss
```

## Configuration Files

### 1. Shared Tailwind Config
**Location:** `/tools/nativewind-config/tailwind.config.js`

Contains:
- SaaS color palette (primary, secondary, success, warning, error)
- Responsive breakpoints (xs → 3xl)
- Design tokens (spacing, typography, colors)
- Safe area insets for mobile

### 2. App-Level Config
**Location:** `/apps/barcode-scanner/tailwind.config.js`

```javascript
const baseConfig = require('@zipybills/nativewind-config');

module.exports = {
  ...baseConfig,
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../features/**/home-frontend/**/*.{js,jsx,ts,tsx}',
    // Add more feature paths as needed
  ],
  presets: [require('nativewind/preset')],
};
```

### 3. Babel Config
**Location:** `/apps/barcode-scanner/babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { unstable_transformImportMeta: true }],
      'nativewind/babel', // ← NativeWind transforms className
    ],
  };
};
```

### 4. TypeScript Config
**Location:** `/apps/barcode-scanner/nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

Add to tsconfig.json:
```json
{
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"]
}
```

## Monorepo Package Structure

### Feature Package Pattern

```json
{
  "name": "@zipybills/barcode-home-frontend",
  "peerDependencies": {
    "nativewind": "catalog:",
    "react": "catalog:",
    "react-native": "catalog:"
  }
}
```

**Critical:** Use `peerDependencies` for:
- `react`
- `react-native`
- `nativewind`

This ensures **single instance** shared across all packages.

### App Package Pattern

```json
{
  "name": "@zipybills/barcode-scanner",
  "dependencies": {
    "@zipybills/barcode-home-frontend": "workspace:*",
    "nativewind": "catalog:",
    "react": "catalog:",
    "react-native": "catalog:"
  }
}
```

Apps install these as regular dependencies.

## Usage Examples

### Basic Component

```tsx
import { View, Text } from 'react-native';

export function Button() {
  return (
    <View className="px-4 py-2 bg-primary rounded-lg">
      <Text className="text-white font-semibold">Click Me</Text>
    </View>
  );
}
```

### Responsive Component

```tsx
import { View, Text } from 'react-native';

export function ResponsiveCard() {
  return (
    <View className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
      <Text className="text-base sm:text-lg md:text-xl lg:text-2xl">
        Responsive Text
      </Text>
    </View>
  );
}
```

### Platform-Aware Styling

```tsx
import { Platform, View, Text } from 'react-native';

export function PlatformCard() {
  return (
    <View className={Platform.select({
      web: 'shadow-lg hover:shadow-xl transition-shadow',
      default: 'shadow-md'
    })}>
      <Text className="text-base">Platform Optimized</Text>
    </View>
  );
}
```

## Performance Best Practices

### 1. Style Extraction
NativeWind v4 uses **compile-time extraction**. Styles are transformed during build, not runtime.

### 2. Avoid Inline Complex Logic
```tsx
// ❌ Bad - recalculates every render
<View className={isActive ? 'bg-primary' : 'bg-secondary'} />

// ✅ Good - memoize or use constants
const bgClass = isActive ? 'bg-primary' : 'bg-secondary';
<View className={bgClass} />
```

### 3. Reusable Style Tokens
Define in tailwind config, use everywhere:
```tsx
<Text className="text-primary-500">Consistent Brand Color</Text>
```

## Troubleshooting

### React Duplicate Hook Errors
**Cause:** Multiple React instances in monorepo

**Solution:**
- Feature packages: Use `peerDependencies`
- Apps: Use `dependencies`
- Never install React in both places

### Styles Not Applying
1. Clear cache: `rm -rf .expo node_modules/.cache`
2. Restart Expo: `pnpm start --clear`
3. Check `nativewind/babel` is in babel.config.js
4. Verify content paths in tailwind.config.js

### TypeScript className Errors
Add `nativewind-env.d.ts` with:
```typescript
/// <reference types="nativewind/types" />
```

## Next Steps

1. ✅ Fixed React duplicate issue
2. ✅ Set up responsive breakpoints
3. ✅ Created shared config
4. Create SaaS layout components (AppShell, Sidebar, Header)
5. Create responsive grid system
6. Add dark mode support

Ready to build production-grade SaaS layouts!
