#!/usr/bin/env python3
"""
FactoryOS – Comprehensive Seed Data Script
Creates realistic factory data for demonstration & validation.

Usage:
    python3 scripts/seed-factory-data.py

Requires:
    - API Gateway running on http://localhost:4000
    - PostgreSQL with factory_os database
    - Default admin account (admin / admin123)
"""
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta

BASE = "http://localhost:4000"
TOKEN = ""

# ─── Helpers ──────────────────────────────────

def api(method, path, data=None, token=None):
    """Make an API request and return parsed JSON."""
    url = f"{BASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode() if e.fp else ""
        return {"success": False, "error": f"HTTP {e.code}: {body_text[:200]}"}

def ok(msg):
    print(f"  \033[32m✅ {msg}\033[0m")

def fail(msg):
    print(f"  \033[31m❌ {msg}\033[0m")

def header(msg):
    print(f"\n\033[1;36m{'━' * 50}")
    print(f"  {msg}")
    print(f"{'━' * 50}\033[0m")

# ═══════════════════════════════════════════════
# 0. HEALTH CHECK
# ═══════════════════════════════════════════════
header("0. HEALTH CHECK")
try:
    health = api("GET", "/api/health")
    if health.get("success"):
        ok(f"API is healthy – {health.get('service', 'unknown')}")
    else:
        fail("API health check failed")
        sys.exit(1)
except Exception as e:
    fail(f"Cannot reach API on {BASE}: {e}")
    sys.exit(1)

# ═══════════════════════════════════════════════
# 1. LOGIN AS ADMIN
# ═══════════════════════════════════════════════
header("1. LOGIN AS ADMIN")
login_resp = api("POST", "/api/v1/auth/login", {"username": "admin", "password": "admin123"})
if not login_resp.get("token"):
    fail(f"Login failed: {login_resp}")
    sys.exit(1)
TOKEN = login_resp["token"]
ok(f"Logged in as admin (token: {len(TOKEN)} chars)")

# ═══════════════════════════════════════════════
# 2. CREATE USERS (Supervisors + Operators)
# ═══════════════════════════════════════════════
header("2. CREATE USERS")
users = [
    {"username": "rajesh.kumar",  "password": "Pass@123", "full_name": "Rajesh Kumar",  "role": "SUPERVISOR"},
    {"username": "priya.sharma",  "password": "Pass@123", "full_name": "Priya Sharma",  "role": "SUPERVISOR"},
    {"username": "amit.patel",    "password": "Pass@123", "full_name": "Amit Patel",    "role": "OPERATOR"},
    {"username": "sunita.devi",   "password": "Pass@123", "full_name": "Sunita Devi",   "role": "OPERATOR"},
    {"username": "vikram.singh",  "password": "Pass@123", "full_name": "Vikram Singh",  "role": "OPERATOR"},
    {"username": "neha.gupta",    "password": "Pass@123", "full_name": "Neha Gupta",    "role": "OPERATOR"},
    {"username": "ravi.verma",    "password": "Pass@123", "full_name": "Ravi Verma",    "role": "OPERATOR"},
    {"username": "deepa.rani",    "password": "Pass@123", "full_name": "Deepa Rani",    "role": "OPERATOR"},
]
for u in users:
    resp = api("POST", "/api/v1/auth/register", u, TOKEN)
    if resp.get("success") or "already exists" in resp.get("error", ""):
        ok(f"Created {u['role'].lower()}: {u['full_name']}")
    else:
        fail(f"{u['full_name']}: {resp.get('error', 'unknown')}")

# ═══════════════════════════════════════════════
# 3. CREATE MACHINES (8 across departments)
# ═══════════════════════════════════════════════
header("3. CREATE MACHINES")
machines = [
    {"machine_code": "CNC-001",   "machine_name": "CNC Lathe Alpha",      "department": "Machining",  "machine_type": "CNC Lathe",         "status": "ACTIVE"},
    {"machine_code": "CNC-002",   "machine_name": "CNC Mill Beta",        "department": "Machining",  "machine_type": "CNC Mill",          "status": "ACTIVE"},
    {"machine_code": "INJ-001",   "machine_name": "Injection Molder A",   "department": "Molding",    "machine_type": "Injection Molder",  "status": "ACTIVE"},
    {"machine_code": "INJ-002",   "machine_name": "Injection Molder B",   "department": "Molding",    "machine_type": "Injection Molder",  "status": "ACTIVE"},
    {"machine_code": "PRESS-001", "machine_name": "Hydraulic Press 50T",  "department": "Pressing",   "machine_type": "Hydraulic Press",   "status": "ACTIVE"},
    {"machine_code": "WELD-001",  "machine_name": "Robotic Welder R1",    "department": "Welding",    "machine_type": "Robotic Welder",    "status": "ACTIVE"},
    {"machine_code": "PACK-001",  "machine_name": "Packaging Line 1",     "department": "Packaging",  "machine_type": "Packaging",         "status": "ACTIVE"},
    {"machine_code": "GRIND-001", "machine_name": "Surface Grinder G1",   "department": "Machining",  "machine_type": "Surface Grinder",   "status": "MAINTENANCE"},
]
for m in machines:
    resp = api("POST", "/api/v1/machines", m, TOKEN)
    if resp.get("success") or "already exists" in resp.get("error", "").lower() or "duplicate" in resp.get("error", "").lower():
        ok(f"Created: {m['machine_code']} ({m['machine_name']})")
    else:
        fail(f"{m['machine_code']}: {resp.get('error', resp)}")

# ═══════════════════════════════════════════════
# 4. VERIFY SHIFTS
# ═══════════════════════════════════════════════
header("4. VERIFY SHIFTS")
shifts_resp = api("GET", "/api/v1/shifts", token=TOKEN)
shifts = shifts_resp.get("shifts", [])
ok(f"Shifts available: {len(shifts)} ({', '.join(s['shift_name'] for s in shifts)})")

# ═══════════════════════════════════════════════
# 5. CREATE PRODUCTION PLANS
# ═══════════════════════════════════════════════
header("5. CREATE PRODUCTION PLANS")

# Get machine IDs by code
machines_resp = api("GET", "/api/v1/machines", token=TOKEN)
machine_map = {}
for m in machines_resp.get("machines", []):
    machine_map[m["machine_code"]] = m["machine_id"]

today = datetime.now().strftime("%Y-%m-%d")
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
two_days_ago = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

# Shift IDs: 1=Morning, 2=Afternoon
plans = [
    # Today – Morning shift
    {"machine_id": machine_map.get("CNC-001", 1),   "shift_id": 1, "product_name": "Shaft Bearing Housing",   "product_code": "SBH-1001", "target_quantity": 500,  "plan_date": today},
    {"machine_id": machine_map.get("CNC-002", 2),   "shift_id": 1, "product_name": "Gear Box Cover",          "product_code": "GBC-2002", "target_quantity": 300,  "plan_date": today},
    {"machine_id": machine_map.get("INJ-001", 3),   "shift_id": 1, "product_name": "Plastic Housing Cap",     "product_code": "PHC-3001", "target_quantity": 1000, "plan_date": today},
    {"machine_id": machine_map.get("INJ-002", 4),   "shift_id": 1, "product_name": "Connector Shell",         "product_code": "CS-4001",  "target_quantity": 800,  "plan_date": today},
    {"machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "product_name": "Metal Bracket A",         "product_code": "MBA-5001", "target_quantity": 600,  "plan_date": today},
    {"machine_id": machine_map.get("WELD-001", 6),  "shift_id": 1, "product_name": "Frame Assembly",          "product_code": "FA-6001",  "target_quantity": 200,  "plan_date": today},
    {"machine_id": machine_map.get("PACK-001", 7),  "shift_id": 1, "product_name": "Final Pack Unit",         "product_code": "FPU-7001", "target_quantity": 400,  "plan_date": today},
    # Today – Afternoon shift
    {"machine_id": machine_map.get("CNC-001", 1),   "shift_id": 2, "product_name": "Shaft Bearing Housing",   "product_code": "SBH-1001", "target_quantity": 450,  "plan_date": today},
    {"machine_id": machine_map.get("INJ-001", 3),   "shift_id": 2, "product_name": "Valve Body",              "product_code": "VB-3002",  "target_quantity": 750,  "plan_date": today},
    # Yesterday (completed)
    {"machine_id": machine_map.get("CNC-001", 1),   "shift_id": 1, "product_name": "Shaft Bearing Housing",   "product_code": "SBH-1001", "target_quantity": 500,  "plan_date": yesterday},
    {"machine_id": machine_map.get("CNC-002", 2),   "shift_id": 1, "product_name": "Gear Box Cover",          "product_code": "GBC-2002", "target_quantity": 300,  "plan_date": yesterday},
    {"machine_id": machine_map.get("INJ-001", 3),   "shift_id": 1, "product_name": "Plastic Housing Cap",     "product_code": "PHC-3001", "target_quantity": 1000, "plan_date": yesterday},
    # 2 Days ago (completed)
    {"machine_id": machine_map.get("CNC-001", 1),   "shift_id": 1, "product_name": "Shaft Bearing Housing",   "product_code": "SBH-1001", "target_quantity": 500,  "plan_date": two_days_ago},
    {"machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "product_name": "Metal Bracket A",         "product_code": "MBA-5001", "target_quantity": 600,  "plan_date": two_days_ago},
]

plan_ids = {}
for i, p in enumerate(plans):
    resp = api("POST", "/api/v1/plans", p, TOKEN)
    if resp.get("success"):
        plan_id = resp.get("plan", {}).get("plan_id", i + 1)
        plan_ids[i] = plan_id
        ok(f"Plan {plan_id}: {p['product_name']} ({p['target_quantity']} pcs, {p['plan_date']})")
    else:
        fail(f"Plan {i}: {resp.get('error', resp)}")

# ═══════════════════════════════════════════════
# 6. SET PLAN STATUSES
# ═══════════════════════════════════════════════
header("6. SET PLAN STATUSES")

# Today plans → IN_PROGRESS
for i in range(7):
    pid = plan_ids.get(i)
    if pid:
        api("PATCH", f"/api/v1/plans/{pid}", {"status": "IN_PROGRESS"}, TOKEN)
ok("Plans 1-7 (today morning) → IN_PROGRESS")

# Yesterday & 2-days-ago → COMPLETED
for i in range(9, 14):
    pid = plan_ids.get(i)
    if pid:
        api("PATCH", f"/api/v1/plans/{pid}", {"status": "COMPLETED"}, TOKEN)
ok("Plans 10-14 (yesterday + 2 days ago) → COMPLETED")

# ═══════════════════════════════════════════════
# 7. LOG PRODUCTION DATA
# ═══════════════════════════════════════════════
header("7. LOG PRODUCTION DATA")

production_logs = [
    # Today: CNC-001 (plan 0) target=500
    {"plan_id": plan_ids.get(0), "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 120, "quantity_ok": 118, "quantity_rejected": 2, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(0), "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 110, "quantity_ok": 107, "quantity_rejected": 3, "hour_slot": "07:00-08:00"},
    {"plan_id": plan_ids.get(0), "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 90,  "quantity_ok": 88,  "quantity_rejected": 2, "hour_slot": "08:00-09:00"},

    # Today: CNC-002 (plan 1) target=300
    {"plan_id": plan_ids.get(1), "machine_id": machine_map.get("CNC-002", 2), "shift_id": 1, "quantity_produced": 95, "quantity_ok": 92, "quantity_rejected": 3, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(1), "machine_id": machine_map.get("CNC-002", 2), "shift_id": 1, "quantity_produced": 85, "quantity_ok": 82, "quantity_rejected": 3, "hour_slot": "07:00-08:00"},

    # Today: INJ-001 (plan 2) target=1000
    {"plan_id": plan_ids.get(2), "machine_id": machine_map.get("INJ-001", 3), "shift_id": 1, "quantity_produced": 200, "quantity_ok": 195, "quantity_rejected": 5, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(2), "machine_id": machine_map.get("INJ-001", 3), "shift_id": 1, "quantity_produced": 220, "quantity_ok": 215, "quantity_rejected": 5, "hour_slot": "07:00-08:00"},
    {"plan_id": plan_ids.get(2), "machine_id": machine_map.get("INJ-001", 3), "shift_id": 1, "quantity_produced": 230, "quantity_ok": 225, "quantity_rejected": 5, "hour_slot": "08:00-09:00"},

    # Today: INJ-002 (plan 3) target=800
    {"plan_id": plan_ids.get(3), "machine_id": machine_map.get("INJ-002", 4), "shift_id": 1, "quantity_produced": 180, "quantity_ok": 176, "quantity_rejected": 4, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(3), "machine_id": machine_map.get("INJ-002", 4), "shift_id": 1, "quantity_produced": 170, "quantity_ok": 166, "quantity_rejected": 4, "hour_slot": "07:00-08:00"},
    {"plan_id": plan_ids.get(3), "machine_id": machine_map.get("INJ-002", 4), "shift_id": 1, "quantity_produced": 170, "quantity_ok": 166, "quantity_rejected": 4, "hour_slot": "08:00-09:00"},

    # Today: PRESS-001 (plan 4) target=600
    {"plan_id": plan_ids.get(4), "machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "quantity_produced": 150, "quantity_ok": 148, "quantity_rejected": 2, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(4), "machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "quantity_produced": 140, "quantity_ok": 137, "quantity_rejected": 3, "hour_slot": "07:00-08:00"},
    {"plan_id": plan_ids.get(4), "machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "quantity_produced": 110, "quantity_ok": 108, "quantity_rejected": 2, "hour_slot": "08:00-09:00"},

    # Today: WELD-001 (plan 5) target=200
    {"plan_id": plan_ids.get(5), "machine_id": machine_map.get("WELD-001", 6), "shift_id": 1, "quantity_produced": 60, "quantity_ok": 58, "quantity_rejected": 2, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(5), "machine_id": machine_map.get("WELD-001", 6), "shift_id": 1, "quantity_produced": 60, "quantity_ok": 59, "quantity_rejected": 1, "hour_slot": "07:00-08:00"},

    # Today: PACK-001 (plan 6) target=400
    {"plan_id": plan_ids.get(6), "machine_id": machine_map.get("PACK-001", 7), "shift_id": 1, "quantity_produced": 100, "quantity_ok": 99,  "quantity_rejected": 1, "hour_slot": "06:00-07:00"},
    {"plan_id": plan_ids.get(6), "machine_id": machine_map.get("PACK-001", 7), "shift_id": 1, "quantity_produced": 95,  "quantity_ok": 95,  "quantity_rejected": 0, "hour_slot": "07:00-08:00"},
    {"plan_id": plan_ids.get(6), "machine_id": machine_map.get("PACK-001", 7), "shift_id": 1, "quantity_produced": 85,  "quantity_ok": 85,  "quantity_rejected": 0, "hour_slot": "08:00-09:00"},

    # Yesterday: CNC-001 (plan 9) target=500
    {"plan_id": plan_ids.get(9),  "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 250, "quantity_ok": 245, "quantity_rejected": 5, "hour_slot": "06:00-10:00"},
    {"plan_id": plan_ids.get(9),  "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 240, "quantity_ok": 233, "quantity_rejected": 7, "hour_slot": "10:00-14:00"},
    # Yesterday: CNC-002 (plan 10) target=300
    {"plan_id": plan_ids.get(10), "machine_id": machine_map.get("CNC-002", 2), "shift_id": 1, "quantity_produced": 295, "quantity_ok": 288, "quantity_rejected": 7, "hour_slot": "06:00-14:00"},
    # Yesterday: INJ-001 (plan 11) target=1000
    {"plan_id": plan_ids.get(11), "machine_id": machine_map.get("INJ-001", 3), "shift_id": 1, "quantity_produced": 500, "quantity_ok": 488, "quantity_rejected": 12, "hour_slot": "06:00-10:00"},
    {"plan_id": plan_ids.get(11), "machine_id": machine_map.get("INJ-001", 3), "shift_id": 1, "quantity_produced": 480, "quantity_ok": 467, "quantity_rejected": 13, "hour_slot": "10:00-14:00"},

    # 2 days ago: CNC-001 (plan 12) target=500
    {"plan_id": plan_ids.get(12), "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 260, "quantity_ok": 256, "quantity_rejected": 4, "hour_slot": "06:00-10:00"},
    {"plan_id": plan_ids.get(12), "machine_id": machine_map.get("CNC-001", 1), "shift_id": 1, "quantity_produced": 250, "quantity_ok": 248, "quantity_rejected": 2, "hour_slot": "10:00-14:00"},
    # 2 days ago: PRESS-001 (plan 13) target=600
    {"plan_id": plan_ids.get(13), "machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "quantity_produced": 300, "quantity_ok": 295, "quantity_rejected": 5, "hour_slot": "06:00-10:00"},
    {"plan_id": plan_ids.get(13), "machine_id": machine_map.get("PRESS-001", 5), "shift_id": 1, "quantity_produced": 280, "quantity_ok": 275, "quantity_rejected": 5, "hour_slot": "10:00-14:00"},
]

success_count = 0
fail_count = 0
for log in production_logs:
    resp = api("POST", "/api/v1/production-logs", log, TOKEN)
    if resp.get("success"):
        success_count += 1
    else:
        fail_count += 1
ok(f"Production logs: {success_count} created, {fail_count} failed")

# ═══════════════════════════════════════════════
# 8. LOG DOWNTIME EVENTS
# ═══════════════════════════════════════════════
header("8. LOG DOWNTIME EVENTS")

now = datetime.now()
downtime_events = [
    # GRIND-001 maintenance (ongoing)
    {
        "machine_id": machine_map.get("GRIND-001", 8),
        "reason": "Scheduled preventive maintenance - bearing replacement",
        "category": "MAINTENANCE",
        "started_at": (now - timedelta(hours=8)).isoformat(),
    },
    # CNC-002 tool breakage (resolved, 2 hours)
    {
        "machine_id": machine_map.get("CNC-002", 2),
        "reason": "Tool breakage - carbide insert shattered",
        "category": "BREAKDOWN",
        "started_at": (now - timedelta(hours=4)).isoformat(),
        "ended_at": (now - timedelta(hours=2)).isoformat(),
    },
    # INJ-002 material jam (resolved, 1 hour)
    {
        "machine_id": machine_map.get("INJ-002", 4),
        "reason": "Material feed jam - hopper blockage",
        "category": "MATERIAL",
        "started_at": (now - timedelta(hours=6)).isoformat(),
        "ended_at": (now - timedelta(hours=5)).isoformat(),
    },
    # WELD-001 calibration (resolved, 30 min)
    {
        "machine_id": machine_map.get("WELD-001", 6),
        "reason": "Calibration drift detected - recalibration performed",
        "category": "QUALITY",
        "started_at": (now - timedelta(hours=3)).isoformat(),
        "ended_at": (now - timedelta(hours=2, minutes=30)).isoformat(),
    },
]

for dt in downtime_events:
    resp = api("POST", "/api/v1/downtime", dt, TOKEN)
    if resp.get("success"):
        ended = "ongoing" if not dt.get("ended_at") else "resolved"
        ok(f"Downtime: {dt['reason'][:40]}... ({ended})")
    else:
        fail(f"Downtime: {resp.get('error', resp)}")

# ═══════════════════════════════════════════════
# 9. VERIFICATION
# ═══════════════════════════════════════════════
header("9. DASHBOARD VERIFICATION")

dash = api("GET", "/api/v1/dashboard", token=TOKEN)
d = dash.get("dashboard", {})
print(f"  {'─' * 40}")
print(f"  Total Machines:    {d.get('totalMachines', 'N/A')}")
print(f"  Active Machines:   {d.get('activeMachines', 'N/A')}")
print(f"  Today Plans:       {d.get('todayPlans', 'N/A')}")
print(f"  Today Produced:    {d.get('todayProduced', 'N/A')}")
print(f"  Today Target:      {d.get('todayTarget', 'N/A')}")
print(f"  Today OK:          {d.get('todayOk', 'N/A')}")
print(f"  Today Rejected:    {d.get('todayRejected', 'N/A')}")
print(f"  Rejection Rate:    {d.get('rejectionRate', 'N/A')}%")
print(f"  Efficiency:        {d.get('efficiency', 'N/A')}%")
print(f"  Downtime (min):    {d.get('todayDowntimeMin', 'N/A')}")
print(f"  {'─' * 40}")

# Reports
header("10. REPORTS VERIFICATION")
reports_daily = api("GET", "/api/v1/reports/daily", token=TOKEN)
if reports_daily.get("success") or reports_daily.get("report"):
    ok(f"Daily report: {len(reports_daily.get('report', []))} entries")
else:
    fail(f"Daily report: {reports_daily.get('error', 'N/A')}")

# Downtime
downtime_resp = api("GET", "/api/v1/downtime", token=TOKEN)
ok(f"Downtime logs: {len(downtime_resp.get('logs', []))} entries")

# Users
users_resp = api("GET", "/api/v1/auth/users", token=TOKEN)
ok(f"Users: {len(users_resp.get('users', []))} total")

# Feature flags
header("11. FEATURE FLAGS")
features_resp = api("GET", "/api/v1/admin/features", token=TOKEN)
for f in features_resp.get("features", []):
    status = f"\033[32mENABLED\033[0m" if f.get("api") == "ENABLED" else f"\033[31mDISABLED\033[0m"
    print(f"  {f['id']:12s}  api={f.get('api'):8s}  ui={f.get('ui'):8s}  {f.get('label', '')}")

print(f"\n\033[1;32m{'═' * 50}")
print(f"  ✅ SEED DATA COMPLETE – FactoryOS is ready!")
print(f"{'═' * 50}\033[0m")
print(f"\n  Login: http://localhost:8081")
print(f"  Credentials: admin / admin123")
print(f"  API: http://localhost:4000/api/v1/...")
print()
