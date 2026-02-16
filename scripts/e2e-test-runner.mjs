#!/usr/bin/env node
/**
 * E2E Test Case Runner — Executes TC1/TC2/TC3 scenarios
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'factory_os' });
const API = 'http://localhost:4000/api/v1';

async function login(u, p) {
  const r = await fetch(API + '/saas/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: p }),
  });
  return r.json();
}

async function getTenant(tid) {
  const r = await pool.query('SELECT company_name, plan, status, max_users, max_machines, trial_ends_at FROM tenants WHERE tenant_id = $1', [tid]);
  return r.rows[0];
}

async function expireTrial(tid) {
  await pool.query("UPDATE tenants SET trial_ends_at = '2025-01-01T00:00:00Z' WHERE tenant_id = $1", [tid]);
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('    E2E TEST CASE RUNNER');
  console.log('═══════════════════════════════════════\n');

  // ─── TC2: Beta Industries — Expire trial → Downgrade to FREE → Upgrade to ENTERPRISE ───
  console.log('━━━ TC2: Beta Industries ━━━');
  console.log('Step 1: Expire trial...');
  await expireTrial(4);
  console.log('  ✓ Trial expired (set to 2025-01-01)');

  console.log('Step 2: Login to trigger auto-downgrade...');
  const betaLogin = await login('beta_admin', 'Beta@123');
  console.log('  Login plan:', betaLogin.tenant?.plan);
  let betaState = await getTenant(4);
  console.log('  DB state:', betaState);

  console.log('Step 3: Upgrade to ENTERPRISE via platform admin...');
  const superLogin = await login('platform_admin', 'admin123!');
  const superToken = superLogin.token;
  const upgrade = await fetch(API + '/super-admin/tenants/4/plan', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + superToken },
    body: JSON.stringify({ plan: 'ENTERPRISE' }),
  });
  const upgradeData = await upgrade.json();
  console.log('  Upgrade response:', JSON.stringify(upgradeData));

  betaState = await getTenant(4);
  console.log('  ✓ Beta after upgrade:', betaState);
  console.log('  EXPECTED: plan=ENTERPRISE, max_users=-1, max_machines=-1');
  console.log('  RESULT:', betaState.plan === 'ENTERPRISE' && betaState.max_users === -1 ? '✅ PASS' : '❌ FAIL');

  // ─── TC3: Gamma Precision — Expire trial → Downgrade to FREE → Upgrade to STARTER ───
  console.log('\n━━━ TC3: Gamma Precision ━━━');
  console.log('Step 1: Expire trial...');
  await expireTrial(5);
  console.log('  ✓ Trial expired (set to 2025-01-01)');

  console.log('Step 2: Login to trigger auto-downgrade...');
  const gammaLogin = await login('gamma_admin', 'Gamma@123');
  console.log('  Login plan:', gammaLogin.tenant?.plan);
  let gammaState = await getTenant(5);
  console.log('  DB state:', gammaState);

  console.log('Step 3: Upgrade to STARTER via platform admin...');
  const upgrade2 = await fetch(API + '/super-admin/tenants/5/plan', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + superToken },
    body: JSON.stringify({ plan: 'STARTER' }),
  });
  const upgradeData2 = await upgrade2.json();
  console.log('  Upgrade response:', JSON.stringify(upgradeData2));

  gammaState = await getTenant(5);
  console.log('  ✓ Gamma after upgrade:', gammaState);
  console.log('  EXPECTED: plan=STARTER, max_users=10, max_machines=10');
  console.log('  RESULT:', gammaState.plan === 'STARTER' && gammaState.max_users === 10 ? '✅ PASS' : '❌ FAIL');

  // ─── Final summary ───
  console.log('\n═══════════════════════════════════════');
  console.log('    FINAL STATE OF ALL 3 TENANTS');
  console.log('═══════════════════════════════════════');
  for (const tid of [3, 4, 5]) {
    const t = await getTenant(tid);
    console.log(`  Tenant ${tid} (${t.company_name}): plan=${t.plan}, status=${t.status}, users=${t.max_users}, machines=${t.max_machines}`);
  }

  pool.end();
}

main().catch(e => { console.error(e); pool.end(); });
