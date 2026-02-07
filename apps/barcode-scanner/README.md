# Barcode Scanner Application - Quick Start

## Structure Overview

```
apps/barcode-scanner/
├── web/          # Web routing shell
└── mobile/       # Mobile routing shell

features/barcode-feature/
├── barcode-frontend/     # React components, pages, store
└── barcode-service/      # Backend API
    ├── service-interface/  # Types & validation
    └── service-runtime/    # Express server
```

## Running the Application

### Web Application

```bash
# Install dependencies (first time only)
pnpm install

# Run web app
cd apps/barcode-scanner/web
pnpm dev
```

Access at: `http://localhost:3001`

### Backend API (Optional - for database mode)

```bash
cd features/barcode-feature/barcode-service/service-runtime
cp .env.example .env
# Edit .env with your SQL Server credentials
pnpm dev
```

API runs at: `http://localhost:3002`

### Mobile App

```bash
cd apps/barcode-scanner/mobile
pnpm start
```

## Key Points

- **Apps** = Routing only (navigation-config.tsx, App.tsx, layout)
- **Features** = All implementation (components, pages, logic, API)
- This allows reusing features across web/mobile apps
- Follow qxo-monorepo pattern for consistency

## Adding New Features

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.
