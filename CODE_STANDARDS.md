# ZipyBills Monorepo - Code Standards & Shareable Packages

## 🎯 Overview

This document outlines the shared packages and code standards established for the ZipyBills monorepo, ensuring consistency and code quality across all features.

---

## 📦 Shareable Packages

### 1. **@zipybills/eslint-config**
**Location**: `features/build-shared/eslint-config/`

Centralized ESLint configurations for consistent code linting across all packages.

**Available Configs:**
- **`@zipybills/eslint-config`** (base) - For all TypeScript packages
- **`@zipybills/eslint-config/react`** - For React/Vite frontend applications
- **`@zipybills/eslint-config/node`** - For Node.js backend services

**Features:**
- ✅ TypeScript support with `@typescript-eslint`
- ✅ Import ordering and organization
- ✅ Prettier integration
- ✅ React and React Hooks rules (React config)
- ✅ JSX accessibility checks (React config)
- ✅ Node.js environment support (Node config)

**Usage:**
```js
// Frontend packages
import eslintConfig from '@zipybills/eslint-config/react';
export default eslintConfig;

// Backend services
import eslintConfig from '@zipybills/eslint-config/node';
export default eslintConfig;
```

---

### 2. **@zipybills/prettier-config**
**Location**: `features/build-shared/prettier-config/`

Shared Prettier configuration for consistent code formatting.

**Configuration:**
- Print width: 100
- Tab width: 2 spaces
- Single quotes
- Trailing commas: ES5
- LF line endings

**Usage:**
```js
// prettier.config.js
import prettierConfig from '@zipybills/prettier-config';
export default prettierConfig;
```

---

### 3. **@zipybills/ts-config**
**Location**: `features/build-shared/ts-config/`

TypeScript configurations for different environments.

**Available Configs:**
- **`@zipybills/ts-config/base`** - Base TypeScript config
- **`@zipybills/ts-config/react`** - React frontend config
- **`@zipybills/ts-config/node`** - Node.js backend config

**Usage:**
```json
{
  "extends": "@zipybills/ts-config/react"
}
```

---

### 4. **@zipybills/logger**
**Location**: `features/logger/`

Universal logging system with browser and Node.js implementations.

**Features:**
- ✅ Browser Logger - Styled console logging
- ✅ Node.js Logger - Pino-based structured logging
- ✅ Auto-detection - Automatically selects correct implementation
- ✅ Child Loggers - Contextual logging
- ✅ Log Levels - DEBUG, INFO, WARN, ERROR

**Usage:**
```typescript
// Frontend
import { createBrowserLogger } from '@zipybills/logger';
const logger = createBrowserLogger({ serviceName: 'my-app' });

// Backend
import { createNodeLogger } from '@zipybills/logger';
const logger = createNodeLogger({ serviceName: 'my-service' });

logger.info('Server started', { port: 3000 });
logger.error('Failed to connect', error, { retryCount: 3 });
```

---

### 5. **@zipybills/barcode-database-config**
**Location**: `features/barcode-feature/shared/database-config/`

Shared SQL Server database configuration with singleton connection pool.

**Features:**
- ✅ Singleton connection pool
- ✅ Environment-based configuration
- ✅ Automatic reconnection handling
- ✅ Type-safe query helpers

**Usage:**
```typescript
import { getConnection } from '@zipybills/barcode-database-config';

const pool = await getConnection();
const result = await pool.request()
  .input('id', sql.Int, 1)
  .query('SELECT * FROM machines WHERE machine_id = @id');
```

---

## 🛠️ Package Scripts Standard

All packages should include these standard scripts:

### Frontend Packages (React/Vite)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Backend Services (Node.js)
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.{ts,json}\""
  }
}
```

### Library Packages
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.{ts,json}\""
  }
}
```

---

## 📁 Standard Package Structure

### Frontend Feature Package
```
feature-name-frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── api/            # API client wrappers
│   ├── queries/        # React Query hooks
│   ├── types/          # TypeScript types
│   └── index.ts        # Public exports
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── vite.config.ts
```

### Backend Service Package
```
service-name-runtime/
├── src/
│   ├── index.ts        # Entry point
│   ├── routes/         # Express routes
│   ├── controllers/    # Business logic
│   ├── services/       # Data access layer
│   ├── middleware/     # Custom middleware
│   └── types/          # TypeScript types
├── package.json
├── tsconfig.json
└── eslint.config.js
```

### Service Interface (SDK)
```
service-interface/
├── openapi.yml         # OpenAPI 3.0.3 specification
├── dist/               # Generated TypeScript SDK
├── package.json
└── tsconfig.json
```

---

## 🏗️ Monorepo Architecture

```
zipybills/
├── apps/                          # Application entry points
│   └── barcode-scanner/
│       ├── web/                   # Web shell
│       └── mobile/                # Mobile shell
│
├── features/                      # Feature packages
│   ├── build-shared/              # 🆕 Shared build tooling
│   │   ├── eslint-config/         # ESLint configs
│   │   ├── prettier-config/       # Prettier config
│   │   └── ts-config/             # TypeScript configs
│   │
│   ├── logger/                    # 🆕 Universal logger
│   │
│   └── barcode-feature/
│       ├── shared/
│       │   └── database-config/   # Shared DB config
│       ├── machines/
│       │   ├── machines-frontend/
│       │   └── machines-service/
│       │       ├── service-interface/  # TypeScript SDK
│       │       └── service-runtime/    # Express API
│       └── scanning/
│           ├── scanning-frontend/
│           └── scanning-service/
│               ├── service-interface/  # TypeScript SDK
│               └── service-runtime/    # Express API
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 🔄 SDK Generation Pattern (QXO Standard)

All APIs follow the OpenAPI → SDK → React Query pattern:

### 1. Define API Contract
```yaml
# service-interface/openapi.yml
openapi: 3.0.3
info:
  title: My Service API
  version: 1.0.0
paths:
  /api/resource:
    get:
      operationId: getResource
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
```

### 2. Generate TypeScript SDK
```bash
cd service-interface
pnpm build  # Runs: openapi-ts -i openapi.yml -o ./dist -c @hey-api/client-fetch
```

### 3. Create API Client Wrapper
```typescript
// frontend/src/api/my-service-api.ts
import { getResource } from '@zipybills/my-service-interface';

export const myServiceApi = {
  getResource: () => getResource({
    client: { baseUrl: 'http://localhost:3000' }
  }),
};
```

### 4. Create React Query Hook
```typescript
// frontend/src/queries/my-service-query.ts
import { useQuery } from '@tanstack/react-query';
import { myServiceApi } from '../api/my-service-api';

export const useResourceQuery = () => {
  return useQuery({
    queryKey: ['resource'],
    queryFn: () => myServiceApi.getResource(),
  });
};
```

### 5. Use in Component
```typescript
// Component.tsx
import { useResourceQuery } from '../queries/my-service-query';

function MyComponent() {
  const { data, isLoading, error } = useResourceQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data.name}</div>;
}
```

---

## ✅ Code Quality Checklist

Before pushing code, ensure:

- [ ] **Linting passes**: `pnpm lint`
- [ ] **Code formatted**: `pnpm format`
- [ ] **Types check**: `pnpm typecheck`
- [ ] **Tests pass**: `pnpm test`
- [ ] **Build succeeds**: `pnpm build`

---

## 🚀 Adding New Features

### 1. Create Feature Structure
```bash
mkdir -p features/my-feature/my-frontend
mkdir -p features/my-feature/my-service/service-interface
mkdir -p features/my-feature/my-service/service-runtime
```

### 2. Use Shared Packages
```json
{
  "name": "@zipybills/my-feature-frontend",
  "dependencies": {
    "@zipybills/logger": "workspace:*",
    "@zipybills/ts-config": "workspace:*"
  },
  "devDependencies": {
    "@zipybills/eslint-config": "workspace:*",
    "@zipybills/prettier-config": "workspace:*"
  }
}
```

### 3. Create Config Files
```js
// eslint.config.js
import eslintConfig from '@zipybills/eslint-config/react';
export default eslintConfig;

// prettier.config.js
import prettierConfig from '@zipybills/prettier-config';
export default prettierConfig;

// tsconfig.json
{
  "extends": "@zipybills/ts-config/react"
}
```

### 4. Define API with OpenAPI
Create `service-interface/openapi.yml` and generate SDK.

### 5. Follow Standard Scripts
Add lint, format, test, and build scripts as documented above.

---

## 📚 Documentation

- **API Documentation**: See `features/barcode-feature/API_DOCUMENTATION.md`
- **Logger Usage**: See `features/logger/README.md`
- **ESLint Config**: See `features/build-shared/eslint-config/README.md`

---

## 🎓 Best Practices

1. **Always use shared configs** - Don't duplicate ESLint/Prettier configs
2. **Generate SDKs from OpenAPI** - No manual fetch() calls
3. **Use TanStack Query** - For data fetching, caching, and state
4. **Log consistently** - Use `@zipybills/logger` everywhere
5. **Type everything** - Leverage TypeScript to its fullest
6. **Test your code** - Write tests for business logic
7. **Format before commit** - Run `pnpm format` before committing

---

## 🔧 Maintenance

### Updating Shared Configs
When updating shared configs (ESLint, Prettier, TS Config):
1. Update the config package
2. Bump version in `package.json`
3. Run `pnpm install` in root
4. All packages automatically get the update

### Regenerating SDKs
When API changes:
```bash
cd service-interface
pnpm build
```

---

## 📊 Monorepo Stats

- **Total Packages**: 29+ workspace packages
- **Shared Configs**: 3 (ESLint, Prettier, TypeScript)
- **Shared Services**: 2 (Logger, Database Config)
- **SDK Generation**: JavaScript-native (@hey-api/openapi-ts)
- **Build System**: Turborepo + pnpm workspaces
