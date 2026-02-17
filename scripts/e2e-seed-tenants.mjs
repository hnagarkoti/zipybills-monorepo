#!/usr/bin/env node
/**
 * E2E Test Seeder — Creates machines, shifts, users, and production plans
 * for all 3 test tenants.
 *
 * Usage: node scripts/e2e-seed-tenants.mjs
 */

const API = 'http://localhost:4000/api/v1';

async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

async function login(username, password) {
  const res = await apiFetch('/saas/login', '', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.token) throw new Error(`Login failed for ${username}: ${JSON.stringify(res)}`);
  return res.token;
}

async function seedTenant(name, token, prefix) {
  console.log(`\n━━━ Seeding ${name} (prefix: ${prefix}) ━━━`);

  // Shifts
  console.log('  📅 Creating shifts...');
  const shifts = [
    { shift_name: 'Morning Shift', start_time: '06:00', end_time: '14:00', is_active: true },
    { shift_name: 'Afternoon Shift', start_time: '14:00', end_time: '22:00', is_active: true },
    { shift_name: 'Night Shift', start_time: '22:00', end_time: '06:00', is_active: true },
  ];
  const shiftIds = [];
  for (const s of shifts) {
    const res = await apiFetch('/shifts', token, { method: 'POST', body: JSON.stringify(s) });
    const id = res.shift?.shift_id ?? res.shift_id ?? '?';
    shiftIds.push(id);
    console.log(`    ✓ ${s.shift_name} → ID ${id}`);
  }

  // Machines — codes use tenant prefix to avoid global uniqueness clash
  console.log('  🏭 Creating machines...');
  const machines = [
    { machine_code: `CNC-${prefix}01`, machine_name: 'CNC Lathe Pro 5000', machine_type: 'CNC', department: 'Production' },
    { machine_code: `PRS-${prefix}01`, machine_name: 'Press Brake HX-200', machine_type: 'Press', department: 'Fabrication' },
    { machine_code: `DRL-${prefix}01`, machine_name: 'Drilling Center DC-400', machine_type: 'Drill', department: 'Production' },
    { machine_code: `WLD-${prefix}01`, machine_name: 'Welding Robot WR-100', machine_type: 'Welding', department: 'Assembly' },
  ];
  const machineIds = [];
  for (const m of machines) {
    const res = await apiFetch('/machines', token, { method: 'POST', body: JSON.stringify(m) });
    const id = res.machine?.machine_id ?? res.machine_id ?? res.id ?? '?';
    if (id === '?') console.log('    ⚠ Machine response:', JSON.stringify(res).slice(0, 200));
    machineIds.push(id);
    console.log(`    ✓ ${m.machine_name} (${m.machine_code}) → ID ${id}`);
  }

  // Users (operators & supervisors)
  console.log('  👤 Creating users...');
  const users = [
    { username: `${name.split(' ')[0].toLowerCase()}_op1`, password: 'Test@1234', full_name: 'Operator One', role: 'OPERATOR' },
    { username: `${name.split(' ')[0].toLowerCase()}_op2`, password: 'Test@1234', full_name: 'Operator Two', role: 'OPERATOR' },
    { username: `${name.split(' ')[0].toLowerCase()}_sup1`, password: 'Test@1234', full_name: 'Supervisor One', role: 'SUPERVISOR' },
  ];
  for (const u of users) {
    const res = await apiFetch('/users', token, { method: 'POST', body: JSON.stringify(u) });
    const id = res.user?.user_id ?? res.user_id ?? '?';
    console.log(`    ✓ ${u.full_name} (${u.role}) → ${u.username} / ${u.password}`);
  }

  // Production Plans
  console.log('  📋 Creating production plans...');
  const today = new Date();
  const plans = [];
  for (let d = 0; d < 5; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    for (let mi = 0; mi < Math.min(machineIds.length, 3); mi++) {
      for (let si = 0; si < Math.min(shiftIds.length, 2); si++) {
        const products = [
          { name: 'Gear Shaft A-200', code: 'GS-A200', qty: 500 },
          { name: 'Bearing Housing B-100', code: 'BH-B100', qty: 300 },
          { name: 'Drive Coupling C-50', code: 'DC-C50', qty: 200 },
          { name: 'Piston Rod D-75', code: 'PR-D75', qty: 400 },
          { name: 'Flange Plate F-120', code: 'FP-F120', qty: 250 },
        ];
        const p = products[(d + mi + si) % products.length];
        plans.push({
          plan_date: dateStr,
          machine_id: machineIds[mi],
          shift_id: shiftIds[si],
          product_name: p.name,
          product_code: p.code,
          target_quantity: p.qty + (d * 10) + (mi * 20),
        });
      }
    }
  }

  let planSuccess = 0;
  for (const plan of plans) {
    const res = await apiFetch('/plans', token, {
      method: 'POST',
      body: JSON.stringify(plan),
    });
    if (res.plan || res.success) planSuccess++;    else if (planSuccess === 0 && plans.indexOf(plan) === 0) console.log('    ⚠ Plan response:', JSON.stringify(res).slice(0, 200));  }
  console.log(`    ✓ Created ${planSuccess}/${plans.length} production plans`);

  return { shiftIds, machineIds };
}

// ─── Main ────────────────────────────
async function main() {
  console.log('🚀 E2E Test Seeder — Starting...\n');

  const tenants = [
    { name: 'Alpha Manufacturing', user: 'alpha_admin', pass: 'Alpha@123', prefix: 'A' },
    { name: 'Beta Industries', user: 'beta_admin', pass: 'Beta@123', prefix: 'B' },
    { name: 'Gamma Precision', user: 'gamma_admin', pass: 'Gamma@123', prefix: 'G' },
  ];

  for (const t of tenants) {
    try {
      const token = await login(t.user, t.pass);
      console.log(`✓ ${t.name} — Logged in as ${t.user}`);
      await seedTenant(t.name, token, t.prefix);
    } catch (err) {
      console.error(`✗ ${t.name} — Error: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seeding complete for all 3 tenants');
  console.log('\n📋 Test credentials:');
  console.log('  TC1 Alpha: alpha_admin / Alpha@123');
  console.log('  TC2 Beta:  beta_admin  / Beta@123');
  console.log('  TC3 Gamma: gamma_admin / Gamma@123');
  console.log('\n🌐 Open http://localhost:8081 to test in UI');
}

main().catch(console.error);
