/**
 * FactoryOS License System
 *
 * On-prem license management for enterprise deployments:
 * - License key generation & validation
 * - Machine count limits
 * - User count limits
 * - Expiry date enforcement
 * - Feature entitlements (which modules are licensed)
 * - Hardware fingerprinting for license binding
 *
 * License key format: FCOS-XXXX-XXXX-XXXX-XXXX
 *
 * License tiers:
 *   STARTER    → 5 machines, 10 users, basic features
 *   STANDARD   → 20 machines, 50 users, all core features
 *   ENTERPRISE → unlimited machines/users, all features + support
 *   TRIAL      → 5 machines, 5 users, all features, 30-day expiry
 */

import crypto from 'node:crypto';
import os from 'node:os';
import { query } from '@zipybills/factory-database-config';
import { logActivity } from '@zipybills/factory-activity-log';

// ─── Types ────────────────────────────────────

export type LicenseTier = 'TRIAL' | 'STARTER' | 'STANDARD' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'INVALID';

export interface License {
  license_id: number;
  license_key: string;
  company_name: string;
  tier: LicenseTier;
  max_machines: number;
  max_users: number;
  features: string[];         // entitled feature IDs
  issued_at: string;
  expires_at: string | null;  // null = perpetual
  hardware_id: string | null; // bound hardware fingerprint
  status: LicenseStatus;
  activated_at: string | null;
  last_validated: string | null;
  metadata: Record<string, any>;
}

export interface LicenseValidation {
  valid: boolean;
  status: LicenseStatus;
  tier: LicenseTier;
  company: string;
  daysRemaining: number | null;   // null = perpetual
  machinesUsed: number;
  machinesAllowed: number;
  usersActive: number;
  usersAllowed: number;
  features: string[];
  warnings: string[];
}

// ─── Tier Definitions ─────────────────────────

export const LICENSE_TIERS: Record<LicenseTier, { maxMachines: number; maxUsers: number; features: string[] }> = {
  TRIAL: {
    maxMachines: 5,
    maxUsers: 5,
    features: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'theme'],
  },
  STARTER: {
    maxMachines: 5,
    maxUsers: 10,
    features: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'theme'],
  },
  STANDARD: {
    maxMachines: 20,
    maxUsers: 50,
    features: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'theme', 'backup', 'audit'],
  },
  ENTERPRISE: {
    maxMachines: -1,  // unlimited
    maxUsers: -1,     // unlimited
    features: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'theme', 'backup', 'audit', 'admin', 'export'],
  },
};

// ─── License Key Generation ───────────────────

/**
 * Generate a cryptographically secure license key.
 * Format: FCOS-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `FCOS-${segments.join('-')}`;
}

/**
 * Generate a hardware fingerprint for this machine.
 * Based on hostname + CPU model + total memory + platform.
 */
export function getHardwareFingerprint(): string {
  const data = [
    os.hostname(),
    os.cpus()[0]?.model ?? 'unknown-cpu',
    String(os.totalmem()),
    os.platform(),
    os.arch(),
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .slice(0, 16);
}

// ─── Database Schema ──────────────────────────

export async function initializeLicenseSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS licenses (
      license_id      SERIAL PRIMARY KEY,
      license_key     VARCHAR(30) UNIQUE NOT NULL,
      company_name    VARCHAR(200) NOT NULL,
      tier            VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
                      CHECK (tier IN ('TRIAL', 'STARTER', 'STANDARD', 'ENTERPRISE')),
      max_machines    INT NOT NULL DEFAULT 5,
      max_users       INT NOT NULL DEFAULT 5,
      features        TEXT[] DEFAULT '{}',
      issued_at       TIMESTAMPTZ DEFAULT NOW(),
      expires_at      TIMESTAMPTZ,
      hardware_id     VARCHAR(64),
      status          VARCHAR(20) DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'INVALID')),
      activated_at    TIMESTAMPTZ,
      last_validated  TIMESTAMPTZ,
      metadata        JSONB DEFAULT '{}',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);`);

  console.log('[License] ✅ License schema initialized');
}

// ─── Database Operations ──────────────────────

/** Get the active license for this installation */
export async function getActiveLicense(): Promise<License | null> {
  const result = await query<License>(
    `SELECT * FROM licenses WHERE status = 'ACTIVE' ORDER BY activated_at DESC LIMIT 1`,
  );
  return result.rows[0] ?? null;
}

/** Get license by key */
export async function getLicenseByKey(key: string): Promise<License | null> {
  const result = await query<License>(
    `SELECT * FROM licenses WHERE license_key = $1`,
    [key],
  );
  return result.rows[0] ?? null;
}

/** Get all licenses */
export async function getAllLicenses(): Promise<License[]> {
  const result = await query<License>(
    `SELECT * FROM licenses ORDER BY created_at DESC`,
  );
  return result.rows;
}

/** Activate a license key */
export async function activateLicense(
  licenseKey: string,
  companyName: string,
  tier: LicenseTier,
  expiresInDays?: number,
): Promise<License> {
  const tierDef = LICENSE_TIERS[tier];
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Deactivate any existing active license
  await query(`UPDATE licenses SET status = 'EXPIRED' WHERE status = 'ACTIVE'`);

  const result = await query<License>(
    `INSERT INTO licenses (license_key, company_name, tier, max_machines, max_users, features, expires_at, hardware_id, status, activated_at, last_validated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NOW(), NOW())
     RETURNING *`,
    [
      licenseKey,
      companyName,
      tier,
      tierDef.maxMachines,
      tierDef.maxUsers,
      tierDef.features,
      expiresAt,
      getHardwareFingerprint(),
    ],
  );

  return result.rows[0]!;
}

/** Update license status */
export async function updateLicenseStatus(licenseId: number, status: LicenseStatus): Promise<void> {
  await query(
    `UPDATE licenses SET status = $1, updated_at = NOW() WHERE license_id = $2`,
    [status, licenseId],
  );
}

/** Seed a default trial license if none exist */
export async function seedTrialLicense(): Promise<void> {
  const existing = await getActiveLicense();
  if (existing) return;

  const key = generateLicenseKey();
  await activateLicense(key, 'FactoryOS Trial', 'TRIAL', 30);
  console.log('[License] 🔑 Trial license activated:', key);
}

// ─── Validation Engine ────────────────────────

/** Validate the current license against system state */
export async function validateLicense(): Promise<LicenseValidation> {
  const license = await getActiveLicense();
  const warnings: string[] = [];

  if (!license) {
    return {
      valid: false,
      status: 'INVALID',
      tier: 'TRIAL',
      company: 'Unlicensed',
      daysRemaining: 0,
      machinesUsed: 0,
      machinesAllowed: 0,
      usersActive: 0,
      usersAllowed: 0,
      features: [],
      warnings: ['No active license found. Please activate a license.'],
    };
  }

  // Check expiry
  let daysRemaining: number | null = null;
  let status = license.status;

  if (license.expires_at) {
    const now = new Date();
    const expiry = new Date(license.expires_at);
    const diff = expiry.getTime() - now.getTime();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      status = 'EXPIRED';
      await updateLicenseStatus(license.license_id, 'EXPIRED');
      warnings.push('License has expired.');
    } else if (daysRemaining <= 7) {
      warnings.push(`License expires in ${daysRemaining} day(s).`);
    } else if (daysRemaining <= 30) {
      warnings.push(`License expires in ${daysRemaining} days.`);
    }
  }

  // Check hardware binding
  if (license.hardware_id && license.hardware_id !== getHardwareFingerprint()) {
    warnings.push('License hardware mismatch. This license was activated on a different machine.');
  }

  // Check machine count
  const machineResult = await query(`SELECT COUNT(*) as count FROM machines WHERE status != 'INACTIVE'`);
  const machinesUsed = parseInt(machineResult.rows[0]?.count ?? '0', 10);

  if (license.max_machines > 0 && machinesUsed >= license.max_machines) {
    warnings.push(`Machine limit reached (${machinesUsed}/${license.max_machines}).`);
  }

  // Check user count
  const userResult = await query(`SELECT COUNT(*) as count FROM users WHERE is_active = true`);
  const usersActive = parseInt(userResult.rows[0]?.count ?? '0', 10);

  if (license.max_users > 0 && usersActive >= license.max_users) {
    warnings.push(`User limit reached (${usersActive}/${license.max_users}).`);
  }

  // Update last validated timestamp
  await query(`UPDATE licenses SET last_validated = NOW() WHERE license_id = $1`, [license.license_id]);

  return {
    valid: status === 'ACTIVE',
    status: status as LicenseStatus,
    tier: license.tier as LicenseTier,
    company: license.company_name,
    daysRemaining,
    machinesUsed,
    machinesAllowed: license.max_machines,
    usersActive,
    usersAllowed: license.max_users,
    features: license.features,
    warnings,
  };
}
