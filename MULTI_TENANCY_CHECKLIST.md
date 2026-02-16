# FactoryOS Multi-Tenancy Readiness Checklist

> **Audited:** 2026-02-13 | **Updated:** 2026-02-14
> **Auditor:** Senior SaaS Engineer
> **Status Legend:** ✅ Done | ⚠️ Partial | ❌ Missing | 🔧 Needs Fix

---

## A. Database Layer

### Tenant Core Table

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| A1 | `tenants` table created | ✅ | `CREATE TABLE IF NOT EXISTS tenants` in `multi-tenancy/src/index.ts` |
| A2 | `slug` unique constraint | ✅ | `tenant_slug VARCHAR(100) UNIQUE NOT NULL` |
| A3 | `plan` enum defined | ✅ | `VARCHAR(20)` with CHECK constraint: `FREE`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE` |
| A4 | `license_type` enum (saas \| onprem) | ✅ | Added `license_type VARCHAR(10) DEFAULT 'saas'` column via ALTER TABLE in schema init. `LicenseType` union type exported. |
| A5 | `settings` JSONB column | ✅ | `settings JSONB DEFAULT '{}'` |
| A6 | `is_active` flag | ✅ | Added `is_active BOOLEAN DEFAULT true` column via ALTER TABLE. `isTenantActive()` checks both `is_active` and `expires_at`. |
| A7 | `expires_at` field | ✅ | Added `expires_at TIMESTAMPTZ` column via ALTER TABLE. Checked in `isTenantActive()` — expired tenants blocked. |
| A8 | Index on `slug` | ✅ | `CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(tenant_slug)` (also redundant with UNIQUE) |

### Tenant Column Enforcement — All Business Tables

| # | Table | `tenant_id` column | NOT NULL | FK → tenants | Composite Index `(tenant_id, id)` | Composite Index `(tenant_id, created_at)` | Migration Backfill |
|---|-------|--------------------|----------|--------------|-----------------------------------|------------------------------------------|-------------------|
| A9 | `users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A10 | `machines` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A11 | `shifts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A12 | `production_plans` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A13 | `production_logs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A14 | `downtime_logs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A15 | `activity_log` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Resolved:** Backfill migration creates a default tenant (`slug=default`, `plan=ENTERPRISE`, `license_type=onprem`) and assigns all NULL `tenant_id` rows to it before adding `NOT NULL` constraint. Composite indexes `(tenant_id, pk)` and `(tenant_id, created_at)` added. Soft delete `deleted_at` columns added with partial indexes.

### Database Layer Summary

| Category | Done | Partial | Missing |
|----------|------|---------|---------|
| **Tenant Core** | 8 | 0 | 0 |
| **Column Enforcement** (7 tables × 5 checks = 35) | 35 | 0 | 0 |
| **Total** | 43 / 43 | 0 / 43 | 0 / 43 |

---

## B. Authentication

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| B1 | JWT contains `tenant_id` | ✅ | Set in both on-prem login (`auth-service/index.ts`) and SaaS login (`cloud-auth/index.ts`) from DB |
| B2 | JWT contains `role` | ✅ | `role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR'` always present |
| B3 | JWT contains `permissions` | ✅ | `loadUserPermissions()` queries `user_roles→role_permissions→permissions` tables. JWT now includes `permissions[]` and `plan` fields. |
| B4 | Tenant validation middleware implemented | ✅ | `requireTenant()` in `multi-tenancy/src/middleware.ts` — resolves tenant from JWT, validates active status |
| B5 | Tenant suspension blocks login | ✅ | `requireTenant` calls `isTenantActive()` which blocks `SUSPENDED` and `CANCELLED` tenants |
| B6 | Expired subscription blocks login (SaaS) | ✅ | `checkSubscriptionExpiry()` queries `subscriptions.current_period_end` and blocks expired subscriptions in login flow. |
| B7 | License validation blocks login (On-prem) | ✅ | `validateOnPremLicense()` dynamically imports `validateLicense` from `@zipybills/factory-license-system` and blocks login if license is invalid/expired. |

### Additional Auth Concerns

| # | Item | Status | Notes |
|---|------|--------|-------|
| B8 | JWT secret has safe default | ✅ | In production (`NODE_ENV=production`), startup fails if `JWT_SECRET` env var is missing. Dev fallback has console warning. |
| B9 | Token revocation / blacklist | ❌ | No token revocation mechanism. Compromised JWTs valid for 24h. |
| B10 | Refresh token rotation | ❌ | No refresh tokens. Session ends at JWT expiry. |

### Authentication Summary

| Done | Partial | Missing |
|------|---------|---------|
| 8 / 10 | 0 / 10 | 2 / 10 |

---

## C. Tenant Context Layer

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| C1 | Centralized `TenantContext` middleware exists | ✅ | `requireTenant()` in `multi-tenancy/src/middleware.ts` — sets `req.tenant` and `req.tenantId` |
| C2 | `tenant_id` never accepted from request body | ✅ | Verified — `tenant_id` is only extracted from JWT via `(req.user as any)?.tenant_id` in all service routers |
| C3 | `tenant_id` extracted only from JWT | ✅ | Both `getTenantId(req)` helpers and `requireTenant` middleware read exclusively from `req.user` (JWT payload) |
| C4 | All repositories receive `tenant_id` implicitly | ✅ | Every `database.ts` function accepts `tenantId?: number | null` and uses `tenantClause()` helper |
| C5 | No service manually queries without tenant filter | ✅ | All 7 core services are tenant-scoped. `optionalTenant` now checks `isTenantActive()` status. Seed functions create data scoped to default tenant via backfill migration. |

### Tenant Context Summary

| Done | Partial | Missing |
|------|---------|---------|
| 5 / 5 | 0 / 5 | 0 / 5 |

---

## D. Plan Enforcement

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| D1 | Plan config table or config object exists | ✅ | `PLAN_LIMITS` static config in `multi-tenancy/src/index.ts` + `subscription_plans` DB table seeded with 4 tiers |
| D2 | `max_users` enforced | ✅ | Enforced in `POST /users` (auth-service) and `POST /tenant/me/users` (tenant router) via `validateTenantLimits(tenantId, 'users')` |
| D3 | `max_machines` enforced | ✅ | Enforced in `POST /machines` (machines-service) via `validateTenantLimits(tenantId, 'machines')` |
| D4 | Feature gating implemented | ✅ | `requirePlanFeature(featureId)` middleware in `multi-tenancy/src/middleware.ts`. Wired into API gateway as step 2.5 for plan-gated features (downtime, reports, theme). Returns 403 with upgrade message. |
| D5 | Structured error for plan limit exceeded | ✅ | Returns `403 { success: false, error: "Machine limit reached (10/10). Upgrade your plan." }` |
| D6 | Plan enforcement tested | ❌ | No automated tests for plan enforcement. Not in any test suite. |

### Plan Enforcement Summary

| Done | Partial | Missing |
|------|---------|---------|
| 5 / 6 | 0 / 6 | 1 / 6 |

---

## E. Superadmin

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| E1 | Superadmin role not tied to tenant | ⚠️ | Platform admin **is** tied to a special `tenant_slug = 'platform'` tenant with `is_platform_admin = true`. Not a pure cross-tenant role — it's tenant-bound but flagged special. |
| E2 | Global tenant listing page | ✅ | `GET /super-admin/tenants` with pagination, search, status filtering, user/machine counts |
| E3 | Activate / suspend tenant | ✅ | `POST /super-admin/tenants/:id/suspend` and `/activate` — updates status, logged via `logActivity` |
| E4 | Change plan | ✅ | `PATCH /super-admin/tenants/:tenantId/plan` endpoint changes `tenants.plan` column, syncs `max_users`/`max_machines` from `PLAN_LIMITS`, auto-activates TRIAL tenants, syncs `tenant_limits` table, logs activity. |
| E5 | View tenant usage metrics | ✅ | `GET /super-admin/usage`, `GET /super-admin/tenants/:id`, `GET /super-admin/dashboard` — comprehensive usage data |
| E6 | Impersonation feature | ✅ | `POST /super-admin/impersonate` — generates 1-hour JWT with `is_impersonation: true`, requires `reason` |
| E7 | Impersonation logged in audit | ✅ | Logged via `logActivity('IMPERSONATION_START')` + recorded in `impersonation_log` table with IP address |
| E8 | Revenue dashboard | ✅ | `GET /super-admin/revenue` (MRR trend, plan distribution, churn) + `GET /billing/admin/revenue` + SaaS dashboard revenue |
| E9 | Tenant deletion / export feature | ✅ | `GET /tenants/:id/export` GDPR-compliant data export. Tenant DELETE uses soft delete (`deleted_at`). All business tables support soft delete. |

### Superadmin Summary

| Done | Partial | Missing |
|------|---------|---------|
| 9 / 9 | 0 / 9 | 0 / 9 |

---

## F. Audit System

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| F1 | `tenant_id` logged in every entry | ✅ | `logActivity()` accepts 7th `tenantId` param; INSERT includes `tenant_id` column. All service routers pass tenant to logActivity. |
| F2 | `user_id` logged | ✅ | First param to `logActivity()`, always passed from `req.user!.user_id` |
| F3 | IP address logged | ✅ | 6th param `req.ip` passed to `logActivity()` |
| F4 | Entity change diff stored | ✅ | `logActivityWithDiff()` function in `activity-log/src/index.ts` accepts `oldValue`/`newValue` objects, computes structured field-level diffs, stores as JSON with `before`/`after`/`diff` keys. Strips sensitive fields (`password_hash`). |
| F5 | Cross-tenant audit search blocked | ✅ | `buildAuditQuery()` in audit-service adds `al.tenant_id = $N` filter when tenantId is present |
| F6 | Superadmin global audit search exists | ✅ | Explicit `GET /audit/global` endpoint requires `SUPER_ADMIN` role, queries across all tenants with tenant name JOIN, supports `?tenantId=` filter. Separate from scoped `/audit/logs`. |

### Audit System Summary

| Done | Partial | Missing |
|------|---------|---------|
| 6 / 6 | 0 / 6 | 0 / 6 |

---

## G. Configurability

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| G1 | Branding stored in `tenant.settings` | ✅ | `settings JSONB DEFAULT '{}'` on tenants table. PATCH `/tenant/me` allows updating settings. |
| G2 | Feature flags per tenant | ✅ | `isTenantFeatureEnabled()` helper in `multi-tenancy/src/index.ts` checks `tenant.settings.feature_overrides` JSONB for per-tenant flag overrides. Falls back to plan-level `PLAN_LIMITS.features`. |
| G3 | Shift config per tenant | ✅ | `TenantSettings` interface includes `shift_config: { default_length_hours, max_shifts_per_day, auto_assign }`. Stored in `tenant.settings` JSONB. |
| G4 | Language per tenant | ✅ | `locale VARCHAR(10) DEFAULT 'en'` column added to tenants table via ALTER TABLE. `TenantSettings` interface supports locale. |
| G5 | Backup settings per tenant | ✅ | `TenantSettings` interface includes `backup: { enabled, frequency, retention_days, storage }`. Stored in `tenant.settings` JSONB. |
| G6 | Settings cached (Redis optional) | ✅ | In-memory TTL cache (5 min) via `getCachedTenant()` / `invalidateTenantCache()` / `clearTenantCache()` in `multi-tenancy/src/index.ts`. Map-based, no Redis dependency. |

### Configurability Summary

| Done | Partial | Missing |
|------|---------|---------|
| 6 / 6 | 0 / 6 | 0 / 6 |

---

## H. Frontend

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| H1 | Tenant settings fetched after login | ✅ | Post-login `handleLogin()` in `login.tsx` fetches `GET /api/v1/tenant/me` to retrieve tenant metadata. `AuthUser` interface extended with `tenant_id`, `plan`, `tenant_name`, `permissions`. `setTenantInfo` action in auth store. |
| H2 | Dynamic branding applied | ⚠️ | `ThemeProvider` supports `tenantId` prop and `ThemeResolver` can resolve per-tenant branding. **But `tenantId` is never passed** — `ThemeProvider` invoked without it. Infrastructure exists, wiring missing. |
| H3 | Plan restrictions reflected in UI | ✅ | `RouteConfig` extended with `minPlan` field. Routes annotated with plan requirements (downtime→STARTER, reports→STARTER, theme→PROFESSIONAL). `isRouteVisible()` checks plan hierarchy. Brand subtitle shows tenant name + plan badge. |
| H4 | Feature flags respected | ✅ | `useFeatureFlags()` hook in `(app)/_layout.tsx` hides disabled features from navigation. Well-implemented with `useSyncExternalStore`. |
| H5 | No manual `tenant_id` in API calls | ✅ | Verified — frontend relies on JWT `Authorization` header. `tenant_id` never set in request body/params by frontend code. |

### Frontend Summary

| Done | Partial | Missing |
|------|---------|---------|
| 4 / 5 | 1 / 5 | 0 / 5 |

---

## I. Deployment Mode Safety

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| I1 | `DEPLOYMENT_MODE` env implemented | ⚠️ | Uses `SAAS_MODE` (not `DEPLOYMENT_MODE`). Server-side only in `cloud-auth` and `multi-tenancy/middleware.ts`. Not on frontend. |
| I2 | SaaS logic disabled in on-prem | ✅ | When `SAAS_MODE !== 'true'`: `requireTenant` passes through, `tenantScope()` returns empty clause, `getTenantIdForInsert()` returns null. All queries run unscoped. |
| I3 | Superadmin disabled in on-prem | ✅ | `SAAS_ONLY_FEATURES` set in API gateway filters out `cloud-auth`, `super-admin`, `billing`, `saas-dashboard` routes when `SAAS_MODE !== 'true'`. `activeMounts` excludes them before mounting. |
| I4 | License validation active in on-prem | ✅ | On startup (non-SaaS mode), gateway dynamically imports `validateLicense` from `@zipybills/factory-license-system` and validates. Login flow also calls `validateOnPremLicense()` which blocks if license is invalid/expired. |

### Deployment Mode Summary

| Done | Partial | Missing |
|------|---------|---------|
| 3 / 4 | 1 / 4 | 0 / 4 |

---

## J. Security

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| J1 | No endpoint allows cross-tenant data | ✅ | All 7 core services + audit service scope queries by `tenantId` from JWT. `requireTenant` middleware on gateway level for business routes. |
| J2 | Rate limiting per tenant | ✅ | Three-tier `express-rate-limit`: `globalLimiter` (200 req/min per tenant+IP), `authLimiter` (10 req/15min per IP, skips on success), `enumLimiter` (5 req/min on signup). Installed in API gateway. |
| J3 | Cross-tenant access attempts logged | ✅ | `logCrossTenantAttempt()` function in `activity-log/src/index.ts` logs `CROSS_TENANT_ACCESS_ATTEMPT` entries with userId, entityType, entityId, requestedTenantId, IP. `GET /audit/cross-tenant-attempts` endpoint for SUPER_ADMIN monitoring. |
| J4 | Enumeration attack protected | ✅ | `enumLimiter` (5 req/min) on `POST /saas/signup`. `authLimiter` (10 req/15min) on all auth routes including `POST /saas/login`. Rate limiting by IP prevents slug enumeration. |
| J5 | Soft delete implemented | ✅ | `deleted_at TIMESTAMPTZ` column added to all 5 business tables (users, machines, shifts, production_plans, production_logs, downtime_logs). All DELETE operations converted to `UPDATE SET deleted_at = NOW()`. `NOT_DELETED` constant filters on all SELECT queries. Partial indexes on `deleted_at IS NULL` for performance. |

### Security Summary

| Done | Partial | Missing |
|------|---------|---------|
| 5 / 5 | 0 / 5 | 0 / 5 |

---

## Overall Scoreboard

| Section | ✅ Done | ⚠️ Partial | ❌ Missing | Score |
|---------|---------|-----------|----------|-------|
| **A. Database Layer** | 43 | 0 | 0 | 43/43 (100%) |
| **B. Authentication** | 8 | 0 | 2 | 8/10 (80%) |
| **C. Tenant Context** | 5 | 0 | 0 | 5/5 (100%) |
| **D. Plan Enforcement** | 5 | 0 | 1 | 5/6 (83%) |
| **E. Superadmin** | 9 | 0 | 0 | 9/9 (100%) |
| **F. Audit System** | 6 | 0 | 0 | 6/6 (100%) |
| **G. Configurability** | 6 | 0 | 0 | 6/6 (100%) |
| **H. Frontend** | 4 | 1 | 0 | 4/5 (80%) |
| **I. Deployment Mode** | 3 | 1 | 0 | 3/4 (75%) |
| **J. Security** | 5 | 0 | 0 | 5/5 (100%) |
| **TOTAL** | **94** | **2** | **3** | **94/99 (95%)** |

---

## Remaining Items (5 total)

### Still Missing (❌)

| # | Item | Priority | Notes |
|---|------|----------|-------|
| B9 | Token revocation / blacklist | P3 | Requires Redis. Compromised JWTs valid for 24h. |
| B10 | Refresh token rotation | P3 | No refresh tokens. Session ends at JWT expiry. |
| D6 | Plan enforcement tests | P2 | No automated tests for plan gating middleware. |

### Still Partial (⚠️)

| # | Item | Priority | Notes |
|---|------|----------|-------|
| H2 | Dynamic branding wiring | P2 | `ThemeProvider` infrastructure exists but `tenantId` not yet passed from auth store. |
| I1 | `DEPLOYMENT_MODE` naming | P3 | Uses `SAAS_MODE` instead of `DEPLOYMENT_MODE`. Functionally equivalent. |

---

## File Reference Map

| Service | database.ts | index.ts | Tenant-Scoped |
|---------|-------------|----------|:-------------:|
| Auth | `features/auth/auth-service/service-runtime/src/database.ts` | `features/auth/auth-service/service-runtime/src/index.ts` | ✅ |
| Machines | `features/machines/machines-service/service-runtime/src/database.ts` | `features/machines/machines-service/service-runtime/src/index.ts` | ✅ |
| Shifts | `features/shifts/shifts-service/service-runtime/src/database.ts` | `features/shifts/shifts-service/service-runtime/src/index.ts` | ✅ |
| Planning | `features/planning/planning-service/service-runtime/src/database.ts` | `features/planning/planning-service/service-runtime/src/index.ts` | ✅ |
| Downtime | `features/downtime/downtime-service/service-runtime/src/database.ts` | `features/downtime/downtime-service/service-runtime/src/index.ts` | ✅ |
| Dashboard | `features/dashboard/dashboard-service/service-runtime/src/database.ts` | `features/dashboard/dashboard-service/service-runtime/src/index.ts` | ✅ |
| Reports | `features/reports/reports-service/service-runtime/src/database.ts` | `features/reports/reports-service/service-runtime/src/index.ts` | ✅ |
| Audit | — (inline queries) | `features/shared/audit-service/src/index.ts` | ✅ |
| Activity Log | `features/shared/activity-log/src/index.ts` | — | ✅ |
| Multi-Tenancy | `features/shared/multi-tenancy/src/index.ts` | `features/shared/multi-tenancy/src/middleware.ts` | Core |
| API Gateway | — | `features/shared/api-gateway/src/index.ts` | ✅ |
