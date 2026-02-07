# Architecture Guide: Feature-Based Development with API Clients & Feature Flags

## Overview

This application follows a **feature-based architecture** where:
1. **Apps** (`apps/*`) only handle routing and composition
2. **Features** (`features/*`) contain all business logic, UI, and API clients
3. **Feature flags** control which features are enabled
4. **API clients** provide type-safe, reusable access to backend services

---

## Directory Structure

```
zipybills/
├── apps/
│   └── barcode-scanner/          # App shell - routing only
│       ├── app/                  # Expo Router pages
│       │   ├── _layout.tsx       # Route configuration
│       │   ├── index.tsx         # Root redirect
│       │   ├── scanner.tsx       # Imports ScannerPage from feature
│       │   └── machines.tsx      # Imports MachinesPage from feature
│       └── package.json
│
├── features/
│   ├── build-shared/
│   │   └── feature-flags/        # Feature toggle system
│   │       └── src/index.ts
│   │
│   └── barcode-feature/
│       ├── scanning/
│       │   ├── scanning-frontend/
│       │   │   ├── src/
│       │   │   │   ├── api/
│       │   │   │   │   └── scanning-api.ts    # API client
│       │   │   │   └── pages/
│       │   │   │       └── ScannerPage.tsx    # UI component
│       │   │   └── package.json
│       │   │
│       │   └── scanning-service/
│       │       └── service-runtime/           # Backend API
│       │
│       └── machines/
│           ├── machines-frontend/
│           │   ├── src/
│           │   │   ├── api/
│           │   │   │   └── machines-api.ts    # API client
│           │   │   └── pages/
│           │   │       └── MachinesPage.tsx   # UI component
│           │   └── package.json
│           │
│           └── machines-service/
│               └── service-runtime/           # Backend API
```

---

## 1. API Client Pattern

### Why API Clients?

Instead of calling `fetch()` directly in components, we use **API client classes**:

✅ **Benefits:**
- Type-safe API calls
- Centralized error handling
- Easy to mock for testing
- Single source of truth for API endpoints
- Reusable across features

### Example: machines-api.ts

```typescript
import type { Machine } from '@zipybills/barcode-machines-service-interface';

const BASE_URL = process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006';

export class MachinesApiClient {
  async getMachines(): Promise<Machine[]> {
    const response = await fetch(`${BASE_URL}/api/machines`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch machines');
    }
    
    return data.machines;
  }
  
  // ... other methods
}

export const machinesApi = new MachinesApiClient();
```

### Usage in Components:

```typescript
import { machinesApi } from '@zipybills/barcode-machines-frontend/api/machines-api';

// In your component
const machines = await machinesApi.getMachines();
```

---

## 2. Feature Flags System

### Purpose

Feature flags allow you to:
- Enable/disable features without code changes
- Progressive rollout of new features
- A/B testing
- Environment-specific feature availability

### Configuration

Located at: `features/build-shared/feature-flags/src/index.ts`

```typescript
export interface FeatureFlags {
  'barcode.scanning': boolean;
  'barcode.generation': boolean;
  'barcode.history': boolean;
  'barcode.machines': boolean;
  'analytics.dashboard': boolean;
}
```

### Usage

```typescript
import { featureFlags, useFeatureFlag } from '@zipybills/feature-flags';

// In React components
function MyComponent() {
  const scanningEnabled = useFeatureFlag('barcode.scanning');
  
  if (!scanningEnabled) {
    return <Text>Feature not available</Text>;
  }
  
  return <ScannerPage />;
}

// Programmatically
if (featureFlags.isEnabled('barcode.scanning')) {
  // Show scanning feature
}
```

### Environment Variables

Control features via env vars:

```bash
# .env
NEXT_PUBLIC_FEATURE_BARCODE_SCANNING=true
NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD=false
```

---

## 3. Feature-Based Development

### Rules

1. **Apps are thin shells** - only routing, no business logic
2. **Features are self-contained** - all logic, UI, API clients in features/**
3. **Features export pages** - apps import and render them
4. **Features can depend on other features** - but avoid circular dependencies

### Example: Scanner Feature

**Feature Package** (`features/barcode-feature/scanning/scanning-frontend/`):
```typescript
// src/api/scanning-api.ts
export class ScanningApiClient { ... }

// src/pages/ScannerPage.tsx
export default function ScannerPage() { ... }

// src/index.ts
export { default as ScannerPage } from './pages/ScannerPage';
```

**App** (`apps/barcode-scanner/app/scanner.tsx`):
```typescript
import ScannerPage from '@zipybills/barcode-scanning-frontend/ScannerPage';

export default ScannerPage;
```

---

## 4. Running the Application

### Development

Start everything with one command:

```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills
pnpm dev
```

This starts:
- **[SCAN]** Scanning Service (port 3003)
- **[MACH]** Machines Service (port 3006)
- **[WEB]** Universal App (port 8081)

### Individual Services

```bash
# Start only web app
pnpm dev:barcode-web

# Start only scanning service
pnpm dev:scanning-service

# Start only machines service  
pnpm dev:machines-service
```

### Mobile Platforms

```bash
# iOS
pnpm dev:barcode-ios

# Android
pnpm dev:barcode-android
```

---

## 5. Adding a New Feature

### Step 1: Create Feature Structure

```bash
features/
  └── my-feature/
      ├── my-frontend/
      │   ├── src/
      │   │   ├── api/
      │   │   │   └── my-api.ts          # API client
      │   │   └── pages/
      │   │       └── MyPage.tsx          # UI component
      │   └── package.json
      │
      └── my-service/
          └── service-runtime/
              └── src/index.ts             # Backend API
```

### Step 2: Create API Client

```typescript
// features/my-feature/my-frontend/src/api/my-api.ts
const BASE_URL = process.env.NEXT_PUBLIC_MY_API_URL || 'http://localhost:3007';

export class MyApiClient {
  async getData(): Promise<any> {
    const response = await fetch(`${BASE_URL}/api/data`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.result;
  }
}

export const myApi = new MyApiClient();
```

### Step 3: Create UI Component

```typescript
// features/my-feature/my-frontend/src/pages/MyPage.tsx
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { myApi } from '../api/my-api';

export default function MyPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function load() {
      const result = await myApi.getData();
      setData(result);
    }
    load();
  }, []);
  
  return (
    <View>
      <Text>{JSON.stringify(data)}</Text>
    </View>
  );
}
```

### Step 4: Export from Feature

```typescript
// features/my-feature/my-frontend/src/index.ts
export { default as MyPage } from './pages/MyPage';
```

### Step 5: Add Route in App

```typescript
// apps/barcode-scanner/app/my-feature.tsx
import MyPage from '@zipybills/my-frontend/MyPage';

export default MyPage;
```

### Step 6: Add Feature Flag

```typescript
// features/build-shared/feature-flags/src/index.ts
export interface FeatureFlags {
  // ... existing flags
  'my-feature.enabled': boolean;
}

const defaultFlags: FeatureFlags = {
  // ... existing flags
  'my-feature.enabled': true,
};
```

### Step 7: Guard with Feature Flag

```typescript
// apps/barcode-scanner/app/my-feature.tsx
import { useFeatureFlag } from '@zipybills/feature-flags';
import MyPage from '@zipybills/my-frontend/MyPage';
import { Text } from 'react-native';

export default function MyFeatureScreen() {
  const enabled = useFeatureFlag('my-feature.enabled');
  
  if (!enabled) {
    return <Text>Feature not available</Text>;
  }
  
  return <MyPage />;
}
```

---

## 6. Best Practices

### ✅ DO

1. **Use API clients** - Never call `fetch()` directly in components
2. **Keep apps thin** - Only routing and composition in `apps/**`
3. **Self-contained features** - All logic in `features/**`
4. **Use feature flags** - For all new features
5. **Type-safe APIs** - Use generated types from OpenAPI specs
6. **Error handling** - Always handle errors in API clients
7. **Environment variables** - For API URLs and config

### ❌ DON'T

1. **Don't put business logic in apps** - It belongs in features
2. **Don't hardcode URLs** - Use environment variables
3. **Don't call fetch directly** - Use API clients
4. **Don't skip feature flags** - Every feature should be toggleable
5. **Don't create circular dependencies** - Between features
6. **Don't duplicate code** - Extract shared code to build-shared

---

## 7. Troubleshooting

### "Loading Machines..." Never Finishes

**Problem:** API call failing

**Solution:**
1. Check if services are running: `pnpm dev`
2. Check browser console for errors (F12)
3. Verify API URL in console logs
4. Test API directly: `curl http://localhost:3006/api/machines`

### Feature Not Showing Up

**Problem:** Feature flag disabled

**Solution:**
```typescript
import { featureFlags } from '@zipybills/feature-flags';

// Check flag status
console.log(featureFlags.isEnabled('barcode.scanning'));

// Enable manually (for testing)
featureFlags.enable('barcode.scanning');
```

### Import Errors

**Problem:** Module not found

**Solution:**
```bash
# Reinstall dependencies
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills
pnpm install --no-frozen-lockfile
```

---

## 8. Summary

- ✅ **Apps** = Routing only
- ✅ **Features** = All business logic + UI + API clients
- ✅ **API Clients** = Type-safe, reusable, testable
- ✅ **Feature Flags** = Control feature availability
- ✅ **One Command** = `pnpm dev` starts everything

This architecture ensures maintainability, testability, and scalability as your application grows.
