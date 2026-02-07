# 🏗️ Nested Micro-Frontend/Micro-Service Architecture

## 🎯 Core Concept

Each **main feature** (like `barcode-feature`) contains multiple **sub-features** that can be developed, deployed, and scaled **independently**.

```
Think of it as: DOMAIN → SUB-FEATURES → SERVICES
```

---

## 📁 Nested Structure

```
features/
└── barcode-feature/                    # 🎯 Main Feature Domain
    ├── scanning/                       # 📷 Sub-feature: Camera Scanning
    │   ├── scanning-frontend/          # React UI
    │   │   ├── src/
    │   │   │   ├── ScanningRoutes.tsx  # Route component
    │   │   │   ├── pages/
    │   │   │   │   └── ScannerPage.tsx
    │   │   │   └── index.ts            # Exports
    │   │   └── package.json            # @zipybills/barcode-scanning-frontend
    │   │
    │   └── scanning-service/           # Backend API
    │       ├── service-interface/      # Types & Contracts
    │       │   ├── src/types.ts
    │       │   └── package.json        # @zipybills/barcode-scanning-service-interface
    │       │
    │       └── service-runtime/        # Express Server
    │           ├── src/index.ts        # Port 3003
    │           └── package.json        # @zipybills/barcode-scanning-service-runtime
    │
    ├── orders/                         # 📦 Sub-feature: Order Management
    │   ├── orders-frontend/            # React UI
    │   │   ├── src/
    │   │   │   ├── OrdersRoutes.tsx
    │   │   │   ├── pages/
    │   │   │   │   ├── DashboardPage.tsx
    │   │   │   │   └── HistoryPage.tsx
    │   │   │   └── index.ts
    │   │   └── package.json            # @zipybills/barcode-orders-frontend
    │   │
    │   └── orders-service/             # Backend API
    │       ├── service-interface/      # Types
    │       │   └── package.json        # @zipybills/barcode-orders-service-interface
    │       │
    │       └── service-runtime/        # Express Server
    │           ├── src/index.ts        # Port 3004
    │           └── package.json        # @zipybills/barcode-orders-service-runtime
    │
    ├── inventory/                      # 📊 Sub-feature: Inventory Management
    │   ├── inventory-frontend/         # React UI
    │   │   └── package.json            # @zipybills/barcode-inventory-frontend
    │   │
    │   └── inventory-service/          # Backend API
    │       ├── service-interface/      # @zipybills/barcode-inventory-service-interface
    │       └── service-runtime/        # Port 3005
    │
    └── settings/                       # ⚙️ Sub-feature: Settings
        └── settings-frontend/          # React UI (no backend needed)
            └── package.json            # @zipybills/barcode-settings-frontend
```

---

## 🎨 Visual Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    BARCODE FEATURE DOMAIN                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│
│  │  SCANNING   │  │   ORDERS    │  │ INVENTORY   │  │ SETTINGS ││
│  │ Sub-Feature │  │ Sub-Feature │  │ Sub-Feature │  │Sub-Feature││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬────┘│
│         │                │                │                │      │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐       │      │
│  │  Frontend   │  │  Frontend   │  │  Frontend   │  ┌────▼────┐ │
│  │ (React UI)  │  │ (React UI)  │  │ (React UI)  │  │Frontend │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────┘ │
│         │                │                │                       │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐              │
│  │   Service   │  │   Service   │  │   Service   │              │
│  │  Port 3003  │  │  Port 3004  │  │  Port 3005  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ Apps import sub-features
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                  apps/barcode-scanner/web/                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  navigation-config.tsx                                      │  │
│  │  - Imports from @zipybills/barcode-scanning-frontend       │  │
│  │  - Imports from @zipybills/barcode-orders-frontend         │  │
│  │  - Imports from @zipybills/barcode-inventory-frontend      │  │
│  │  - Imports from @zipybills/barcode-settings-frontend       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Benefits

### 1. **Independent Scaling**
Each service runs on its own port and can be scaled independently:

```bash
# Scale scanning service (heavy camera processing)
docker run -p 3003:3003 barcode-scanning-service --replicas 5

# Scale orders service (high traffic)
docker run -p 3004:3004 barcode-orders-service --replicas 10

# Keep inventory service small (low traffic)
docker run -p 3005:3005 barcode-inventory-service --replicas 1
```

### 2. **Team Independence**
Different teams can work on different sub-features:

```
Team A → features/barcode-feature/scanning/
Team B → features/barcode-feature/orders/
Team C → features/barcode-feature/inventory/
Team D → features/barcode-feature/settings/
```

**No conflicts! Each team has their own:**
- Package namespace
- API port
- Repository space
- Deployment pipeline

### 3. **Technology Flexibility**
Each service can use different tech stacks:

```
scanning-service/     → Express + WebSockets (real-time scanning)
orders-service/       → NestJS + PostgreSQL (complex business logic)
inventory-service/    → Express + Redis (fast caching)
```

### 4. **Incremental Development**
Build features one at a time:

```
Week 1: Create scanning/ sub-feature
Week 2: Add orders/ sub-feature
Week 3: Add inventory/ sub-feature
Week 4: Add settings/ sub-feature
```

---

## 🚀 How Apps Consume Sub-Features

### Step 1: App Declares Dependencies

**apps/barcode-scanner/web/package.json:**
```json
{
  "dependencies": {
    "@zipybills/barcode-scanning-frontend": "workspace:*",
    "@zipybills/barcode-orders-frontend": "workspace:*",
    "@zipybills/barcode-inventory-frontend": "workspace:*",
    "@zipybills/barcode-settings-frontend": "workspace:*"
  }
}
```

### Step 2: App Imports Pages from Sub-Features

**apps/barcode-scanner/web/src/configs/navigation-config.tsx:**
```tsx
import { lazy } from 'react';

export const routeConfig = [
  {
    Component: lazy(() => 
      import('@zipybills/barcode-scanning-frontend')
        .then(m => ({ default: m.ScannerPage }))
    ),
    path: 'scanner',
  },
  {
    Component: lazy(() => 
      import('@zipybills/barcode-orders-frontend')
        .then(m => ({ default: m.DashboardPage }))
    ),
    path: 'dashboard',
  },
  {
    Component: lazy(() => 
      import('@zipybills/barcode-inventory-frontend')
        .then(m => ({ default: m.InventoryListPage }))
    ),
    path: 'inventory',
  },
];
```

### Step 3: Services Run Independently

```bash
# Terminal 1: Scanning Service
cd features/barcode-feature/scanning/scanning-service/service-runtime
pnpm dev  # Runs on port 3003

# Terminal 2: Orders Service
cd features/barcode-feature/orders/orders-service/service-runtime
pnpm dev  # Runs on port 3004

# Terminal 3: Inventory Service
cd features/barcode-feature/inventory/inventory-service/service-runtime
pnpm dev  # Runs on port 3005

# Terminal 4: Web App
cd apps/barcode-scanner/web
pnpm dev  # Runs on port 3001, talks to all services
```

---

## 🔄 Communication Between Sub-Features

### Frontend-to-Frontend (Shared State)
Use Zustand stores that are shared:

```tsx
// features/barcode-feature/scanning/scanning-frontend/src/store.ts
export const useScanningStore = create((set) => ({
  lastScan: null,
  setLastScan: (barcode) => set({ lastScan: barcode }),
}));

// features/barcode-feature/orders/orders-frontend/src/components/OrderForm.tsx
import { useScanningStore } from '@zipybills/barcode-scanning-frontend';

function OrderForm() {
  const lastScan = useScanningStore((s) => s.lastScan);
  // Use scanned barcode in order form
}
```

### Service-to-Service (API Calls)
Services can call each other:

```typescript
// orders-service calls scanning-service to validate barcode
async function createOrder(barcodes: string[]) {
  // Validate barcodes via scanning service
  const validation = await fetch('http://localhost:3003/api/validate', {
    method: 'POST',
    body: JSON.stringify({ barcodes }),
  });
  
  if (!validation.ok) throw new Error('Invalid barcodes');
  
  // Create order
  return saveOrder(barcodes);
}
```

---

## 📦 Naming Convention

```
@zipybills/barcode-{sub-feature}-{type}

Examples:
@zipybills/barcode-scanning-frontend
@zipybills/barcode-scanning-service-interface
@zipybills/barcode-scanning-service-runtime

@zipybills/barcode-orders-frontend
@zipybills/barcode-orders-service-interface
@zipybills/barcode-orders-service-runtime
```

**Pattern:**
- `{domain}-{sub-feature}-{type}`
- Domain: `barcode`, `payment`, `shipping`, etc.
- Sub-feature: `scanning`, `orders`, `inventory`, etc.
- Type: `frontend`, `service-interface`, `service-runtime`

---

## 🎯 When to Create a New Sub-Feature

Create a new sub-feature when:

✅ **Independent Business Logic**
```
scanning → Handles camera and barcode reading
orders → Handles order creation and tracking
inventory → Handles stock management
```

✅ **Different Scaling Needs**
```
scanning → CPU intensive (need more compute)
orders → Database intensive (need more DB connections)
inventory → Cache intensive (need more memory)
```

✅ **Different Teams**
```
Team A focuses on scanning
Team B focuses on orders
```

✅ **Different Deployment Schedules**
```
Deploy scanning updates daily
Deploy orders updates weekly
```

---

## 🏗️ Adding a New Sub-Feature

### Example: Adding a "Reports" Sub-Feature

```bash
# 1. Create structure
mkdir -p features/barcode-feature/reports/reports-frontend/src
mkdir -p features/barcode-feature/reports/reports-service/service-interface/src
mkdir -p features/barcode-feature/reports/reports-service/service-runtime/src

# 2. Create package.json files
cd features/barcode-feature/reports/reports-frontend
cat > package.json << 'EOF'
{
  "name": "@zipybills/barcode-reports-frontend",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@zipybills/barcode-reports-service-interface": "workspace:*",
    "react": "catalog:"
  }
}
EOF

# 3. Create components/pages
# features/barcode-feature/reports/reports-frontend/src/pages/ReportsPage.tsx

# 4. Create service
# features/barcode-feature/reports/reports-service/service-runtime/src/index.ts
# Port: 3006

# 5. Update app to use it
# apps/barcode-scanner/web/package.json - add dependency
# apps/barcode-scanner/web/src/configs/navigation-config.tsx - add route
```

---

## 📊 Comparison: Flat vs Nested

### ❌ Flat Structure (Old Way)
```
features/
├── barcode-feature/
│   ├── barcode-frontend/    # ALL UI in one package
│   └── barcode-service/     # ALL backend in one package
```

**Problems:**
- Single monolithic frontend
- Single monolithic backend
- Can't scale parts independently
- Teams step on each other
- Deploy everything together

### ✅ Nested Structure (New Way)
```
features/
└── barcode-feature/
    ├── scanning/
    │   ├── scanning-frontend/    # Just scanning UI
    │   └── scanning-service/     # Just scanning API
    ├── orders/
    │   ├── orders-frontend/      # Just orders UI
    │   └── orders-service/       # Just orders API
    └── inventory/
        ├── inventory-frontend/   # Just inventory UI
        └── inventory-service/    # Just inventory API
```

**Benefits:**
- Each sub-feature is small and focused
- Scale each service independently
- Teams work in parallel
- Deploy sub-features independently
- Easy to understand and maintain

---

## 🎓 Real-World Example: E-Commerce

```
features/
└── ecommerce-feature/              # Main domain
    ├── products/                   # Product catalog
    │   ├── products-frontend/      # Product listing, search, details
    │   └── products-service/       # Product CRUD, inventory
    │       ├── service-interface/
    │       └── service-runtime/    # Port 4001
    │
    ├── cart/                       # Shopping cart
    │   ├── cart-frontend/          # Cart UI, add/remove items
    │   └── cart-service/           # Cart state, pricing
    │       ├── service-interface/
    │       └── service-runtime/    # Port 4002
    │
    ├── checkout/                   # Order placement
    │   ├── checkout-frontend/      # Payment forms, address
    │   └── checkout-service/       # Payment processing, order creation
    │       ├── service-interface/
    │       └── service-runtime/    # Port 4003
    │
    └── reviews/                    # Product reviews
        ├── reviews-frontend/       # Review list, rating
        └── reviews-service/        # Review CRUD, moderation
            ├── service-interface/
            └── service-runtime/    # Port 4004
```

**Each sub-feature:**
- Has its own database tables
- Has its own API endpoints
- Can be deployed independently
- Can be scaled independently
- Can be developed by different teams

---

## 📝 Summary

| Level | Purpose | Example | Ports |
|-------|---------|---------|-------|
| **Feature** | Business domain | `barcode-feature` | - |
| **Sub-Feature** | Specific functionality | `scanning`, `orders` | - |
| **Frontend** | UI for sub-feature | `scanning-frontend` | - |
| **Service** | Backend for sub-feature | `scanning-service` | 3003, 3004, 3005 |

**Golden Rule:**
```
Feature = Domain
Sub-Feature = Micro-Frontend + Micro-Service
Each Sub-Feature = Independently Scalable
```

This architecture gives you:
- **Micro-Frontends**: Small, focused React apps
- **Micro-Services**: Small, focused APIs
- **Independent Scaling**: Scale what you need
- **Team Autonomy**: Teams work independently
- **Gradual Development**: Build features incrementally
