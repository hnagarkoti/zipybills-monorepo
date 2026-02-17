# FactoryOS — Manual Testing Plan

> **Date**: February 2026
> **Version**: 1.0
> **API Server**: `http://localhost:4000`
> **Web App**: `http://localhost:8081`
> **DB**: PostgreSQL `factory_os` on `localhost:5432`

---

## Table of Contents

1. [Test Credentials](#1-test-credentials)
2. [Prerequisites — Start Servers](#2-prerequisites--start-servers)
3. [Flow 1 — Platform Admin Setup](#3-flow-1--platform-admin-setup)
4. [Flow 2 — Tenant A (Achme) Self-Signup & Onboarding](#4-flow-2--tenant-a-achme-self-signup--onboarding)
5. [Flow 3 — Create Users (Achme Operators & Supervisors)](#5-flow-3--create-users-achme-operators--supervisors)
6. [Flow 4 — Shift Setup](#6-flow-4--shift-setup)
7. [Flow 5 — Machine Setup](#7-flow-5--machine-setup)
8. [Flow 6 — Production Planning (Supervisor)](#8-flow-6--production-planning-supervisor)
9. [Flow 7 — Operator Daily Log Entry](#9-flow-7--operator-daily-log-entry)
10. [Flow 8 — Downtime Logging](#10-flow-8--downtime-logging)
11. [Flow 9 — Dashboard Validation](#11-flow-9--dashboard-validation)
12. [Flow 10 — Reports Validation](#12-flow-10--reports-validation)
13. [Flow 11 — Tenant B (Mahale) Setup & Data Isolation](#13-flow-11--tenant-b-mahale-setup--data-isolation)
14. [Flow 12 — Backup & Data Export (Admin)](#14-flow-12--backup--data-export-admin)
15. [Flow 13 — Plan Upgrade & Downgrade](#15-flow-13--plan-upgrade--downgrade)
16. [Flow 14 — FREE Plan Read-Only Enforcement](#16-flow-14--free-plan-read-only-enforcement)
17. [Flow 15 — Settings & Appearance](#17-flow-15--settings--appearance)
18. [Flow 16 — Platform Admin — Tenant Management](#18-flow-16--platform-admin--tenant-management)
19. [Flow 17 — User Management & Role Permissions](#19-flow-17--user-management--role-permissions)
20. [Flow 18 — Trial Expiry Auto-Downgrade](#20-flow-18--trial-expiry-auto-downgrade)
21. [Quick Reference — API Cheat Sheet](#21-quick-reference--api-cheat-sheet)

---

## 1. Test Credentials

> **NOTE**: These users do NOT exist in the DB yet. You must create them by following the flows below in order.

### Platform Admin (God-level, manages all tenants)

| Field | Value |
|-------|-------|
| Username | `platform_admin` |
| Password | `Test@1234` |
| Role | Platform Admin |

> **Created automatically** when the API server boots for the first time in SaaS mode.
> Check server logs for: `"Platform admin created: platform_admin"`.
> If it doesn't auto-create, use this first-boot API:
> The server initializes the platform admin from `PLATFORM_ADMIN_USERNAME` / `PLATFORM_ADMIN_PASSWORD` env vars,
> or defaults to `platform_admin` / `admin123!`.
> **You may need to change the default password** — see Flow 1.

### Company A — Achme Manufacturing (Tenant A)

| Username | Password | Role | Notes |
|----------|----------|------|-------|
| `achme_admin` | `Test@1234` | ADMIN | Created during self-signup (Flow 2) |
| `achme_operator1` | `Test@1234` | OPERATOR | Created by achme_admin (Flow 3) |
| `achme_operator2` | `Test@1234` | OPERATOR | Created by achme_admin (Flow 3) |
| `achme_operator3` | `Test@1234` | OPERATOR | Created by achme_admin (Flow 3) |
| `achme_supervisor1` | `Test@1234` | SUPERVISOR | Created by achme_admin (Flow 3) |
| `achme_supervisor2` | `Test@1234` | SUPERVISOR | Created by achme_admin (Flow 3) |

### Company B — Mahale Industries (Tenant B)

| Username | Password | Role | Notes |
|----------|----------|------|-------|
| `mahale_admin` | `Test@1234` | ADMIN | Created during self-signup (Flow 11) |
| `mahale_operator1` | `Test@1234` | OPERATOR | Created by mahale_admin (Flow 11) |
| `mahale_operator2` | `Test@1234` | OPERATOR | Created by mahale_admin (Flow 11) |
| `mahale_operator3` | `Test@1234` | OPERATOR | Created by mahale_admin (Flow 11) |
| `mahale_supervisor1` | `Test@1234` | SUPERVISOR | Created by mahale_admin (Flow 11) |
| `mahale_supervisor2` | `Test@1234` | SUPERVISOR | Created by mahale_admin (Flow 11) |

### Plan Limits Quick Reference

| Plan | Max Users | Max Machines | Downtime | Reports | Export | Backup |
|------|-----------|-------------|----------|---------|--------|--------|
| FREE | 3 | 2 | No | No | No | Data Export only |
| STARTER | 10 | 10 | Yes | Yes | No | Data Export only |
| PROFESSIONAL | 50 | 30 | Yes | Yes | Yes | Data Export only |
| ENTERPRISE | Unlimited | Unlimited | Yes | Yes | Yes | Full (Cloud + GDrive) |

---

## 2. Prerequisites — Start Servers

### Step 2.1: Start API Gateway

```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills
cd features/shared/api-gateway && pnpm exec tsx src/index.ts
```

**Verify**: Open a new terminal:
```bash
curl http://localhost:4000/api/health
```
**Expected**: `{"status":"healthy", ...}` or `{"status":"degraded", ...}` — both are OK.

### Step 2.2: Start Expo Web App

```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills/apps/factoryOS
npx expo start --web --port 8081
```

**Verify**: Open browser → `http://localhost:8081` → Should see Login page.

### Step 2.3: (Optional) Start Expo iOS

```bash
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills/apps/factoryOS
npx expo start --ios --port 8081
```

---

## 3. Flow 1 — Platform Admin Setup

> The platform admin is auto-created by the server on first boot. You need to verify its credentials.

### Via API (Terminal)

```bash
# Try logging in with default credentials
curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"platform_admin","password":"admin123!"}' | python3 -m json.tool
```

**Expected**: A JSON response with `"token": "eyJ..."` and `"user"` object with `"is_platform_admin": true`.

> **If the default password is `admin123!`**, you may want to test with that. The system may not allow you to change it via API easily, so just use the default.

### Via Web App

1. Open `http://localhost:8081`
2. Enter: `platform_admin` / `admin123!`
3. Click **Login**
4. **Expected**: Redirected to **Platform Admin Dashboard** (shows total tenants, total users, revenue, system health)
5. Sidebar should show: **Overview, Tenants, Users, Plans, Activity, Health, Announcements, Backups, Analytics**

### Validation Checklist
- [ ] Platform admin can log in
- [ ] Sees platform admin dashboard (not tenant dashboard)
- [ ] Can see tenant list (empty initially)
- [ ] Can see system health

---

## 4. Flow 2 — Tenant A (Achme) Self-Signup & Onboarding

### Step 4.1: Self-Signup via API

```bash
curl -s http://localhost:4000/api/v1/saas/signup \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Achme Manufacturing",
    "slug": "achme",
    "admin_username": "achme_admin",
    "admin_password": "Test@1234",
    "admin_full_name": "Achme Admin"
  }' | python3 -m json.tool
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "username": "achme_admin", "role": "ADMIN", ... },
  "tenant": { "company_name": "Achme Manufacturing", "plan": "FREE", "status": "TRIAL", ... }
}
```

### Step 4.2: Login via Web App

1. Open `http://localhost:8081`
2. Enter: `achme_admin` / `Test@1234`
3. Click **Login**
4. **Expected**: Redirected to **Dashboard** page
5. Dashboard should show zeros/empty (no data yet)
6. Should see **Onboarding Banner** saying "Set up your factory: Add shifts, machines, and production plans"

### Step 4.3: Verify Account Info

```bash
# Save token from signup response, then:
curl -s http://localhost:4000/api/v1/auth/account \
  -H "Authorization: Bearer YOUR_TOKEN" | python3 -m json.tool
```

**Expected**: Shows company_name, plan=FREE, status=TRIAL, trial_ends_at (14 days from now), max_users=3, max_machines=2.

### Validation Checklist
- [ ] Signup succeeds, returns token
- [ ] Can login on web with `achme_admin` / `Test@1234`
- [ ] Dashboard loads (empty state)
- [ ] Account shows FREE plan, TRIAL status, 14-day trial
- [ ] Onboarding banner visible

---

## 5. Flow 3 — Create Users (Achme Operators & Supervisors)

> **Login as**: `achme_admin` / `Test@1234`

### Via Web App

1. Login as `achme_admin`
2. Navigate to **Users** page (sidebar → Users icon)
3. Click **Add User** button

#### Create each user one by one:

| # | Full Name | Username | Password | Role |
|---|-----------|----------|----------|------|
| 1 | Achme Operator 1 | `achme_operator1` | `Test@1234` | OPERATOR |
| 2 | Achme Operator 2 | `achme_operator2` | `Test@1234` | OPERATOR |
| 3 | Achme Operator 3 | `achme_operator3` | `Test@1234` | OPERATOR |
| 4 | Achme Supervisor 1 | `achme_supervisor1` | `Test@1234` | SUPERVISOR |
| 5 | Achme Supervisor 2 | `achme_supervisor2` | `Test@1234` | SUPERVISOR |

### Via API (if Web is faster)

```bash
# First, login to get token
TOKEN=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_admin","password":"Test@1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Create operator 1
curl -s http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"achme_operator1","password":"Test@1234","full_name":"Achme Operator 1","role":"OPERATOR"}'

# Create operator 2
curl -s http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"achme_operator2","password":"Test@1234","full_name":"Achme Operator 2","role":"OPERATOR"}'

# Create operator 3
curl -s http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"achme_operator3","password":"Test@1234","full_name":"Achme Operator 3","role":"OPERATOR"}'

# Create supervisor 1
curl -s http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"achme_supervisor1","password":"Test@1234","full_name":"Achme Supervisor 1","role":"SUPERVISOR"}'

# Create supervisor 2
curl -s http://localhost:4000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"username":"achme_supervisor2","password":"Test@1234","full_name":"Achme Supervisor 2","role":"SUPERVISOR"}'
```

### Important: Plan Limit Check

> **FREE plan allows max 3 users** (including the admin). So creating 5 more users will fail unless the plan is upgraded.

**Expected Behavior**:
- User 1 (`achme_operator1`) — **SUCCESS** (2/3 total)
- User 2 (`achme_operator2`) — **SUCCESS** (3/3 total)
- User 3 (`achme_operator3`) — **FAIL with "User limit reached. Upgrade your plan."**

> **To create all 5 users, first upgrade the plan** (see Flow 13) or use STARTER (10 users).

#### Option A: Upgrade plan first via API

```bash
curl -s http://localhost:4000/api/v1/billing/subscription/change-plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan_code":"STARTER"}'
```

Then retry creating the remaining users. STARTER allows 10 users.

#### Option B: Use Platform Admin to override limits

```bash
# Login as platform admin
SUPER=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"platform_admin","password":"admin123!"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Find Achme's tenant_id from the tenants list
curl -s http://localhost:4000/api/v1/super-admin/tenants \
  -H "Authorization: Bearer $SUPER" | python3 -m json.tool
# Note the tenant_id for "Achme Manufacturing"

# Override limits
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID/limits \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER" \
  -d '{"max_users": 10, "max_machines": 10}'
```

### Validation Checklist
- [ ] Can see Users page (only as ADMIN)
- [ ] Can create users with OPERATOR / SUPERVISOR roles
- [ ] Plan limit enforced (error on exceeding FREE limit)
- [ ] After upgrade: can create remaining users
- [ ] Each created user can log in independently
- [ ] Verify: login as `achme_operator1` → sees Dashboard, Plans, Machines (limited sidebar)
- [ ] Verify: login as `achme_supervisor1` → sees Dashboard, Plans, Machines, Shifts, Reports (more sidebar items)

---

## 6. Flow 4 — Shift Setup

> **Login as**: `achme_admin` or `achme_supervisor1`

### Via Web App

1. Navigate to **Shifts** page (sidebar)
2. Click **Quick Setup** → Choose "3 Shifts" (Morning/Afternoon/Night)
3. OR manually click **Add Shift** and create:

| # | Shift Name | Start Time | End Time |
|---|------------|-----------|----------|
| 1 | Morning | 06:00 | 14:00 |
| 2 | Afternoon | 14:00 | 22:00 |
| 3 | Night | 22:00 | 06:00 |

### Via API

```bash
# Bulk create 3-shift pattern
curl -s http://localhost:4000/api/v1/shifts/bulk-create \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"count": 3}'
```

### Validation Checklist
- [ ] Shifts page loads
- [ ] Bulk create creates 3 shifts
- [ ] Shifts show in the list with correct times
- [ ] Can edit a shift (change times) — ADMIN/SUPERVISOR only
- [ ] Can delete a shift — ADMIN only
- [ ] Operators cannot see or access Shifts page

---

## 7. Flow 5 — Machine Setup

> **Login as**: `achme_admin` or `achme_supervisor1`

### Via Web App

1. Navigate to **Machines** page
2. Click **Add Machine** button
3. Fill the form and create:

| # | Machine Code | Machine Name | Department | Type |
|---|-------------|-------------|-----------|------|
| 1 | CNC-001 | CNC Lathe Pro 5000 | Production | CNC |
| 2 | PRS-001 | Press Brake HX-200 | Fabrication | Press |
| 3 | DRL-001 | Drilling Center DC-400 | Production | Drill |
| 4 | WLD-001 | Welding Robot WR-100 | Assembly | Welding |

### Via API

```bash
curl -s http://localhost:4000/api/v1/machines \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"machine_code":"CNC-001","machine_name":"CNC Lathe Pro 5000","department":"Production","machine_type":"CNC","status":"ACTIVE"}'

curl -s http://localhost:4000/api/v1/machines \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"machine_code":"PRS-001","machine_name":"Press Brake HX-200","department":"Fabrication","machine_type":"Press","status":"ACTIVE"}'

# ... repeat for DRL-001 and WLD-001
```

> **FREE plan allows max 2 machines**. If on FREE plan, 3rd machine creation will fail.
> Upgrade to STARTER first (10 machines).

### Validation Checklist
- [ ] Machines page loads, shows list
- [ ] Can add machine via form
- [ ] Machine code uniqueness enforced (duplicate code → error)
- [ ] Plan machine limit enforced
- [ ] Can edit machine details — ADMIN/SUPERVISOR
- [ ] Can delete machine — ADMIN only
- [ ] Delete shows confirmation modal
- [ ] Operators can VIEW machines but NOT add/edit/delete

---

## 8. Flow 6 — Production Planning (Supervisor)

> **Login as**: `achme_supervisor1` / `Test@1234`

### Step 8.1: Create Production Plans for Today

1. Navigate to **Plans** page
2. Select today's date
3. Click **Add Plan** button
4. Create plans:

| # | Machine | Shift | Product Name | Product Code | Target Qty |
|---|---------|-------|-------------|-------------|------------|
| 1 | CNC-001 | Morning | Steel Shaft XL | SS-XL-100 | 500 |
| 2 | CNC-001 | Afternoon | Steel Shaft XL | SS-XL-100 | 450 |
| 3 | PRS-001 | Morning | Brake Disc A | BD-A-200 | 300 |
| 4 | PRS-001 | Afternoon | Brake Disc A | BD-A-200 | 280 |
| 5 | DRL-001 | Morning | Motor Housing | MH-301 | 200 |
| 6 | WLD-001 | Morning | Frame Assembly | FA-400 | 150 |

### Via API

```bash
# Get machine and shift IDs first
curl -s http://localhost:4000/api/v1/machines -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:4000/api/v1/shifts -H "Authorization: Bearer $TOKEN"
# Note the IDs, then create plans:

curl -s http://localhost:4000/api/v1/plans \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "machine_id": 1,
    "shift_id": 1,
    "plan_date": "2026-02-14",
    "product_name": "Steel Shaft XL",
    "product_code": "SS-XL-100",
    "target_quantity": 500
  }'
```

### Step 8.2: Bulk Import Plans

```bash
curl -s http://localhost:4000/api/v1/plans/bulk \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plans": [
      {"machine_id": 1, "shift_id": 2, "plan_date": "2026-02-14", "product_name": "Steel Shaft XL", "product_code": "SS-XL-100", "target_quantity": 450},
      {"machine_id": 2, "shift_id": 1, "plan_date": "2026-02-14", "product_name": "Brake Disc A", "product_code": "BD-A-200", "target_quantity": 300}
    ]
  }'
```

### Step 8.3: Duplicate Plans for Tomorrow

```bash
curl -s http://localhost:4000/api/v1/plans/duplicate \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"source_date": "2026-02-14", "target_date": "2026-02-15"}'
```

### Validation Checklist
- [ ] Planning page loads with date picker
- [ ] Can create plans via form
- [ ] Plans show in the list organized by machine/shift
- [ ] Can edit plan details — ADMIN/SUPERVISOR
- [ ] Can delete a plan — ADMIN only
- [ ] Supervisors can create plans
- [ ] Operators can VIEW plans but NOT create/edit/delete
- [ ] Bulk import works
- [ ] Duplicate date works
- [ ] Plans appear on the Operator Input page

---

## 9. Flow 7 — Operator Daily Log Entry

> **This is the core daily workflow for factory operators.**

### Step 9.1: Login as Operator

1. Login as: `achme_operator1` / `Test@1234`
2. Navigate to **Plans → Operator Input** (or the dedicated operator view)

### Step 9.2: Log Production for a Plan

1. Select a production plan from the list (e.g., "Steel Shaft XL — CNC-001 — Morning")
2. Fill in hourly production:

| Field | Value |
|-------|-------|
| Quantity Produced | 120 |
| Quantity OK | 115 |
| Quantity Rejected | 5 |
| Rejection Reason | Surface defect |
| Hour Slot | 06:00-07:00 |
| Notes | Slight vibration in spindle |

3. Click **Save / Submit**

### Via API

```bash
# Login as operator
OP_TOKEN=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_operator1","password":"Test@1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Log production
curl -s http://localhost:4000/api/v1/production-logs \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{
    "plan_id": 1,
    "machine_id": 1,
    "shift_id": 1,
    "quantity_produced": 120,
    "quantity_ok": 115,
    "quantity_rejected": 5,
    "rejection_reason": "Surface defect",
    "hour_slot": "06:00-07:00",
    "notes": "Slight vibration in spindle"
  }'
```

### Step 9.3: Multiple Entries Through the Day

Have operators log multiple entries per shift to build up data:

| Operator | Plan | Hour Slot | Produced | OK | Rejected | Reason |
|----------|------|-----------|----------|-----|----------|--------|
| achme_operator1 | CNC-001 Morning | 06:00-07:00 | 120 | 115 | 5 | Surface defect |
| achme_operator1 | CNC-001 Morning | 07:00-08:00 | 130 | 128 | 2 | Dimensional error |
| achme_operator1 | CNC-001 Morning | 08:00-09:00 | 125 | 125 | 0 | — |
| achme_operator2 | PRS-001 Morning | 06:00-07:00 | 80 | 78 | 2 | Crack on edge |
| achme_operator2 | PRS-001 Morning | 07:00-08:00 | 85 | 83 | 2 | Crack on edge |
| achme_operator3 | DRL-001 Morning | 06:00-07:00 | 50 | 49 | 1 | Hole misalignment |

### Step 9.4: Change Plan Status

Operators can update plan status to track progress:

```bash
# Change plan status to "in-progress"
curl -s http://localhost:4000/api/v1/plans/1/status \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{"status": "in-progress"}'

# When done for the day, mark as "completed"
curl -s http://localhost:4000/api/v1/plans/1/status \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OP_TOKEN" \
  -d '{"status": "completed"}'
```

### Validation Checklist
- [ ] Operator can see assigned plans for today
- [ ] Can log production quantities
- [ ] Can specify rejection reason
- [ ] Multiple log entries per plan allowed (hourly)
- [ ] Cannot create/edit/delete plans (only ADMIN/SUPERVISOR can)
- [ ] Can change plan status
- [ ] Production totals update in real-time
- [ ] Dashboard reflects the new production data

---

## 10. Flow 8 — Downtime Logging

> **Requires**: STARTER plan or higher. FREE plan will get "Feature not available" error.

> **Login as**: `achme_operator1` or `achme_supervisor1`

### Step 10.1: Log a Downtime Event

1. Navigate to **Downtime** page
2. Click **Log Downtime**
3. Fill in:

| Field | Value |
|-------|-------|
| Machine | CNC-001 |
| Shift | Morning |
| Category | Mechanical |
| Reason | Spindle bearing failure |
| Started At | 2026-02-14 09:30 |
| Notes | Bearing replaced, running tests |

### Via API

```bash
curl -s http://localhost:4000/api/v1/downtime \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "machine_id": 1,
    "shift_id": 1,
    "category": "Mechanical",
    "reason": "Spindle bearing failure",
    "started_at": "2026-02-14T09:30:00Z",
    "notes": "Bearing replaced, running tests"
  }'
```

### Step 10.2: End the Downtime

```bash
curl -s http://localhost:4000/api/v1/downtime/1/end \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"ended_at": "2026-02-14T10:45:00Z", "resolution_notes": "Bearing replaced successfully"}'
```

### Validation Checklist
- [ ] Downtime page loads (STARTER+ only)
- [ ] Can log downtime start
- [ ] Can end downtime event
- [ ] Duration calculates automatically
- [ ] Shows in Dashboard metrics (downtime minutes)
- [ ] FREE plan → gets "Feature not available on your plan" error

---

## 11. Flow 9 — Dashboard Validation

> **Login as**: `achme_admin` / `Test@1234` (or any Achme user)

### What to Check on Dashboard

After entering production data (Flow 7) and downtime data (Flow 8):

1. Navigate to **Dashboard** (home page)
2. Verify these cards/metrics:

| Metric | Expected |
|--------|----------|
| Total Machines | 4 (or however many you created) |
| Active Machines | 4 |
| Total Operators | Matches your user count |
| Today's Plans | 6 (number of production plans for today) |
| Today's Produced | Sum of all production_logs quantity_produced |
| Today's Target | Sum of all plan target_quantity |
| Today's OK | Sum of quantity_ok |
| Today's Rejected | Sum of quantity_rejected |
| Rejection Rate | (rejected / produced) × 100 |
| Efficiency | (produced / target) × 100 |
| Downtime Minutes | Total downtime for today |

3. Check **Machine Status** section — shows each machine's current status
4. Check **Recent Activity** — shows latest production logs and events
5. Check **Shift Summary** — breakdown by shift

### Via API

```bash
curl -s http://localhost:4000/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Validation Checklist
- [ ] Dashboard loads without errors
- [ ] All metrics reflect actual data
- [ ] Machine status cards are accurate
- [ ] Recent activity shows latest entries
- [ ] Different users see the same dashboard data (same tenant)
- [ ] Different tenant cannot see Achme's data

---

## 12. Flow 10 — Reports Validation

> **Requires**: STARTER plan or higher
> **Login as**: `achme_admin` or `achme_supervisor1`

### Step 12.1: Production Report

1. Navigate to **Reports** page
2. Select date range: `2026-02-14` to `2026-02-14`
3. Select report type: **Production Report**
4. Click **Generate**

### Via API

```bash
curl -s "http://localhost:4000/api/v1/reports/production?start_date=2026-02-14&end_date=2026-02-14" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Step 12.2: Machine-Wise Report

```bash
curl -s "http://localhost:4000/api/v1/reports/machine-wise?start_date=2026-02-14&end_date=2026-02-14" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Step 12.3: Shift-Wise Report

```bash
curl -s "http://localhost:4000/api/v1/reports/shift-wise?start_date=2026-02-14&end_date=2026-02-14" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Step 12.4: Rejections Report

```bash
curl -s "http://localhost:4000/api/v1/reports/rejections?start_date=2026-02-14&end_date=2026-02-14" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Validation Checklist
- [ ] Reports page loads (STARTER+ only)
- [ ] Can select date range
- [ ] Production report shows totals
- [ ] Machine-wise report breaks down by machine
- [ ] Shift-wise report breaks down by shift
- [ ] Rejections report shows rejection reasons and counts
- [ ] FREE plan → "Feature not available on your plan" error

---

## 13. Flow 11 — Tenant B (Mahale) Setup & Data Isolation

> **This flow validates that Tenant B cannot see Tenant A's data (multi-tenancy isolation).**

### Step 13.1: Sign Up Tenant B (Mahale Industries)

```bash
curl -s http://localhost:4000/api/v1/saas/signup \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Mahale Industries",
    "slug": "mahale",
    "admin_username": "mahale_admin",
    "admin_password": "Test@1234",
    "admin_full_name": "Mahale Admin"
  }' | python3 -m json.tool
```

### Step 13.2: Upgrade Mahale to STARTER (for users)

```bash
MAHALE_TOKEN=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mahale_admin","password":"Test@1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

curl -s http://localhost:4000/api/v1/billing/subscription/change-plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MAHALE_TOKEN" \
  -d '{"plan_code":"STARTER"}'
```

### Step 13.3: Create Mahale Users

```bash
for user in "mahale_operator1:Mahale Operator 1:OPERATOR" "mahale_operator2:Mahale Operator 2:OPERATOR" "mahale_operator3:Mahale Operator 3:OPERATOR" "mahale_supervisor1:Mahale Supervisor 1:SUPERVISOR" "mahale_supervisor2:Mahale Supervisor 2:SUPERVISOR"; do
  IFS=':' read -r username fullname role <<< "$user"
  curl -s http://localhost:4000/api/v1/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MAHALE_TOKEN" \
    -d "{\"username\":\"$username\",\"password\":\"Test@1234\",\"full_name\":\"$fullname\",\"role\":\"$role\"}"
  echo ""
done
```

### Step 13.4: Create Mahale Machines & Shifts

```bash
# Create shifts
curl -s http://localhost:4000/api/v1/shifts/bulk-create \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MAHALE_TOKEN" \
  -d '{"count": 2}'

# Create machines
curl -s http://localhost:4000/api/v1/machines \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MAHALE_TOKEN" \
  -d '{"machine_code":"M-INJ-001","machine_name":"Injection Molding M1","department":"Molding","machine_type":"Injection","status":"ACTIVE"}'

curl -s http://localhost:4000/api/v1/machines \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MAHALE_TOKEN" \
  -d '{"machine_code":"M-INJ-002","machine_name":"Injection Molding M2","department":"Molding","machine_type":"Injection","status":"ACTIVE"}'
```

### Step 13.5: Data Isolation Validation

**Critical Test**: Login as `achme_admin` and verify:

```bash
# As Achme — should see only Achme machines
ACHME_TOKEN=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_admin","password":"Test@1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

echo "=== Achme's Machines ==="
curl -s http://localhost:4000/api/v1/machines \
  -H "Authorization: Bearer $ACHME_TOKEN" | python3 -m json.tool

echo "=== Mahale's Machines ==="
curl -s http://localhost:4000/api/v1/machines \
  -H "Authorization: Bearer $MAHALE_TOKEN" | python3 -m json.tool
```

**Expected**: Each tenant only sees their own machines. No cross-contamination.

### Validation Checklist
- [ ] Tenant B self-signup succeeds
- [ ] Tenant B users created successfully
- [ ] Tenant B machines are separate from Tenant A
- [ ] Tenant B shifts are separate from Tenant A
- [ ] Logging in as `achme_admin` does NOT show Mahale's data
- [ ] Logging in as `mahale_admin` does NOT show Achme's data
- [ ] Dashboard numbers are different for each tenant
- [ ] Users list only shows same-tenant users

---

## 14. Flow 12 — Backup & Data Export (Admin)

> **Login as**: `achme_admin` / `Test@1234`

### Step 14.1: Check Backup Capabilities

```bash
curl -s http://localhost:4000/api/v1/tenant-backups/capabilities \
  -H "Authorization: Bearer $ACHME_TOKEN" | python3 -m json.tool
```

**Expected for FREE plan**:
```json
{
  "plan": "FREE",
  "capabilities": {
    "dataExport": { "available": true },
    "cloudBackup": { "available": false, "requiresPlan": "STARTER" },
    "googleDrive": { "available": true, "connected": false }
  }
}
```

### Step 14.2: Download Data Export (All Plans)

Via Web:
1. Login as `achme_admin`
2. Go to **Settings** → **Backup & Data** tab
3. Click **Export & Download**
4. JSON file downloads automatically

Via API:
```bash
# Create export
EXPORT=$(curl -s http://localhost:4000/api/v1/tenant-backups/export \
  -X POST \
  -H "Authorization: Bearer $ACHME_TOKEN")
echo $EXPORT | python3 -m json.tool

# Download the file
BACKUP_ID=$(echo $EXPORT | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).backup.id')
curl -O http://localhost:4000/api/v1/tenant-backups/$BACKUP_ID/download \
  -H "Authorization: Bearer $ACHME_TOKEN"
```

**Expected**: Downloads a `.json` file containing all your tenant data (users, machines, shifts, plans, logs).

### Step 14.3: Cloud Backup (Paid Plans Only)

```bash
# This will FAIL on FREE plan:
curl -s http://localhost:4000/api/v1/tenant-backups/cloud \
  -X POST \
  -H "Authorization: Bearer $ACHME_TOKEN"
# Expected: { "error": "Cloud backup requires Starter plan or higher" }

# Upgrade to STARTER, then try again — it will succeed
```

### Step 14.4: Google Drive Backup

```bash
# Get auth URL (will fail without Google OAuth credentials)
curl -s http://localhost:4000/api/v1/tenant-backups/gdrive/auth-url \
  -H "Authorization: Bearer $ACHME_TOKEN"
# Expected: { "error": "Google Drive integration is not configured" }
# This is expected — you need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars
```

> **To test Google Drive fully**, set these environment variables before starting the API:
> ```bash
> export GOOGLE_CLIENT_ID="your-google-client-id"
> export GOOGLE_CLIENT_SECRET="your-google-client-secret"  
> export GOOGLE_REDIRECT_URI="http://localhost:4000/api/v1/tenant-backups/gdrive/callback"
> ```

### Step 14.5: View Backup History

Via Web: Settings → Backup & Data → "Backup History" section shows all past exports.

Via API:
```bash
curl -s http://localhost:4000/api/v1/tenant-backups \
  -H "Authorization: Bearer $ACHME_TOKEN" | python3 -m json.tool
```

### Validation Checklist
- [ ] Capabilities show correct per-plan availability
- [ ] Data export creates and downloads successfully (all plans)
- [ ] Export file contains correct data (open the JSON, verify machines/shifts/users are there)
- [ ] Cloud backup blocked for FREE plan with upgrade message
- [ ] Cloud backup works on STARTER+ (encrypted, 90-day retention)
- [ ] Google Drive shows "not configured" without OAuth creds
- [ ] Backup history lists all past backups
- [ ] Can delete a backup from history
- [ ] Backup & Data tab only visible to ADMIN role

---

## 15. Flow 13 — Plan Upgrade & Downgrade

> **Login as**: `achme_admin`

### Step 15.1: View Available Plans

```bash
curl -s http://localhost:4000/api/v1/billing/plans | python3 -m json.tool
```

### Step 15.2: Upgrade from FREE to STARTER

```bash
curl -s http://localhost:4000/api/v1/billing/subscription/change-plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHME_TOKEN" \
  -d '{"plan_code":"STARTER"}'
```

**Verify After Upgrade**:
```bash
curl -s http://localhost:4000/api/v1/auth/account \
  -H "Authorization: Bearer $ACHME_TOKEN" | python3 -m json.tool
# plan should be "STARTER", max_users=10, max_machines=10
```

### Step 15.3: Upgrade from STARTER to ENTERPRISE

```bash
curl -s http://localhost:4000/api/v1/billing/subscription/change-plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHME_TOKEN" \
  -d '{"plan_code":"ENTERPRISE"}'
```

### Step 15.4: Downgrade from ENTERPRISE to FREE

```bash
curl -s http://localhost:4000/api/v1/billing/subscription/change-plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHME_TOKEN" \
  -d '{"plan_code":"FREE"}'
```

**Verify After Downgrade**:
- Data is NOT deleted
- All machines/shifts/plans still visible (read-only)
- Cannot create new data (see Flow 14)
- Max users/machines reduced

### Validation Checklist
- [ ] Can view all available plans
- [ ] Upgrade works — limits increase immediately
- [ ] New features become available after upgrade (Downtime, Reports)
- [ ] Downgrade works — limits decrease
- [ ] Existing data preserved after downgrade
- [ ] Features get locked after downgrade (Downtime → blocked)
- [ ] Immediate effect on current session

---

## 16. Flow 14 — FREE Plan Read-Only Enforcement

> **Login as**: `achme_admin` (after downgrading to FREE plan)

### Step 16.1: Verify Read Access Works

```bash
# These should all return 200 with data
curl -s http://localhost:4000/api/v1/machines -H "Authorization: Bearer $ACHME_TOKEN"
curl -s http://localhost:4000/api/v1/shifts -H "Authorization: Bearer $ACHME_TOKEN"
curl -s http://localhost:4000/api/v1/plans -H "Authorization: Bearer $ACHME_TOKEN"
curl -s http://localhost:4000/api/v1/dashboard -H "Authorization: Bearer $ACHME_TOKEN"
```

### Step 16.2: Verify Write Access Blocked

```bash
# POST — should return 403
curl -s http://localhost:4000/api/v1/machines \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHME_TOKEN" \
  -d '{"machine_code":"NEW-001","machine_name":"Test","machine_type":"CNC","department":"Test","status":"ACTIVE"}'

# PUT — should return 403
curl -s http://localhost:4000/api/v1/machines/1 \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACHME_TOKEN" \
  -d '{"machine_name":"Updated Name"}'

# DELETE — should return 403
curl -s http://localhost:4000/api/v1/machines/1 \
  -X DELETE \
  -H "Authorization: Bearer $ACHME_TOKEN"
```

**Expected Error Response**:
```json
{
  "success": false,
  "error": "Your Free plan is read-only for production data. Upgrade your plan to create or modify records.",
  "code": "FREE_PLAN_READ_ONLY",
  "currentPlan": "FREE",
  "allowedAction": "VIEW",
  "upgradeUrl": "/settings/billing"
}
```

### Via Web App

1. Login as `achme_admin` (on FREE plan)
2. Go to **Machines** → Try to click **Add Machine**
3. **Expected**: Error toast/message saying "read-only" or form submission blocked
4. Try to edit an existing machine → Should be blocked
5. All data should still be visible and browseable

### Validation Checklist
- [ ] GET requests work (200) — can view all data
- [ ] POST requests blocked (403) — cannot create
- [ ] PUT requests blocked (403) — cannot edit
- [ ] DELETE requests blocked (403) — cannot delete
- [ ] Error message mentions "Free plan" and "read-only"
- [ ] Upgrade URL provided in error
- [ ] Auth routes still work (can change password, manage users)
- [ ] After upgrading plan → write access restored immediately

---

## 17. Flow 15 — Settings & Appearance

> **Login as**: any user

### Step 17.1: Test Appearance Settings

1. Go to **Settings** → **Appearance** tab
2. Change theme (Light / Dark / System)
3. **Expected**: Theme changes immediately

### Step 17.2: Test Compliance Settings (ADMIN/SUPERVISOR only)

1. Go to **Settings** → **Compliance** tab (visible to ADMIN/SUPERVISOR only)
2. Toggle Validation Mode

### Step 17.3: Test Backup & Data Tab (ADMIN only)

1. Go to **Settings** → **Backup & Data** tab
2. **Expected**: Only visible to ADMIN role users
3. See three action cards: Download Export, Cloud Backup, Google Drive

### Validation Checklist
- [ ] Appearance tab visible to all users
- [ ] Theme changes persist across page reload
- [ ] Compliance tab visible to ADMIN/SUPERVISOR only
- [ ] Backup tab visible to ADMIN only
- [ ] Operators see only Appearance tab

---

## 18. Flow 16 — Platform Admin — Tenant Management

> **Login as**: `platform_admin` / `admin123!`

### Step 18.1: View All Tenants

1. Login as platform admin
2. Navigate to **Tenants** page
3. **Expected**: Shows Achme Manufacturing and Mahale Industries

### Via API

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants \
  -H "Authorization: Bearer $SUPER" | python3 -m json.tool
```

### Step 18.2: View Tenant Details

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID \
  -H "Authorization: Bearer $SUPER" | python3 -m json.tool
```

Shows: users, machines, usage, plan, trial end date, limits, recent activity.

### Step 18.3: Suspend a Tenant

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID/suspend \
  -X POST \
  -H "Authorization: Bearer $SUPER"
```

**Verify**: Suspended tenant users can no longer login.

### Step 18.4: Extend Trial

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID/extend-trial \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER" \
  -d '{"days": 30}'
```

### Step 18.5: Change Tenant Plan

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID/plan \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER" \
  -d '{"plan": "ENTERPRISE"}'
```

### Step 18.6: Impersonate a Tenant Admin

```bash
curl -s http://localhost:4000/api/v1/super-admin/impersonate \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER" \
  -d '{"tenant_id": TENANT_ID, "reason": "Testing backup feature"}'
```

Returns a 1-hour impersonation token. Use it to act as the tenant admin.

### Step 18.7: Export Tenant Data as CSV

```bash
curl -s http://localhost:4000/api/v1/super-admin/tenants/TENANT_ID/export-csv \
  -H "Authorization: Bearer $SUPER" > tenant_export.csv
```

### Validation Checklist
- [ ] Platform admin can list all tenants
- [ ] Can view detailed tenant info (users, usage, plan)
- [ ] Can suspend/activate tenants
- [ ] Can extend trial periods
- [ ] Can change tenant plans
- [ ] Can impersonate tenant admins
- [ ] Can export tenant data
- [ ] Regular tenant users CANNOT access platform admin endpoints

---

## 19. Flow 17 — User Management & Role Permissions

> Test what each role CAN and CANNOT do.

### Permission Matrix

| Action | ADMIN | SUPERVISOR | OPERATOR |
|--------|-------|-----------|----------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Machines | ✅ | ✅ | ✅ |
| Create/Edit Machine | ✅ | ✅ | ❌ |
| Delete Machine | ✅ | ❌ | ❌ |
| View Shifts | ✅ | ✅ | ❌ (page hidden) |
| Create/Edit Shift | ✅ | ✅ | ❌ |
| Delete Shift | ✅ | ❌ | ❌ |
| View Plans | ✅ | ✅ | ✅ |
| Create/Edit Plan | ✅ | ✅ | ❌ |
| Delete Plan | ✅ | ❌ | ❌ |
| Change Plan Status | ✅ | ✅ | ✅ |
| Log Production | ✅ | ✅ | ✅ |
| View Downtime | ✅ | ✅ | ✅ |
| Log Downtime | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ❌ (page hidden) |
| View Users | ✅ | ✅ | ❌ (page hidden) |
| Create/Edit Users | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| Settings - Appearance | ✅ | ✅ | ✅ |
| Settings - Compliance | ✅ | ✅ | ❌ |
| Settings - Backup | ✅ | ❌ | ❌ |
| Data Export | ✅ | ❌ | ❌ |

### Validation Steps

1. **Login as `achme_operator1`**:
   - [ ] Sidebar shows: Dashboard, Plans, Machines (only)
   - [ ] Cannot see Shifts, Reports, Users in sidebar
   - [ ] Can view machines list
   - [ ] Cannot add/edit/delete machines (button hidden or disabled)
   - [ ] Can view plans
   - [ ] Can log production entries
   - [ ] Can change plan status
   - [ ] Settings shows only Appearance tab

2. **Login as `achme_supervisor1`**:
   - [ ] Sidebar shows: Dashboard, Plans, Machines, Shifts, Reports
   - [ ] Can create machines
   - [ ] Can create shifts
   - [ ] Can create plans
   - [ ] Cannot delete machines/shifts/plans
   - [ ] Can view reports
   - [ ] Settings shows Appearance + Compliance tabs

3. **Login as `achme_admin`**:
   - [ ] Sidebar shows: Everything
   - [ ] Can create/edit/delete machines, shifts, plans
   - [ ] Can manage users
   - [ ] Settings shows all tabs including Backup & Data

---

## 20. Flow 18 — Trial Expiry Auto-Downgrade

> **This tests the complete lifecycle: Signup → Trial → Expiry → Auto-downgrade → Read-only.**

### Step 20.1: Simulate Trial Expiry

> Since the trial is 14 days, you can fast-forward using the Platform Admin:

```bash
# Login as platform admin
SUPER=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"platform_admin","password":"admin123!"}' | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Get Achme's tenant_id
TENANTS=$(curl -s http://localhost:4000/api/v1/super-admin/tenants \
  -H "Authorization: Bearer $SUPER")
echo $TENANTS | python3 -m json.tool
# Note the tenant_id for Achme

# Set trial_ends_at to yesterday (force expire)
# Use the database directly:
cd /Users/hemantsinghnagarkoti/Documents/projects/zipybills && node -e "
const pg = require('pg');
const pool = new pg.Pool({ host: 'localhost', port: 5432, database: 'factory_os', user: 'postgres', password: 'postgres' });
pool.query(\"UPDATE tenants SET trial_ends_at = NOW() - INTERVAL '1 day' WHERE tenant_slug = 'achme'\")
  .then(() => { console.log('Trial expired for Achme'); return pool.end(); })
  .catch(e => { console.error('ERR:', e.message); return pool.end(); });
"
```

### Step 20.2: Login Again — Verify Auto-Downgrade

```bash
curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_admin","password":"Test@1234"}' | python3 -m json.tool
```

**Expected**: Login succeeds but the response should show:
- `plan`: `"FREE"`
- `status`: `"ACTIVE"` (downgraded from TRIAL)
- `max_users`: `3`
- `max_machines`: `2`

### Step 20.3: Verify Read-Only Mode

Same as Flow 14 — all GET requests work, all POST/PUT/DELETE blocked on data routes.

### Step 20.4: Verify Data Intact

```bash
# All data still there
curl -s http://localhost:4000/api/v1/machines \
  -H "Authorization: Bearer $ACHME_TOKEN" | python3 -m json.tool
# Should return all machines created before trial expired
```

### Full Lifecycle Validation Checklist
- [ ] New signup gets 14-day trial (TRIAL status)
- [ ] During trial: all features work (based on initial plan)
- [ ] After trial expires: next login triggers auto-downgrade
- [ ] Downgraded to FREE plan
- [ ] All historical data preserved (not deleted)
- [ ] Can VIEW all data (read-only)
- [ ] Cannot CREATE/EDIT/DELETE production data
- [ ] Dashboard still shows historical metrics
- [ ] Backup/Export still available (can download their data)
- [ ] Upgrading plan restores full access immediately

---

## 21. Quick Reference — API Cheat Sheet

### Login Commands

```bash
# Platform Admin
SUPER=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"platform_admin","password":"admin123!"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Tenant Admin (Achme)
ACHME=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_admin","password":"Test@1234"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Operator (Achme)
OP=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"achme_operator1","password":"Test@1234"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')

# Tenant Admin (Mahale)
MAHALE=$(curl -s http://localhost:4000/api/v1/saas/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mahale_admin","password":"Test@1234"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).token')
```

### Quick Health Checks

```bash
# API Health
curl http://localhost:4000/api/health

# Current User Info
curl http://localhost:4000/api/v1/auth/me -H "Authorization: Bearer $TOKEN"

# Account & Plan Info
curl http://localhost:4000/api/v1/auth/account -H "Authorization: Bearer $TOKEN"

# Available Plans
curl http://localhost:4000/api/v1/billing/plans

# Feature Status
curl http://localhost:4000/api/features
```

### Execution Order

For a complete end-to-end test, follow the flows in this order:

```
1. Start servers (Flow 2 - Prerequisites)
2. Platform Admin login (Flow 1)
3. Achme signup (Flow 2)
4. Upgrade Achme to STARTER (Flow 13)
5. Create Achme users (Flow 3) ← requires STARTER for 5+ users
6. Create shifts (Flow 4)
7. Create machines (Flow 5) ← requires STARTER for 4 machines
8. Create production plans as Supervisor (Flow 6)
9. Log production as Operators (Flow 7)
10. Log downtime (Flow 8) ← requires STARTER
11. Check dashboard (Flow 9)
12. Check reports (Flow 10) ← requires STARTER
13. Setup Tenant B (Flow 11)
14. Verify data isolation (Flow 11, step 5)
15. Test backups (Flow 12)
16. Downgrade to FREE (Flow 13)
17. Verify read-only (Flow 14)
18. Test settings (Flow 15)
19. Platform admin operations (Flow 16)
20. Role permissions audit (Flow 17)
21. Trial expiry simulation (Flow 18)
```

---

## Mobile Testing Notes (iOS)

All the above flows work identically on iOS Simulator or device. Key differences:

- **Navigation**: Bottom tab bar instead of sidebar
- **Forms**: Native keyboard with proper input types
- **Downloads**: Export downloads may prompt "Open in Files" on iOS
- **Google Drive OAuth**: Opens in system browser, redirects back to app
- **Theme**: Follows iOS system dark mode setting (unless overridden in Settings)

To test on iOS:
```bash
cd apps/factoryOS && npx expo start --ios --port 8081
```

Open the app in Simulator, then follow the same login/flow steps as web.

---

*End of Manual Testing Plan*
