#!/bin/bash
# FactoryOS Comprehensive Validation Script
# Tests all Phase 1, 2, 3 endpoints

BASE="http://localhost:4000"
PASS=0
FAIL=0
WARN=0

# Get auth token
TOKEN=$(curl -s "$BASE/api/v1/auth/login" -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "FATAL: Could not get auth token"
  exit 1
fi

check() {
  local label="$1"
  local method="$2"
  local url="$3"
  local expected_code="$4"
  local auth="$5"
  local body="$6"

  local args=("-s" "-o" "/tmp/validate_response.json" "-w" "%{http_code}" "-X" "$method")
  
  if [ "$auth" = "yes" ]; then
    args+=("-H" "Authorization: Bearer $TOKEN")
  fi
  
  if [ -n "$body" ]; then
    args+=("-H" "Content-Type: application/json" "-d" "$body")
  fi

  local code=$(curl "${args[@]}" "$BASE$url")
  
  if [ "$code" = "$expected_code" ]; then
    echo "  ✅ $label — HTTP $code"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label — Expected $expected_code, got $code"
    # Show response body on failure
    cat /tmp/validate_response.json 2>/dev/null | head -1
    echo ""
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     FactoryOS Full Validation Report         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

echo "─── HEALTH & META ─────────────────────────────"
check "Health Check"       GET  "/api/health"      200 no
check "Feature Registry"   GET  "/api/features"    200 no

echo ""
echo "─── PHASE 1: MVP ────────────────────────────── "
check "Auth Login"         POST "/api/v1/auth/login" 200 no '{"username":"admin","password":"admin123"}'
check "Get Users"          GET  "/api/v1/users"        200 yes
check "Machines List"      GET  "/api/v1/machines"     200 yes
check "Shifts List"        GET  "/api/v1/shifts"       200 yes
check "Planning List"      GET  "/api/v1/plans"        200 yes
check "Downtime List"      GET  "/api/v1/downtime"     200 yes
check "Dashboard"          GET  "/api/v1/dashboard"    200 yes
check "Reports Production" GET  "/api/v1/reports/production?start_date=2026-01-01&end_date=2026-12-31" 200 yes
check "Theme Available"    GET  "/api/v1/available"    200 yes

echo ""
echo "─── PHASE 2: ENTERPRISE ─────────────────────── "
check "License Status"     GET  "/api/v1/license/status"    200 yes
check "Permissions (me)"   GET  "/api/v1/permissions/me"    200 yes
check "Audit Logs"         GET  "/api/v1/audit/logs"        200 yes
check "Backups List"       GET  "/api/v1/backups"           200 yes
check "Admin Dashboard"    GET  "/api/v1/admin/dashboard"   200 yes
check "Export Production"  GET  "/api/v1/export/production?start_date=2026-01-01&end_date=2026-12-31" 200 yes

echo ""
echo "─── PHASE 3: SAAS CONVERSION ────────────────── "
check "Billing Plans (public)" GET "/api/v1/billing/plans"  200 no
check "SaaS Plans (public)"    GET "/api/v1/saas/plans"     200 no
check "Check Slug"         POST "/api/v1/saas/check-slug"   200 no '{"slug":"test-company"}'
check "Check Username"     POST "/api/v1/saas/check-username" 200 no '{"username":"new_user_test"}'
check "Tenants (admin)"    GET  "/api/v1/tenants"           200 yes
check "Tenant Self"        GET  "/api/v1/tenant/me"         200 yes
check "SaaS Dash (no admin)" GET "/api/v1/saas-dashboard/overview" 403 yes

# Test self-signup
echo ""
echo "─── PHASE 3: SELF-SIGNUP FLOW ───────────────── "
RAND=$(python3 -c "import random,string; print(''.join(random.choices(string.ascii_lowercase+string.digits,k=6)))")
SIGNUP_RESULT=$(curl -s "$BASE/api/v1/saas/signup" -H "Content-Type: application/json" \
  -d "{\"company_name\":\"Validate $RAND\",\"slug\":\"validate-$RAND\",\"admin_username\":\"admin_$RAND\",\"admin_password\":\"test123\",\"admin_full_name\":\"Admin $RAND\"}")
SIGNUP_SUCCESS=$(echo "$SIGNUP_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success', d.get('error','')))" 2>/dev/null)

if echo "$SIGNUP_SUCCESS" | grep -q "True\|true"; then
  echo "  ✅ Self-Signup — Created tenant"
  PASS=$((PASS + 1))
  
  # Extract tenant token
  TENANT_TOKEN=$(echo "$SIGNUP_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
  
  if [ -n "$TENANT_TOKEN" ]; then
    echo ""
    echo "─── PHASE 3: TENANT-SCOPED OPS ──────────────── "
    # Test tenant-scoped endpoints with new tenant token
    check "Tenant Self Info"    GET "/api/v1/tenant/me"        200 yes
    check "Tenant Users"        GET "/api/v1/tenant/me/users"  200 yes
    check "Tenant Usage"        GET "/api/v1/tenant/me/usage"  200 yes
    
    # Override TOKEN temporarily for billing tests
    OLD_TOKEN=$TOKEN
    TOKEN=$TENANT_TOKEN
    
    check "Create Subscription" POST "/api/v1/billing/subscription" 201 yes '{"plan_code":"starter","billing_cycle":"MONTHLY"}'
    check "Get Subscription"    GET  "/api/v1/billing/subscription" 200 yes
    check "Generate Invoice"    POST "/api/v1/billing/invoices/generate" 201 yes
    check "Get Invoices"        GET  "/api/v1/billing/invoices"    200 yes
    check "Record Usage"        POST "/api/v1/billing/usage/record" 200 yes
    check "Get Usage History"   GET  "/api/v1/billing/usage"       200 yes
    
    TOKEN=$OLD_TOKEN
  fi
elif echo "$SIGNUP_SUCCESS" | grep -qi "already"; then
  echo "  ⚠️  Self-Signup — Tenant already exists (expected on re-run)"
  WARN=$((WARN + 1))
else
  echo "  ❌ Self-Signup — Failed: $SIGNUP_SUCCESS"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  RESULTS: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo "════════════════════════════════════════════════"
echo ""

# Cleanup
rm -f /tmp/validate_response.json

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
