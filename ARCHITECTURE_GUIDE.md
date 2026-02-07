# 🏗️ Architecture Guide: Generated SDKs + Feature Flags

**Last Updated:** February 7, 2026

This guide explains our modern architectural patterns for building features in the zipybills monorepo.

---

## 📚 Table of Contents

1. [Why Generated SDKs?](#why-generated-sdks)
2. [Using Generated SDK Functions](#using-generated-sdk-functions)
3. [Feature Flags System](#feature-flags-system)
4. [Feature-Based Development](#feature-based-development)
5. [Complete Example](#complete-example)
6. [Best Practices](#best-practices)

---

## Why Generated SDKs?

### ❌ Don't Write Manual API Clients!

We **DON'T** maintain manual API client wrappers like this:

```typescript
// ❌ BAD: Manual wrapper that duplicates SDK functionality
class MachinesApiClient {
  async getMachines() {
    const response = await fetch(`${this.baseUrl}/api/machines`);
    return response.json();
  }
}
```

### ✅ Use OpenAPI-Generated SDKs Instead!

**Why?**
- ✅ **Type-safe** - Auto-generated TypeScript types
- ✅ **Always in sync** - Regenerate from OpenAPI spec when API changes
- ✅ **Zero maintenance** - No manual client code to maintain
- ✅ **Single source of truth** - Backend OpenAPI spec drives everything
- ✅ **Better DX** - IDE autocomplete, type checking

**How it works:**
1. Backend defines `openapi.yml` specification
2. Run `pnpm build` to generate TypeScript SDK
3. Import and use SDK functions directly

---

## Using Generated SDK Functions

### Available SDKs

#### 1. Machines Service SDK
**Package:** `@zipybills/barcode-machines-service-interface`

```typescript
import { 
  getAllMachines, 
  getMachineById,
  createMachine, 
  updateMachine, 
  deleteMachine,
  type Machine 
} from '@zipybills/barcode-machines-service-interface';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';
```

#### 2. Scanning Service SDK
**Package:** `@zipybills/barcode-scanning-service-interface`

```typescript
import { 
  generateBarcode, 
  scanBarcode, 
  getBarcodeHistory, 
  getDashboard 
} from '@zipybills/barcode-scanning-service-interface';
import { createConfig } from '@zipybills/barcode-scanning-service-interface/dist/client';
```

### Basic Usage Pattern

```typescript
import { getAllMachines } from '@zipybills/barcode-machines-service-interface';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';

const fetchMachines = async () => {
  try {
    const response = await getAllMachines({
      client: createConfig({ 
        baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
      })
    });
    
    const machines = response.data?.machines || [];
    console.log('Fetched machines:', machines);
  } catch (error) {
    console.error('Failed to fetch machines:', error);
  }
};
```

### CRUD Operations Examples

#### GET All Machines
```typescript
const response = await getAllMachines({
  client: createConfig({ baseUrl: 'http://localhost:3006' })
});
const machines = response.data?.machines || [];
```

#### GET Machine by ID
```typescript
const response = await getMachineById({
  client: createConfig({ baseUrl: 'http://localhost:3006' }),
  path: { id: 1 }
});
const machine = response.data?.machine;
```

#### CREATE Machine
```typescript
await createMachine({
  client: createConfig({ baseUrl: 'http://localhost:3006' }),
  body: {
    machine_name: 'Machine 6',
    machine_code: 'M6',
    sequence_order: 6,
    description: 'New processing station',
    can_generate_barcode: false
  }
});
```

#### UPDATE Machine
```typescript
await updateMachine({
  client: createConfig({ baseUrl: 'http://localhost:3006' }),
  path: { id: 1 },
  body: {
    machine_name: 'Updated Machine Name',
    is_active: true
  }
});
```

#### DELETE Machine (Soft Delete)
```typescript
await deleteMachine({
  client: createConfig({ baseUrl: 'http://localhost:3006' }),
  path: { id: 1 }
});
```

### Scanning Operations Examples

#### Generate Barcode
```typescript
import { generateBarcode } from '@zipybills/barcode-scanning-service-interface';
import { createConfig } from '@zipybills/barcode-scanning-service-interface/dist/client';

const response = await generateBarcode({
  client: createConfig({ baseUrl: 'http://localhost:3003' }),
  body: { machine_id: 1 }
});
const barcode = response.data?.barcode;
```

#### Scan Barcode
```typescript
const response = await scanBarcode({
  client: createConfig({ baseUrl: 'http://localhost:3003' }),
  body: {
    barcode: 'BCT20260207-001',
    machine_id: 2,
    parameters: {
      temperature: '25.5',
      pressure: '105.2',
      timestamp: new Date().toISOString()
    }
  }
});
```

---

## Feature Flags System

### Setup

**Package:** `@zipybills/feature-flags`

```typescript
import { useFeatureFlag } from '@zipybills/feature-flags';
```

### Available Flags

```typescript
'barcode.scanning'        // Barcode scanning feature
'barcode.generation'      // Barcode generation feature
'barcode.history'         // Barcode history viewing
'barcode.machines'        // Machine management
'analytics.dashboard'     // Analytics dashboard
'notifications.push'      // Push notifications
'offline.mode'            // Offline mode support
```

### Usage in Components

#### React Native Components
```typescript
import { useFeatureFlag } from '@zipybills/feature-flags';

function ScannerPage() {
  const scanningEnabled = useFeatureFlag('barcode.scanning');
  const generationEnabled = useFeatureFlag('barcode.generation');
  
  if (!scanningEnabled) {
    return (
      <View>
        <Text>⚠️ Scanning feature is currently disabled</Text>
      </View>
    );
  }
  
  return (
    <View>
      {generationEnabled && (
        <Button title="Generate Barcode" onPress={handleGenerate} />
      )}
      {/* ... rest of component */}
    </View>
  );
}
```

#### Guard Specific Features
```typescript
const handleGenerate = async () => {
  if (!generationEnabled) {
    setError('Barcode generation feature is disabled');
    return;
  }
  
  // ... proceed with generation
};
```

### Environment Variables

Control features via environment variables:

```bash
# .env file
NEXT_PUBLIC_FEATURE_BARCODE_SCANNING=true
NEXT_PUBLIC_FEATURE_BARCODE_GENERATION=true
NEXT_PUBLIC_FEATURE_BARCODE_MACHINES=false
NEXT_PUBLIC_FEATURE_ANALYTICS_DASHBOARD=true
```

Format: `NEXT_PUBLIC_FEATURE_<FLAG_NAME>=true|false`

---

## Feature-Based Development

### Architectural Rules

**✅ DO:**
- **Features** contain all business logic, UI components, and call SDK functions
- **Apps** only handle routing and import feature pages
- Use generated SDK functions for all API calls
- Wrap features with feature flag guards
- Keep features independent and self-contained

**❌ DON'T:**
- Put business logic in apps
- Call `fetch()` directly in components
- Write manual API client wrappers when SDK exists
- Duplicate code between features

### Directory Structure

```
features/barcode-feature/
├── machines/
│   ├── machines-frontend/                    # UI Package
│   │   ├── src/
│   │   │   └── pages/
│   │   │       └── MachinesPage.tsx         # Uses SDK: getAllMachines(), createMachine()
│   │   └── package.json
│   │
│   ├── machines-service/
│   │   ├── service-interface/                # SDK Package
│   │   │   ├── openapi.yml                  # OpenAPI specification
│   │   │   ├── dist/
│   │   │   │   ├── index.ts                 # Generated SDK functions
│   │   │   │   ├── sdk.gen.ts
│   │   │   │   └── types.gen.ts
│   │   │   └── package.json
│   │   │
│   │   └── service-runtime/                  # Backend Service
│   │       └── src/index.ts
│   │
│   └── machines-database/                     # Database Config
│
└── scanning/
    ├── scanning-frontend/
    │   └── src/pages/
    │       └── ScannerPage.tsx               # Uses SDK: generateBarcode(), scanBarcode()
    │
    └── scanning-service/
        ├── service-interface/                 # SDK Package
        │   ├── openapi.yml
        │   └── dist/
        │
        └── service-runtime/                   # Backend Service

apps/barcode-scanner/                          # Thin Routing Layer
├── app/
│   ├── (tabs)/
│   │   ├── scanner.tsx                       # Just imports ScannerPage
│   │   └── machines.tsx                      # Just imports MachinesPage
│   └── _layout.tsx
```

---

## Complete Example

### Full ScannerPage Implementation

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getAllMachines, type Machine } from '@zipybills/barcode-machines-service-interface';
import { generateBarcode, scanBarcode } from '@zipybills/barcode-scanning-service-interface';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';
import { useFeatureFlag } from '@zipybills/feature-flags';

export default function ScannerPage() {
  // Feature flags
  const scanningEnabled = useFeatureFlag('barcode.scanning');
  const generationEnabled = useFeatureFlag('barcode.generation');
  
  // State
  const [machines, setMachines] = useState<Machine[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch machines using SDK
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await getAllMachines({
        client: createConfig({ 
          baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
        })
      });
      
      setMachines(response.data?.machines || []);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    }
  };

  // Generate barcode using SDK
  const handleGenerate = async () => {
    if (!generationEnabled) {
      alert('Barcode generation is disabled');
      return;
    }
    
    setLoading(true);
    try {
      const response = await generateBarcode({
        client: createConfig({ baseUrl: 'http://localhost:3003' }),
        body: { machine_id: 1 }
      });
      
      setBarcode(response.data?.barcode || '');
    } catch (error) {
      console.error('Failed to generate barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  // Feature flag guard
  if (!scanningEnabled) {
    return (
      <View style={styles.container}>
        <Text style={styles.disabledText}>
          ⚠️ Scanning feature is currently disabled
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📷 Barcode Scanner</Text>
      
      <TouchableOpacity onPress={handleGenerate} disabled={loading}>
        <Text>{loading ? 'Generating...' : '🎫 Generate Barcode'}</Text>
      </TouchableOpacity>
      
      {barcode && <Text>Generated: {barcode}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  disabledText: { fontSize: 18, color: '#ef4444', textAlign: 'center' },
});
```

---

## Best Practices

### ✅ DO

1. **Use Generated SDKs**
   ```typescript
   import { getAllMachines } from '@zipybills/barcode-machines-service-interface';
   const response = await getAllMachines({ client: createConfig({ baseUrl: '...' }) });
   ```

2. **Feature Flag Every Feature**
   ```typescript
   const enabled = useFeatureFlag('barcode.scanning');
   if (!enabled) return <DisabledMessage />;
   ```

3. **Handle Errors Properly**
   ```typescript
   try {
     await createMachine({ /* ... */ });
   } catch (error) {
     console.error('Failed:', error);
     alert('Operation failed');
   }
   ```

4. **Use Environment Variables**
   ```typescript
   baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006'
   ```

### ❌ DON'T

1. **Don't Use Direct fetch()**
   ```typescript
   // ❌ BAD
   const response = await fetch('http://localhost:3006/api/machines');
   ```

2. **Don't Write Manual Wrappers**
   ```typescript
   // ❌ BAD - SDK already exists!
   class MachinesApiClient {
     async getMachines() { /* ... */ }
   }
   ```

3. **Don't Hardcode URLs**
   ```typescript
   // ❌ BAD
   baseUrl: 'http://localhost:3006'
   
   // ✅ GOOD
   baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006'
   ```

4. **Don't Skip Feature Flags**
   ```typescript
   // ❌ BAD - No feature flag check
   function MyFeature() {
     return <View>...</View>;
   }
   ```

---

## Regenerating SDKs

When the backend API changes, regenerate the SDKs:

```bash
# Machines SDK
cd features/barcode-feature/machines/machines-service/service-interface
pnpm build

# Scanning SDK
cd features/barcode-feature/scanning/scanning-service/service-interface
pnpm build
```

The `build` script runs:
```json
{
  "scripts": {
    "build": "openapi-ts -i openapi.yml -o ./dist -c @hey-api/client-fetch"
  }
}
```

---

## Quick Reference

### Import Patterns

```typescript
// Machines SDK
import { 
  getAllMachines, 
  createMachine, 
  type Machine 
} from '@zipybills/barcode-machines-service-interface';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';

// Scanning SDK
import { 
  generateBarcode, 
  scanBarcode 
} from '@zipybills/barcode-scanning-service-interface';
import { createConfig } from '@zipybills/barcode-scanning-service-interface/dist/client';

// Feature Flags
import { useFeatureFlag } from '@zipybills/feature-flags';
```

### Function Call Pattern

```typescript
const response = await sdkFunction({
  client: createConfig({ baseUrl: 'http://localhost:3006' }),
  path: { id: 1 },           // For endpoints like /machines/:id
  body: { /* data */ }        // For POST/PUT requests
});

const data = response.data;    // Access response data
```

---

## 🎉 Summary

1. ✅ **Use generated SDK functions** - Never write manual API client wrappers
2. ✅ **Wrap features with feature flags** - Every feature should be toggleable
3. ✅ **Features contain all logic** - Apps only handle routing
4. ✅ **Regenerate SDKs when API changes** - Keep frontend in sync with backend

**Your architecture is now:**
- Type-safe ✅
- Maintainable ✅
- Feature-toggleable ✅
- Auto-generated ✅

🚀 **Ready to build!**
