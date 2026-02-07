# 🧪 Testing & Demo Guide — FactoryOS

## Table of Contents

- [Quick Start](#quick-start)
- [Running the Services](#running-the-services)
- [API Testing](#api-testing)
- [Web App Testing](#web-app-testing)
- [Mobile App Testing](#mobile-app-testing)
- [Feature Generator Demo](#feature-generator-demo)
- [Client Demo Script](#client-demo-script)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Make sure PostgreSQL is running with database "factory_os"
psql -c "CREATE DATABASE factory_os;" 2>/dev/null || true

# 3. Start everything (API + Web + Mobile Metro)
pnpm dev
```

This starts three processes concurrently:

| Service       | URL                        | Purpose                      |
| ------------- | -------------------------- | ---------------------------- |
| API Gateway   | `http://localhost:4000`    | Express REST API (PostgreSQL)|
| Web App       | `http://localhost:8081`    | Expo Web (browser)           |
| Mobile Metro  | `http://localhost:8082`    | React Native Metro bundler   |

---

## Running the Services

### All at once

```bash
pnpm dev           # API + Web + Mobile (default)
```

### Individual services

```bash
pnpm dev:factory-api       # API Gateway only (port 4000)
pnpm dev:factory-web       # Expo Web only (port 8081)
pnpm dev:factory-mobile    # Metro bundler only (port 8082)
pnpm dev:factory-ios       # iOS simulator
pnpm dev:factory-android   # Android emulator
```

---

## API Testing

### Automated smoke test

The quickest way to verify all API endpoints:

```bash
# Start the API first (if not already running)
pnpm dev:factory-api &

# Run smoke tests
pnpm smoke-test
```

Expected output:

```
🧪 FactoryOS API Smoke Tests

   Waiting for API on port 4000...
   ✅ API is up!

  ✅ Health:     FactoryOS API Gateway
  ✅ Login:      role=ADMIN
  ✅ Machines:   0 records
  ✅ Shifts:     3 records
  ✅ Plans:      0 records
  ✅ Dashboard:  machines=0, operators=0
  ✅ Downtime:   0 records
  ✅ Reports:    0 rows
  ✅ Users:      1 users

   Result: 9 passed, 0 failed
   🎉 All API endpoints responding!
```

### Manual API testing with curl

```bash
# Health check
curl http://localhost:4000/api/health | jq

# Login (get JWT token)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"

# List machines
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/machines | jq

# Create a machine
curl -X POST http://localhost:4000/api/machines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_code": "MC-001",
    "machine_name": "CNC Lathe 1",
    "department": "Production",
    "machine_type": "CNC",
    "status": "ACTIVE"
  }' | jq

# List shifts
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/shifts | jq

# Create a production plan
curl -X POST http://localhost:4000/api/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "shift_id": 1,
    "plan_date": "'$(date +%Y-%m-%d)'",
    "product_name": "Widget A",
    "product_code": "WA-001",
    "target_quantity": 100
  }' | jq

# View dashboard
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/dashboard | jq

# Production report
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/reports/production?start_date=$(date +%Y-%m-%d)&end_date=$(date +%Y-%m-%d)" | jq

# Machine-wise report
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/reports/machine-wise?start_date=$(date +%Y-%m-%d)&end_date=$(date +%Y-%m-%d)" | jq
```

### Using Postman or Insomnia

Import these endpoints into your API client:

| Method | Endpoint                          | Auth     | Description           |
| ------ | --------------------------------- | -------- | --------------------- |
| GET    | `/api/health`                     | None     | Health check          |
| POST   | `/api/auth/login`                 | None     | Login, returns JWT    |
| POST   | `/api/auth/register`              | Bearer   | Register a user       |
| GET    | `/api/machines`                   | Bearer   | List machines         |
| POST   | `/api/machines`                   | Bearer   | Create a machine      |
| PATCH  | `/api/machines/:id`               | Bearer   | Update a machine      |
| GET    | `/api/shifts`                     | Bearer   | List shifts           |
| GET    | `/api/plans`                      | Bearer   | List production plans |
| POST   | `/api/plans`                      | Bearer   | Create a plan         |
| PATCH  | `/api/plans/:id/status`           | Bearer   | Update plan status    |
| POST   | `/api/plans/:id/log`              | Bearer   | Log production entry  |
| GET    | `/api/dashboard`                  | Bearer   | Dashboard summary     |
| GET    | `/api/downtime`                   | Bearer   | Downtime logs         |
| POST   | `/api/downtime`                   | Bearer   | Log downtime          |
| GET    | `/api/reports/production`         | Bearer   | Production report     |
| GET    | `/api/reports/machine-wise`       | Bearer   | Machine-wise report   |
| GET    | `/api/reports/shift-wise`         | Bearer   | Shift-wise report     |
| GET    | `/api/users`                      | Bearer   | List users (admin)    |

**Default login credentials:** `admin` / `admin123`

---

## Web App Testing

1. Start the web app: `pnpm dev:factory-web` (or `pnpm dev` for all)
2. Open `http://localhost:8081` in your browser
3. Login with `admin` / `admin123`
4. Navigate through the tabs: Dashboard → Machines → Shifts → Planning → Downtime → Reports

### What to verify

- [ ] Login screen loads and accepts credentials
- [ ] Dashboard shows summary stats (totals, active counts)
- [ ] Machines page lists machines, can add/edit
- [ ] Shifts page shows default shifts (Morning, Afternoon, Night)
- [ ] Planning page creates production plans, shows actual vs target
- [ ] Downtime page logs downtime events
- [ ] Reports page shows production/machine/shift reports with date filters

---

## Mobile App Testing

### iOS Simulator

```bash
pnpm dev:factory-ios
```

### Android Emulator

```bash
pnpm dev:factory-android
```

### Expo Go (physical device)

1. Run `pnpm dev:factory-mobile`
2. Scan the QR code from terminal with the Expo Go app
3. The app connects to your local API (update `API_BASE_URL` if needed)

### What to verify

- Same checklist as Web App above — the codebase is shared via features/frontend packages

---

## Feature Generator Demo

Show how quickly a new feature can be scaffolded:

```bash
# Interactive mode (prompts for feature name)
pnpm generate-feature

# Non-interactive mode
pnpm generate-feature -- --name inventory
```

This creates **3 packages** with **13 files**:

```
features/
└── inventory/
    ├── inventory-service/
    │   ├── service-interface/     ← TypeScript types & interfaces
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       └── index.ts
    │   └── service-runtime/       ← Express router & DB operations
    │       ├── package.json
    │       ├── tsconfig.json
    │       └── src/
    │           ├── index.ts
    │           ├── router.ts
    │           └── database.ts
    └── inventory-frontend/        ← React Native page & API client
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── InventoryPage.tsx
            └── api.ts
```

After generation, follow the printed next-steps to wire it into the app.

---

## Client Demo Script

Follow this sequence for a compelling 10-minute demo:

### 1. Architecture Overview (2 min)

> "This is a production-grade monorepo built with TypeScript, using a micro-feature architecture.
> Each feature — machines, shifts, planning, downtime, reports — is its own independent package
> with clear boundaries: types, API logic, and frontend UI."

Show the folder structure:

```bash
ls features/
```

### 2. Start Everything (1 min)

```bash
pnpm dev
```

> "One command starts the API server, web app, and mobile bundler concurrently."

### 3. API Health Check (1 min)

```bash
pnpm smoke-test
```

> "We have automated smoke tests that verify all 9 API endpoint groups are responding.
> This runs as part of our CI pipeline."

### 4. Live Web Demo (4 min)

Open `http://localhost:8081` in browser:

1. **Login** → `admin` / `admin123`
2. **Dashboard** → "Real-time factory overview — machine count, operator count, status summary"
3. **Machines** → Add a machine (e.g., "CNC Lathe 1", code "MC-001")
4. **Shifts** → "Pre-seeded with Morning / Afternoon / Night shifts"
5. **Planning** → Create a production plan for today, assign machine + shift + target quantity
6. **Downtime** → Log a downtime event (e.g., "Maintenance", 30 min)
7. **Reports** → Show production report filtered by today's date

### 5. Feature Generator (2 min)

> "Need a new feature? One command."

```bash
pnpm generate-feature -- --name quality-check
```

> "This scaffolds the full service-interface, service-runtime, and frontend packages
> with TypeScript types, Express routes, database operations, React Native UI,
> and API client — all wired up and ready to customize."

```bash
# Show generated structure
find features/quality-check -type f
```

Clean up:

```bash
rm -rf features/quality-check
```

### Key Talking Points

- **Type Safety**: End-to-end TypeScript — types defined once in `service-interface`, shared by API and frontend
- **Monorepo**: All code in one repo with independent packages — each feature can be built/tested independently
- **Cross-Platform**: Same codebase runs on Web, iOS, and Android via Expo + React Native
- **Developer Experience**: Hot reload, auto-seeding, one-command startup
- **Scalability**: Add features with the generator, team members work on separate feature packages with no conflicts
- **Production Ready**: JWT auth, PostgreSQL, proper error handling, activity logging

---

## Troubleshooting

### API won't start

```bash
# Check if PostgreSQL is running
pg_isready

# Check if database exists
psql -l | grep factory_os

# Check if port 4000 is in use
lsof -i :4000
```

### Web app shows blank screen

- Check browser console for errors
- Make sure the API is running on port 4000 (the web app calls it)
- Try `http://localhost:8081` (not 8080)

### "Module not found" errors

```bash
# Reinstall all dependencies
pnpm install

# Clear Turbo cache if needed
rm -rf .turbo node_modules/.cache
```

### Mobile app can't connect to API

- The mobile app needs the API URL to point to your machine's IP (not `localhost`)
- Update `API_BASE_URL` in the mobile config
- Make sure your phone/simulator is on the same network

### Smoke test fails

```bash
# Make sure API is running first
pnpm dev:factory-api

# Then in another terminal
pnpm smoke-test
```
