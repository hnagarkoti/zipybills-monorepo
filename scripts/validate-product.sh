#!/usr/bin/env bash
# ─── FactoryOS Product Validation ─────────────
# Tests: API health, versioning, auth, features, admin, feature-flags, backward compat
set -euo pipefail

BASE="http://localhost:4000"
PASS=0
FAIL=0
WARN=0

green()  { printf "\033[32m✅ %s\033[0m\n" "$1"; }
red()    { printf "\033[31m❌ %s\033[0m\n" "$1"; }
yellow() { printf "\033[33m⚠️  %s\033[0m\n" "$1"; }
header() { printf "\n\033[1;36m━━━ %s ━━━\033[0m\n" "$1"; }

assert_status() {
  local label="$1" url="$2" expected="$3" method="${4:-GET}" body="${5:-}"
  local status
  if [ "$method" = "POST" ] || [ "$method" = "PATCH" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" ${body:+-d "$body"} ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" ${TOKEN:+-H "Authorization: Bearer $TOKEN"})
  fi
  if [ "$status" = "$expected" ]; then
    green "$label → $status"
    PASS=$((PASS+1))
  else
    red "$label → expected $expected, got $status"
    FAIL=$((FAIL+1))
  fi
}

assert_json_field() {
  local label="$1" url="$2" field="$3" expected="$4"
  local value
  value=$(curl -s "$url" ${TOKEN:+-H "Authorization: Bearer $TOKEN"} | python3 -c "import sys,json; d=json.load(sys.stdin); print(d${field})" 2>/dev/null || echo "__ERROR__")
  if [ "$value" = "$expected" ]; then
    green "$label → $field=$value"
    PASS=$((PASS+1))
  else
    red "$label → expected $field=$expected, got $value"
    FAIL=$((FAIL+1))
  fi
}

assert_header() {
  local label="$1" url="$2" header_name="$3" expected="$4"
  local value
  value=$(curl -s -D - -o /dev/null "$url" ${TOKEN:+-H "Authorization: Bearer $TOKEN"} 2>/dev/null | grep -i "^${header_name}:" | sed 's/^[^:]*: //' | tr -d '\r')
  if [ "$value" = "$expected" ]; then
    green "$label → $header_name: $value"
    PASS=$((PASS+1))
  else
    red "$label → expected $header_name=$expected, got '$value'"
    FAIL=$((FAIL+1))
  fi
}

TOKEN=""

# ═══════════════════════════════════════════════
header "1. HEALTH & STATUS"

assert_status "GET /api/health" "$BASE/api/health" "200"
assert_json_field "Health: success" "$BASE/api/health" "['success']" "True"
assert_status "GET /api/features" "$BASE/api/features" "200"
assert_json_field "Features: 7 total" "$BASE/api/features" "['features'].__len__()" "7"

# ═══════════════════════════════════════════════
header "2. API VERSION HEADER"

assert_header "X-Api-Version on /api/health" "$BASE/api/health" "x-api-version" "v1"

# ═══════════════════════════════════════════════
header "3. AUTH FLOW"

# Login via versioned endpoint
assert_status "POST /api/v1/auth/login" "$BASE/api/v1/auth/login" "200" "POST" '{"username":"admin","password":"admin123"}'

# Capture token
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
  green "Auth token obtained (${#TOKEN} chars)"
  PASS=$((PASS+1))
else
  red "Failed to obtain auth token"
  FAIL=$((FAIL+1))
fi

# Login via backward-compat (unversioned) endpoint
assert_status "POST /api/auth/login (compat)" "$BASE/api/auth/login" "200" "POST" '{"username":"admin","password":"admin123"}'

# Me endpoint
assert_status "GET /api/v1/auth/me" "$BASE/api/v1/auth/me" "200"
assert_json_field "Auth me: username" "$BASE/api/v1/auth/me" "['user']['username']" "admin"

# ═══════════════════════════════════════════════
header "4. VERSIONED FEATURE ROUTES"

assert_status "GET /api/v1/machines" "$BASE/api/v1/machines" "200"
assert_status "GET /api/v1/shifts" "$BASE/api/v1/shifts" "200"
assert_status "GET /api/v1/plans" "$BASE/api/v1/plans" "200"
assert_status "GET /api/v1/downtime" "$BASE/api/v1/downtime" "200"
assert_status "GET /api/v1/dashboard" "$BASE/api/v1/dashboard" "200"
assert_status "GET /api/v1/reports/production" "$BASE/api/v1/reports/production?start_date=2025-01-01&end_date=2026-12-31" "200"

# ═══════════════════════════════════════════════
header "5. BACKWARD COMPAT (unversioned)"

assert_status "GET /api/machines (compat)" "$BASE/api/machines" "200"
assert_status "GET /api/shifts (compat)" "$BASE/api/shifts" "200"
assert_status "GET /api/dashboard (compat)" "$BASE/api/dashboard" "200"

# ═══════════════════════════════════════════════
header "6. FEATURE ADMIN API"

assert_status "GET /api/v1/admin/features (list)" "$BASE/api/v1/admin/features" "200"
assert_json_field "Admin: machines feature exists" "$BASE/api/v1/admin/features" "['statusMap']['machines']['api']" "ENABLED"

# Get single feature
assert_status "GET /api/v1/admin/features/machines" "$BASE/api/v1/admin/features/machines" "200"

# ═══════════════════════════════════════════════
header "7. FEATURE FLAG: DISABLE → 503 → RE-ENABLE"

# Disable machines feature
assert_status "POST disable machines" "$BASE/api/v1/admin/features/machines/disable" "200" "POST"

# Machines should now return 503 (versioned)
assert_status "GET /api/v1/machines (disabled → 503)" "$BASE/api/v1/machines" "503"

# Machines should also be 503 on compat route
assert_status "GET /api/machines (disabled compat → 503)" "$BASE/api/machines" "503"

# Other features should still work
assert_status "GET /api/v1/shifts (still OK)" "$BASE/api/v1/shifts" "200"

# Re-enable machines
assert_status "POST enable machines" "$BASE/api/v1/admin/features/machines/enable" "200" "POST"

# Machines should work again
assert_status "GET /api/v1/machines (re-enabled → 200)" "$BASE/api/v1/machines" "200"

# ═══════════════════════════════════════════════
header "8. UI-ONLY DISABLE"

# Disable machines UI only
assert_status "POST disable-ui machines" "$BASE/api/v1/admin/features/machines/disable-ui" "200" "POST"

# API should still work (only UI disabled)
assert_status "GET /api/v1/machines (ui-only disabled, api OK)" "$BASE/api/v1/machines" "200"

# Check the feature status shows UI disabled
assert_json_field "machines ui=DISABLED" "$BASE/api/v1/admin/features/machines" "['feature']['ui']" "DISABLED"
assert_json_field "machines api=ENABLED" "$BASE/api/v1/admin/features/machines" "['feature']['api']" "ENABLED"

# Re-enable
assert_status "POST enable machines" "$BASE/api/v1/admin/features/machines/enable" "200" "POST"

# ═══════════════════════════════════════════════
header "9. API-ONLY DISABLE"

# Disable machines API only
assert_status "POST disable-api machines" "$BASE/api/v1/admin/features/machines/disable-api" "200" "POST"

# API should return 503
assert_status "GET /api/v1/machines (api-disabled → 503)" "$BASE/api/v1/machines" "503"

# Check status
assert_json_field "machines api=DISABLED" "$BASE/api/v1/admin/features/machines" "['feature']['api']" "DISABLED"
assert_json_field "machines ui=ENABLED" "$BASE/api/v1/admin/features/machines" "['feature']['ui']" "ENABLED"

# Re-enable
assert_status "POST enable machines" "$BASE/api/v1/admin/features/machines/enable" "200" "POST"
assert_status "GET /api/v1/machines (final check)" "$BASE/api/v1/machines" "200"

# ═══════════════════════════════════════════════
header "10. DEPRECATE FEATURE"

assert_status "POST deprecate reports" "$BASE/api/v1/admin/features/reports/deprecate" "200" "POST" '{"sunsetAt":"2026-06-01"}'
assert_json_field "reports api=DEPRECATED" "$BASE/api/v1/admin/features/reports" "['feature']['api']" "DEPRECATED"

# Deprecated should still serve traffic (200) but add Deprecation header
assert_status "GET /api/v1/reports/production (deprecated → 200)" "$BASE/api/v1/reports/production?start_date=2025-01-01&end_date=2026-12-31" "200"

# Re-enable
assert_status "POST enable reports" "$BASE/api/v1/admin/features/reports/enable" "200" "POST"

# ═══════════════════════════════════════════════
header "11. PATCH FEATURE (arbitrary update)"

assert_status "PATCH machines apiVersion" "$BASE/api/v1/admin/features/machines" "200" "PATCH" '{"apiVersion":"v2"}'
assert_json_field "machines version=v2" "$BASE/api/v1/admin/features/machines" "['feature']['apiVersion']" "v2"

# Reset
assert_status "PATCH machines back to v1" "$BASE/api/v1/admin/features/machines" "200" "PATCH" '{"apiVersion":"v1"}'

# ═══════════════════════════════════════════════
printf "\n\033[1;37m═══════════════════════════════════════════════\033[0m\n"
printf "\033[1;32m PASSED: %d\033[0m  |  \033[1;31mFAILED: %d\033[0m  |  \033[1;33mWARNED: %d\033[0m\n" "$PASS" "$FAIL" "$WARN"
printf "\033[1;37m═══════════════════════════════════════════════\033[0m\n"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo "🎉 All validations passed!"
