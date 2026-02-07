# API Documentation Access

## 📚 OpenAPI Specifications Location

The barcode feature APIs are documented using OpenAPI 3.0.3 specifications:

### Machines Service API
- **Location**: `features/barcode-feature/machines/machines-service/service-interface/openapi.yml`
- **Base URL**: `http://localhost:3006`
- **Endpoints**:
  - `GET /api/machines` - Get all machines
  - `POST /api/machines` - Create new machine
  - `GET /api/machines/{id}` - Get machine by ID
  - `PUT /api/machines/{id}` - Update machine
  - `DELETE /api/machines/{id}` - Delete machine (soft delete)
  - `GET /health` - Health check

### Scanning Service API
- **Location**: `features/barcode-feature/scanning/scanning-service/service-interface/openapi.yml`
- **Base URL**: `http://localhost:3003`
- **Endpoints**:
  - `POST /api/barcode/generate` - Generate new barcode
  - `POST /api/scan` - Scan barcode at machine
  - `GET /api/barcode/{barcode}/history` - Get processing history
  - `GET /api/dashboard` - Get dashboard statistics

## 🔧 Generated TypeScript SDKs

JavaScript-native TypeScript client SDKs are auto-generated from OpenAPI specs:

### Machines Service SDK
- **Location**: `features/barcode-feature/machines/machines-service/service-interface/dist/`
- **Package**: `@zipybills/barcode-machines-service-interface`
- **Usage**:
  ```typescript
  import { getAllMachines, createMachine } from '@zipybills/barcode-machines-service-interface';
  
  // Fetch all machines
  const response = await getAllMachines({
    client: { baseUrl: 'http://localhost:3006' }
  });
  
  // Create machine
  const newMachine = await createMachine({
    client: { baseUrl: 'http://localhost:3006' },
    body: {
      machine_name: 'Machine 6',
      machine_code: 'M6',
      sequence_order: 6,
      description: 'New processing station'
    }
  });
  ```

### Scanning Service SDK
- **Location**: `features/barcode-feature/scanning/scanning-service/service-interface/dist/`
- **Package**: `@zipybills/barcode-scanning-service-interface`
- **Usage**:
  ```typescript
  import { generateBarcode, scanBarcode } from '@zipybills/barcode-scanning-service-interface';
  
  // Generate barcode
  const barcode = await generateBarcode({
    client: { baseUrl: 'http://localhost:3003' },
    body: { machine_id: 1 }
  });
  
  // Scan barcode
  const scan = await scanBarcode({
    client: { baseUrl: 'http://localhost:3003' },
    body: { barcode: 'BCT20260207-001', machine_id: 2 }
  });
  ```

## 📊 Viewing API Documentation

### Option 1: View OpenAPI YAML Files
You can directly open and read the OpenAPI spec files:
- [Machines Service OpenAPI Spec](features/barcode-feature/machines/machines-service/service-interface/openapi.yml)
- [Scanning Service OpenAPI Spec](features/barcode-feature/scanning/scanning-service/service-interface/openapi.yml)

### Option 2: Swagger UI (Recommended)
Install and run Swagger UI to visualize and test APIs interactively:

```bash
# Install swagger-ui-express in your service
cd features/barcode-feature/machines/machines-service/service-runtime
pnpm add swagger-ui-express @types/swagger-ui-express

# Add to your Express app:
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const swaggerDocument = parse(
  readFileSync('../service-interface/openapi.yml', 'utf8')
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

Then visit: `http://localhost:3006/api-docs`

### Option 3: Redoc
Alternative documentation viewer with cleaner UI:

```bash
pnpm add redoc-express

import { serve as redocServe, setup as redocSetup } from 'redoc-express';

app.use('/docs', redocServe, redocSetup(swaggerDocument));
```

### Option 4: VSCode Extension
Install "OpenAPI (Swagger) Editor" extension in VSCode:
1. Open Command Palette (`Cmd+Shift+P`)
2. Search "Extensions: Install Extensions"
3. Install "OpenAPI (Swagger) Editor"
4. Open any `openapi.yml` file to see rendered documentation

## 🔄 SDK Regeneration

When you modify the OpenAPI specs, regenerate SDKs:

```bash
# Regenerate machines service SDK
cd features/barcode-feature/machines/machines-service/service-interface
pnpm build

# Regenerate scanning service SDK
cd features/barcode-feature/scanning/scanning-service/service-interface
pnpm build
```

SDKs are automatically generated using `@hey-api/openapi-ts` (JavaScript-native, no Java required).

## ✅ Testing APIs

### cURL Examples

**Get all machines:**
```bash
curl http://localhost:3006/api/machines
```

**Create machine:**
```bash
curl -X POST http://localhost:3006/api/machines \
  -H "Content-Type: application/json" \
  -d '{
    "machine_name": "Machine 6",
    "machine_code": "M6",
    "sequence_order": 6,
    "description": "Testing"
  }'
```

**Generate barcode:**
```bash
curl -X POST http://localhost:3003/api/barcode/generate \
  -H "Content-Type: application/json" \
  -d '{"machine_id": 1}'
```

**Scan barcode:**
```bash
curl -X POST http://localhost:3003/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "BCT20260207-001",
    "machine_id": 2
  }'
```

**Get dashboard stats:**
```bash
curl http://localhost:3003/api/dashboard
```

## 📝 API Standards

All future APIs should follow this pattern:
1. ✅ **OpenAPI Spec First** - Define API contract in `openapi.yml`
2. ✅ **TypeScript SDK Generation** - Auto-generate with `@hey-api/openapi-ts`
3. ✅ **Type Safety** - Use generated SDKs in frontend instead of manual fetch()
4. ✅ **Documentation** - OpenAPI spec serves as living documentation
5. ✅ **React Query Integration** - Wrap SDK calls in React Query hooks for caching and state management
