# @zipybills/eslint-config

Shared ESLint configurations for the ZipyBills monorepo, ensuring consistent code quality across all packages.

## Configurations

### Base Config
For all TypeScript packages:
```js
import eslintConfig from '@zipybills/eslint-config';
export default eslintConfig;
```

### React Config
For React/Vite frontend applications:
```js
import eslintConfig from '@zipybills/eslint-config/react';
export default eslintConfig;
```

### Node.js Config
For backend services:
```js
import eslintConfig from '@zipybills/eslint-config/node';
export default eslintConfig;
```

## Features

- ✅ TypeScript support with `@typescript-eslint`
- ✅ Import ordering and organization
- ✅ Prettier integration
- ✅ React and React Hooks rules (React config)
- ✅ JSX accessibility checks (React config)
- ✅ Node.js environment support (Node config)

## Usage in Package

1. Install in your package:
```json
{
  "devDependencies": {
    "@zipybills/eslint-config": "workspace:*",
    "eslint": "catalog:",
    "prettier": "catalog:"
  }
}
```

2. Create `eslint.config.js`:
```js
import eslintConfig from '@zipybills/eslint-config/react';
export default eslintConfig;
```

3. Add scripts to `package.json`:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\""
  }
}
```
