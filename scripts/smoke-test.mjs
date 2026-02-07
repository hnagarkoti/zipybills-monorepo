#!/usr/bin/env node

/**
 * Quick API smoke test – run while `pnpm dev:factory-api` is up on port 4000.
 * Also works standalone: will wait up to 10s for the API to become available.
 */

const BASE = 'http://localhost:4000';

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  return res.json();
}

async function waitForServer(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(`${BASE}/api/health`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function main() {
  console.log('🧪 FactoryOS API Smoke Tests\n');
  console.log('   Waiting for API on port 4000...');

  const ready = await waitForServer();
  if (!ready) {
    console.error('   ❌ API not reachable on port 4000. Start it with: pnpm dev:factory-api');
    process.exit(1);
  }
  console.log('   ✅ API is up!\n');

  let passed = 0;
  let failed = 0;

  function check(label, condition) {
    if (condition) { passed++; } else { failed++; }
    console.log(`  ${condition ? '✅' : '❌'} ${label}`);
  }

  // 1. Health
  const health = await api('/api/health');
  check(`Health:     ${health.service ?? 'unknown'}`, health.success === true);

  // 2. Login
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const token = login.token;
  check(`Login:      role=${login.user?.role}`, login.success === true && !!token);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 3. Machines
  const machines = await api('/api/machines', auth);
  check(`Machines:   ${machines.machines?.length ?? 0} records`, machines.success === true);

  // 4. Shifts
  const shifts = await api('/api/shifts', auth);
  check(`Shifts:     ${shifts.shifts?.length ?? 0} records`, shifts.success === true);

  // 5. Plans
  const plans = await api('/api/plans', auth);
  check(`Plans:      ${plans.plans?.length ?? 0} records`, plans.success === true && Array.isArray(plans.plans));

  // 6. Dashboard
  const dash = await api('/api/dashboard', auth);
  check(`Dashboard:  machines=${dash.dashboard?.totalMachines}, operators=${dash.dashboard?.totalOperators}`, dash.success === true);

  // 7. Downtime
  const downtime = await api('/api/downtime', auth);
  check(`Downtime:   ${downtime.logs?.length ?? 0} records`, downtime.success === true);

  // 8. Reports
  const today = new Date().toISOString().split('T')[0];
  const reports = await api(`/api/reports/production?start_date=${today}&end_date=${today}`, auth);
  check(`Reports:    ${reports.data?.length ?? 0} rows`, reports.success === true && Array.isArray(reports.data));

  // 9. Users
  const users = await api('/api/users', auth);
  check(`Users:      ${users.users?.length ?? 0} users`, users.success === true);

  console.log(`\n   Result: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('   🎉 All API endpoints responding!\n');
  } else {
    console.log('   ⚠️  Some tests failed.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
