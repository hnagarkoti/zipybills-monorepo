# 🚀 Running the Barcode Scanner App

## Quick Start (All Services at Once)

```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills
pnpm dev:barcode
```

This starts:
- ✅ Web App on **http://localhost:3001**
- ✅ Scanning Service on **http://localhost:3003**
- ✅ Orders Service on **http://localhost:3004**
- ✅ Inventory Service on **http://localhost:3005**

---

## Individual Commands

If you want to run services individually:

### Run Web App Only
```bash
pnpm dev:barcode-web
```

### Run Mobile App Only
```bash
pnpm dev:barcode-mobile
```

### Run Individual Services
```bash
# Scanning Service (Port 3003)
pnpm dev:scanning-service

# Orders Service (Port 3004)
pnpm dev:orders-service

# Inventory Service (Port 3005)
pnpm dev:inventory-service
```

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Web App | http://localhost:3001 | Main web application |
| Scanning Service | http://localhost:3003 | Barcode scanning API |
| Orders Service | http://localhost:3004 | Order management API |
| Inventory Service | http://localhost:3005 | Inventory tracking API |

---

## Health Check Endpoints

Test if services are running:

```bash
# Scanning Service
curl http://localhost:3003/health

# Orders Service
curl http://localhost:3004/health

# Inventory Service  
curl http://localhost:3005/health
```

---

## Development Workflow

1. **Start all services**: `./run-barcode-app.sh`
2. **Open web app**: http://localhost:3001
3. **Navigate through routes**:
   - `/dashboard` - Order dashboard
   - `/scanner` - Barcode scanner
   - `/history` - Order history
   - `/inventory` - Inventory list
   - `/settings` - Settings page

4. **Make changes**: Code changes auto-reload (hot reload enabled)
5. **Stop services**: Press `Ctrl+C` in terminal

---

## Troubleshooting

### Port Already in Use
If a port is already in use:
```bash
# Find process using port (e.g., 3001)
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Services Won't Start
```bash
# Reinstall dependencies
pnpm install

# Clear cache
pnpm clean
pnpm install
```

### TypeScript Errors
```bash
# Run type checking
pnpm typecheck

# Fix lint issues
pnpm lint:fix
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Barcode Scanner App                       │
│                   http://localhost:3001                      │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
       ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
       │  Scanning    │ │  Orders  │ │ Inventory  │
       │   Service    │ │ Service  │ │  Service   │
       │  Port 3003   │ │Port 3004 │ │ Port 3005  │
       └──────────────┘ └──────────┘ └────────────┘
```

Each service is:
- ✅ Independently scalable
- ✅ Independently deployable
- ✅ Running on separate port
- ✅ Hot-reload enabled for development

---

## Next Steps

1. **Implement actual features** in each service
2. **Add database** connections (PostgreSQL/MongoDB)
3. **Add authentication** (JWT tokens)
4. **Add error handling** and logging
5. **Write tests** for each service
6. **Deploy** services independently

---

## Available Scripts (from root)

```bash
pnpm dev                    # Run all dev tasks
pnpm dev:barcode           # Run barcode app + all services
pnpm dev:barcode-web       # Run web app only
pnpm dev:barcode-mobile    # Run mobile app only
pnpm dev:scanning-service  # Run scanning service only
pnpm dev:orders-service    # Run orders service only
pnpm dev:inventory-service # Run inventory service only

pnpm build                 # Build all packages
pnpm test                  # Run all tests
pnpm lint                  # Lint all packages
pnpm lint:fix              # Fix lint issues
```

---

## 🎯 Current Status

✅ All 4 packages running successfully  
✅ Web app accessible at http://localhost:3001  
✅ All 3 backend services running  
✅ Hot reload enabled  
✅ Nested micro-service architecture working  

🎉 **You're ready to develop!**
