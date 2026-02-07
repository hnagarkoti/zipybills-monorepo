# 📚 Understanding Features Folder Structure

## 🎯 Core Concept

The **features folder** contains **all reusable business logic, components, and services** that can be shared across multiple apps (web, mobile).

```
Think of it as a LIBRARY OF FEATURES that apps import and use.
```

---

## 📁 Feature Structure Patterns

### Pattern 1: Simple Feature (Shared Utilities)
For simple features that don't need frontend/backend separation:

```
features/
└── auth-feature/
    ├── src/
    │   ├── index.ts              # Export all public APIs
    │   ├── providers.tsx         # React components/providers
    │   ├── hooks.ts              # Custom React hooks
    │   └── types.ts              # TypeScript types
    └── package.json              # @zipybills/auth-feature
```

**Used by:** Both web and mobile apps
**Contains:** Authentication logic, hooks, providers
**Example:**
```tsx
// In any app
import { useAuth, AuthProvider } from '@zipybills/auth-feature';
```

---

### Pattern 2: Full-Stack Feature (Frontend + Backend)
For features that have both UI and API:

```
features/
└── barcode-feature/
    ├── barcode-frontend/          # 🎨 All UI code
    │   ├── src/
    │   │   ├── pages/             # Page components
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Scanner.tsx
    │   │   │   ├── History.tsx
    │   │   │   └── Settings.tsx
    │   │   ├── components/        # Reusable components
    │   │   │   └── BarcodeScanner.tsx
    │   │   ├── store.ts           # State management (Zustand)
    │   │   └── index.ts           # Export all pages/components
    │   └── package.json           # @zipybills/barcode-frontend
    │
    └── barcode-service/           # ⚙️ All backend code
        ├── service-interface/      # 📋 Contracts (Types & Validation)
        │   ├── src/
        │   │   ├── types.ts        # TypeScript interfaces
        │   │   ├── validation.ts   # Business logic
        │   │   └── index.ts        # Export all types
        │   └── package.json        # @zipybills/barcode-service-interface
        │
        └── service-runtime/        # 🚀 Implementation (Express API)
            ├── src/
            │   └── index.ts        # Express server, routes, DB
            ├── .env.example
            └── package.json        # @zipybills/barcode-service-runtime
```

---

## 🔄 How It Works: Complete Flow

### Step 1: Feature Exports Components/Pages

**features/barcode-feature/barcode-frontend/src/index.ts:**
```tsx
// Export all pages (for apps to consume)
export { default as DashboardPage } from './pages/Dashboard';
export { default as ScannerPage } from './pages/Scanner';
export { default as HistoryPage } from './pages/History';
export { default as SettingsPage } from './pages/Settings';

// Export store (for state management)
export * from './store';

// Export components (for reuse)
export { default as BarcodeScanner } from './components/BarcodeScanner';
```

### Step 2: App Imports and Uses Feature

**apps/barcode-scanner/web/src/configs/navigation-config.tsx:**
```tsx
import { lazy } from 'react';

export const routeConfig = [
  {
    Component: lazy(() => 
      import('@zipybills/barcode-frontend').then(m => ({ 
        default: m.DashboardPage    // ⬅️ Imported from feature!
      }))
    ),
    path: 'dashboard',
  },
  {
    Component: lazy(() => 
      import('@zipybills/barcode-frontend').then(m => ({ 
        default: m.ScannerPage     // ⬅️ Imported from feature!
      }))
    ),
    path: 'scanner',
  },
];
```

### Step 3: App Sets Up Routes

**apps/barcode-scanner/web/src/App.tsx:**
```tsx
function ShellLayout() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/" element={<AppLayout />}>
        {routeConfig.map(({ Component, path }) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Component />  {/* ⬅️ Feature component renders here! */}
              </Suspense>
            }
          />
        ))}
      </Route>
    </Routes>
  );
}
```

---

## 🎨 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER REQUEST                            │
│                   http://localhost:3001/scanner                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  apps/barcode-scanner/web/                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  App.tsx - React Router                                  │   │
│  │  - Reads navigation-config.tsx                           │   │
│  │  - Matches /scanner route                                │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │ Lazy loads component from feature
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              features/barcode-feature/barcode-frontend/          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  index.ts                                                │   │
│  │  export { default as ScannerPage } from './pages/Scanner'│   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  pages/Scanner.tsx                                       │   │
│  │  - Uses BarcodeScanner component                        │   │
│  │  - Uses useBarcodeStore (Zustand)                       │   │
│  │  - Calls validation from service-interface              │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │ Uses types & validation
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│       features/barcode-feature/barcode-service/                  │
│                   service-interface/                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  types.ts - TypeScript interfaces                        │   │
│  │  validation.ts - Business rules                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  If database mode enabled, also calls:                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  service-runtime/                                         │   │
│  │  - Express API (port 3002)                               │   │
│  │  - SQL Server connection                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Dependency Flow

```
apps/barcode-scanner/web/package.json
  ↓ depends on
features/barcode-feature/barcode-frontend/package.json
  ↓ depends on
features/barcode-feature/barcode-service/service-interface/package.json

ALSO:

features/barcode-feature/barcode-service/service-runtime/package.json
  ↓ depends on
features/barcode-feature/barcode-service/service-interface/package.json
```

**In package.json:**
```json
{
  "dependencies": {
    "@zipybills/barcode-frontend": "workspace:*",
    "@zipybills/barcode-service-interface": "workspace:*"
  }
}
```

The `workspace:*` protocol tells pnpm to link to local packages in the monorepo.

---

## 🎯 Key Benefits

### 1. **Code Reusability**
```tsx
// Same feature used in BOTH web and mobile apps
apps/barcode-scanner/web/    // ← Uses @zipybills/barcode-frontend
apps/barcode-scanner/mobile/ // ← Uses @zipybills/barcode-frontend

// Single source of truth!
features/barcode-feature/barcode-frontend/
```

### 2. **Independent Development**
```
Team A works on: features/barcode-feature/
Team B works on: features/inventory-feature/
Team C works on: features/payment-feature/

They don't interfere with each other!
```

### 3. **Type Safety Across Stack**
```tsx
// Frontend and Backend share same types!
features/barcode-feature/barcode-service/service-interface/
  └── types.ts  ← Shared by both frontend and backend

// Frontend knows exact API contracts
import { ProcessMachineRequest } from '@zipybills/barcode-service-interface';

// Backend uses same types
import { ProcessMachineRequest } from '@zipybills/barcode-service-interface';
```

### 4. **Easy Testing**
```bash
# Test feature in isolation
cd features/barcode-feature/barcode-frontend
pnpm test

# No need to run entire app
```

---

## 📋 Real Example: QXO Orders Feature

```
features/orders-feature/
├── orders-frontend-feature/      # React components, pages, queries
│   ├── src/
│   │   ├── OrdersRoutes.tsx      # Main route component
│   │   ├── pages/
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   └── OrderReportPage.tsx
│   │   ├── stores/               # Zustand stores
│   │   ├── queries/              # React Query hooks
│   │   └── components/           # Reusable components
│   └── package.json              # @qxo-monorepo/orders-feature-frontend
│
└── orders-service/
    ├── service-interface/         # OpenAPI spec, generated types
    │   └── openapi-spec/
    └── service-runtime/          # NestJS backend
        └── src/
```

**How nova app uses it:**
```tsx
// apps/nova/web/src/configs/navigation-config.tsx
{
  Component: lazy(loadQxoSharedReactComponent("orders", "OrdersRoutes")),
  path: "orders/*",
}

// This loads: features/orders-feature/orders-frontend-feature/OrdersRoutes.tsx
```

---

## 🔍 Feature Types in Your Repo

### 1. **Shared Utilities** (No frontend/backend split)
```
features/utils-feature/      # Helper functions
features/auth-feature/       # Authentication
features/i18n-feature/       # Internationalization
features/state-feature/      # Global state
```

### 2. **Full-Stack Features** (Frontend + Backend)
```
features/barcode-feature/
  ├── barcode-frontend/      # UI
  └── barcode-service/       # API
      ├── service-interface/
      └── service-runtime/
```

### 3. **Build/Shared Config** (Development tools)
```
features/build-shared/       # Build configurations
features/frontend-shared/    # Shared UI components
```

---

## 🚀 Adding a New Feature

### Step 1: Create Feature Structure
```bash
mkdir -p features/payment-feature/payment-frontend/src/pages
mkdir -p features/payment-feature/payment-service/service-interface/src
mkdir -p features/payment-feature/payment-service/service-runtime/src
```

### Step 2: Create package.json Files
```json
// features/payment-feature/payment-frontend/package.json
{
  "name": "@zipybills/payment-frontend",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@zipybills/payment-service-interface": "workspace:*"
  }
}
```

### Step 3: Create Pages/Components
```tsx
// features/payment-feature/payment-frontend/src/pages/PaymentPage.tsx
export default function PaymentPage() {
  return <div>Payment Page</div>;
}

// features/payment-feature/payment-frontend/src/index.ts
export { default as PaymentPage } from './pages/PaymentPage';
```

### Step 4: Use in App
```tsx
// apps/app2/web/src/configs/navigation-config.tsx
{
  Component: lazy(() => 
    import('@zipybills/payment-frontend').then(m => ({ 
      default: m.PaymentPage 
    }))
  ),
  path: 'payment',
}
```

---

## 📝 Summary

| Location | Purpose | Contains | Used By |
|----------|---------|----------|---------|
| **apps/** | Routing shells | Navigation, Layout, Entry | End users |
| **features/*-frontend** | UI implementation | Pages, Components, State | apps/web, apps/mobile |
| **features/*-service/service-interface** | Contracts | Types, Validation | Frontend & Backend |
| **features/*-service/service-runtime** | API implementation | Express/NestJS, DB | Frontend via HTTP |

**Golden Rule:** 
- Apps = Thin routing layer
- Features = All the actual code
- This allows features to be reused across multiple apps!

---

## 🎓 Think of it like this:

```
APPS are like HOUSES 🏠
  - Just the structure and routing (hallways, doors)
  - Minimal code

FEATURES are like FURNITURE 🪑
  - Actual functionality and logic
  - Can be moved between houses (apps)
  - Shared across multiple rooms (routes)
```

When you build a new app, you're just creating a new house and choosing which furniture (features) to put in it!
