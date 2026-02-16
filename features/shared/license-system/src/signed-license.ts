/**
 * FactoryOS Enterprise License Signing & Offline Validation
 *
 * Provides cryptographically signed license files for:
 * - Air-gapped deployments
 * - Offline validation without DB
 * - Tamper-proof license distribution
 *
 * Uses RSA-2048 with SHA-256 for maximum compatibility.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ─── Types ────────────────────────────────────

export type SignedLicenseType = 
  | 'TRIAL'           // Time-limited trial
  | 'TIME_BASED'      // Expires on date
  | 'PER_MACHINE'     // N machines allowed
  | 'PER_USER'        // N users allowed
  | 'PERPETUAL'       // No expiry (enterprise)
  | 'OFFLINE';        // Air-gapped with signed validation

export interface SignedLicenseData {
  // Core identity
  licenseId: string;                  // UUID
  issuedTo: string;                   // Company name
  issuedAt: string;                   // ISO date
  
  // License type & limits
  type: SignedLicenseType;
  expiresAt: string | null;           // null = perpetual
  maxMachines: number;                // -1 = unlimited
  maxUsers: number;                   // -1 = unlimited
  
  // Features & entitlements
  features: string[];                 // Feature IDs enabled
  modules: string[];                  // Licensed modules
  
  // Hardware binding (optional)
  hardwareId: string | null;          // Bind to specific machine
  
  // Grace period
  gracePeriodDays: number;            // Days allowed after expiry
  
  // Metadata
  metadata: {
    contactEmail: string;
    supportTier: 'BASIC' | 'STANDARD' | 'PREMIUM';
    customFields?: Record<string, any>;
  };
}

export interface SignedLicenseFile {
  version: '1.0';
  data: SignedLicenseData;
  signature: string;                  // Base64-encoded RSA signature
  publicKeyId: string;                // Key ID for verification
}

export interface LicenseValidationResult {
  valid: boolean;
  status: 'VALID' | 'EXPIRED' | 'GRACE_PERIOD' | 'INVALID_SIGNATURE' | 'HARDWARE_MISMATCH' | 'NOT_FOUND';
  license: SignedLicenseData | null;
  daysRemaining: number | null;
  graceDaysRemaining: number | null;
  warnings: string[];
  errors: string[];
}

// ─── Key Management ───────────────────────────

const KEY_DIR = process.env.LICENSE_KEY_DIR || path.join(os.homedir(), '.factoryos', 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'license.private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'license.public.pem');

/**
 * Generate RSA-2048 key pair for license signing.
 * Private key stays on licensing server, public key deployed with app.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string; keyId: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  
  // Key ID = first 8 chars of public key hash
  const keyId = crypto.createHash('sha256')
    .update(publicKey)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  
  return { publicKey, privateKey, keyId };
}

/**
 * Save key pair to disk.
 */
export function saveKeyPair(publicKey: string, privateKey: string): void {
  fs.mkdirSync(KEY_DIR, { recursive: true });
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
  console.log(`[License] 🔐 Keys saved to ${KEY_DIR}`);
}

/**
 * Load existing keys or generate new ones.
 */
export function loadOrGenerateKeys(): { publicKey: string; privateKey: string; keyId: string } {
  try {
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
      const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');
      const keyId = crypto.createHash('sha256')
        .update(publicKey)
        .digest('hex')
        .slice(0, 8)
        .toUpperCase();
      return { publicKey, privateKey, keyId };
    }
  } catch (e) {
    console.log('[License] Generating new key pair...');
  }
  
  const keys = generateKeyPair();
  saveKeyPair(keys.publicKey, keys.privateKey);
  return keys;
}

// ─── Hardware Fingerprinting ──────────────────

/**
 * Generate a stable hardware fingerprint for this machine.
 * Uses multiple hardware identifiers for resilience.
 */
export function getHardwareFingerprint(): string {
  const components = [
    os.hostname(),
    os.cpus()[0]?.model ?? 'unknown-cpu',
    String(os.totalmem()),
    os.platform(),
    os.arch(),
    os.type(),
  ];
  
  // Get network interfaces (excluding loopback)
  const nets = os.networkInterfaces();
  const macs: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (!net.internal && net.mac !== '00:00:00:00:00:00') {
        macs.push(net.mac);
      }
    }
  }
  if (macs.length > 0) {
    components.push(macs.sort().join(','));
  }
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

// ─── License Signing ──────────────────────────

/**
 * Sign license data with private key.
 * This creates the tamper-proof license file.
 */
export function signLicense(data: SignedLicenseData, privateKey: string): SignedLicenseFile {
  const keyId = crypto.createHash('sha256')
    .update(privateKey)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  
  // Canonicalize data for signing
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  
  const sign = crypto.createSign('SHA256');
  sign.update(dataString);
  const signature = sign.sign(privateKey, 'base64');
  
  return {
    version: '1.0',
    data,
    signature,
    publicKeyId: keyId,
  };
}

/**
 * Verify license signature with public key.
 */
export function verifyLicenseSignature(license: SignedLicenseFile, publicKey: string): boolean {
  try {
    const dataString = JSON.stringify(license.data, Object.keys(license.data).sort());
    
    const verify = crypto.createVerify('SHA256');
    verify.update(dataString);
    return verify.verify(publicKey, license.signature, 'base64');
  } catch (e) {
    console.error('[License] Signature verification failed:', e);
    return false;
  }
}

// ─── License Generation ───────────────────────

/**
 * Generate a signed license file.
 */
export function generateSignedLicense(
  options: {
    issuedTo: string;
    type: SignedLicenseType;
    expiresInDays?: number;
    maxMachines?: number;
    maxUsers?: number;
    features?: string[];
    modules?: string[];
    hardwareId?: string;
    gracePeriodDays?: number;
    contactEmail?: string;
    supportTier?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  },
  privateKey: string
): SignedLicenseFile {
  const now = new Date();
  
  const data: SignedLicenseData = {
    licenseId: crypto.randomUUID(),
    issuedTo: options.issuedTo,
    issuedAt: now.toISOString(),
    type: options.type,
    expiresAt: options.expiresInDays 
      ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    maxMachines: options.maxMachines ?? -1,
    maxUsers: options.maxUsers ?? -1,
    features: options.features ?? [
      'auth', 'machines', 'shifts', 'planning', 
      'downtime', 'dashboard', 'reports', 'theme'
    ],
    modules: options.modules ?? ['core', 'production', 'reporting'],
    hardwareId: options.hardwareId ?? null,
    gracePeriodDays: options.gracePeriodDays ?? 14,
    metadata: {
      contactEmail: options.contactEmail ?? 'support@factoryos.io',
      supportTier: options.supportTier ?? 'BASIC',
    },
  };
  
  return signLicense(data, privateKey);
}

// ─── License File I/O ─────────────────────────

const LICENSE_FILE_PATH = process.env.LICENSE_FILE_PATH || 
  path.join(os.homedir(), '.factoryos', 'license.lic');

/**
 * Save license to .lic file (JSON format, signed).
 */
export function saveLicenseFile(license: SignedLicenseFile, filePath?: string): string {
  const targetPath = filePath ?? LICENSE_FILE_PATH;
  const dir = path.dirname(targetPath);
  
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(license, null, 2), 'utf-8');
  
  console.log(`[License] 📄 License saved to ${targetPath}`);
  return targetPath;
}

/**
 * Load license from .lic file.
 */
export function loadLicenseFile(filePath?: string): SignedLicenseFile | null {
  const targetPath = filePath ?? LICENSE_FILE_PATH;
  
  try {
    if (!fs.existsSync(targetPath)) {
      return null;
    }
    
    const content = fs.readFileSync(targetPath, 'utf-8');
    return JSON.parse(content) as SignedLicenseFile;
  } catch (e) {
    console.error('[License] Failed to load license file:', e);
    return null;
  }
}

// ─── Offline Validation ───────────────────────

/**
 * Validate a signed license without database access.
 * This is the core offline validation engine.
 */
export function validateSignedLicense(
  license: SignedLicenseFile,
  publicKey: string,
  options?: {
    machineCount?: number;
    userCount?: number;
    currentHardwareId?: string;
  }
): LicenseValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const data = license.data;
  
  // Step 1: Verify signature
  if (!verifyLicenseSignature(license, publicKey)) {
    return {
      valid: false,
      status: 'INVALID_SIGNATURE',
      license: null,
      daysRemaining: null,
      graceDaysRemaining: null,
      warnings: [],
      errors: ['License signature verification failed. File may be tampered.'],
    };
  }
  
  // Step 2: Check hardware binding
  if (data.hardwareId) {
    const currentHw = options?.currentHardwareId ?? getHardwareFingerprint();
    if (data.hardwareId !== currentHw) {
      return {
        valid: false,
        status: 'HARDWARE_MISMATCH',
        license: data,
        daysRemaining: null,
        graceDaysRemaining: null,
        warnings: [],
        errors: ['License is bound to a different machine.'],
      };
    }
  }
  
  // Step 3: Check expiry
  let daysRemaining: number | null = null;
  let graceDaysRemaining: number | null = null;
  let status: LicenseValidationResult['status'] = 'VALID';
  
  if (data.expiresAt) {
    const now = new Date();
    const expiry = new Date(data.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      // Check grace period
      const graceEndMs = expiry.getTime() + (data.gracePeriodDays * 24 * 60 * 60 * 1000);
      const graceRemaining = Math.ceil((graceEndMs - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (graceRemaining > 0) {
        status = 'GRACE_PERIOD';
        graceDaysRemaining = graceRemaining;
        warnings.push(`License expired. Grace period: ${graceRemaining} day(s) remaining.`);
        warnings.push('System is in READ-ONLY mode. Please renew your license.');
      } else {
        status = 'EXPIRED';
        errors.push('License has expired. Grace period exceeded.');
        return {
          valid: false,
          status,
          license: data,
          daysRemaining,
          graceDaysRemaining: 0,
          warnings,
          errors,
        };
      }
    } else if (daysRemaining <= 7) {
      warnings.push(`License expires in ${daysRemaining} day(s). Please renew soon.`);
    } else if (daysRemaining <= 30) {
      warnings.push(`License expires in ${daysRemaining} days.`);
    }
  }
  
  // Step 4: Check machine limits
  if (data.maxMachines > 0 && options?.machineCount !== undefined) {
    if (options.machineCount > data.maxMachines) {
      warnings.push(`Machine limit exceeded (${options.machineCount}/${data.maxMachines}).`);
    } else if (options.machineCount >= data.maxMachines) {
      warnings.push(`Machine limit reached (${options.machineCount}/${data.maxMachines}).`);
    }
  }
  
  // Step 5: Check user limits
  if (data.maxUsers > 0 && options?.userCount !== undefined) {
    if (options.userCount > data.maxUsers) {
      warnings.push(`User limit exceeded (${options.userCount}/${data.maxUsers}).`);
    } else if (options.userCount >= data.maxUsers) {
      warnings.push(`User limit reached (${options.userCount}/${data.maxUsers}).`);
    }
  }
  
  return {
    valid: status === 'VALID' || status === 'GRACE_PERIOD',
    status,
    license: data,
    daysRemaining,
    graceDaysRemaining,
    warnings,
    errors,
  };
}

// ─── Combined Validation (Offline + DB Fallback) ─

/**
 * Validate license with offline file fallback.
 * Priority: 1. .lic file → 2. Database
 */
export async function validateLicenseHybrid(publicKey: string): Promise<LicenseValidationResult> {
  // Try offline file first
  const licenseFile = loadLicenseFile();
  if (licenseFile) {
    console.log('[License] Using offline license file');
    return validateSignedLicense(licenseFile, publicKey);
  }
  
  // No offline file, return not found
  return {
    valid: false,
    status: 'NOT_FOUND',
    license: null,
    daysRemaining: null,
    graceDaysRemaining: null,
    warnings: [],
    errors: ['No license file found. Please install a valid license.'],
  };
}

// ─── License Packaging ────────────────────────

/**
 * Export license as downloadable Base64-encoded string.
 * For email distribution or web download.
 */
export function exportLicenseBase64(license: SignedLicenseFile): string {
  return Buffer.from(JSON.stringify(license)).toString('base64');
}

/**
 * Import license from Base64-encoded string.
 */
export function importLicenseBase64(base64: string): SignedLicenseFile {
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json) as SignedLicenseFile;
}

// ─── License CLI Helpers ──────────────────────

/**
 * Print license info to console.
 */
export function printLicenseInfo(license: SignedLicenseFile): void {
  const d = license.data;
  console.log('\n═══════════════════════════════════════════');
  console.log('     FactoryOS License Information');
  console.log('═══════════════════════════════════════════');
  console.log(`  License ID:    ${d.licenseId}`);
  console.log(`  Issued To:     ${d.issuedTo}`);
  console.log(`  Type:          ${d.type}`);
  console.log(`  Issued At:     ${d.issuedAt}`);
  console.log(`  Expires At:    ${d.expiresAt ?? 'Never (Perpetual)'}`);
  console.log(`  Grace Period:  ${d.gracePeriodDays} days`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Max Machines:  ${d.maxMachines === -1 ? 'Unlimited' : d.maxMachines}`);
  console.log(`  Max Users:     ${d.maxUsers === -1 ? 'Unlimited' : d.maxUsers}`);
  console.log(`  Features:      ${d.features.join(', ')}`);
  console.log(`  Modules:       ${d.modules.join(', ')}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Hardware ID:   ${d.hardwareId ?? 'Not bound'}`);
  console.log(`  Support Tier:  ${d.metadata.supportTier}`);
  console.log(`  Contact:       ${d.metadata.contactEmail}`);
  console.log('═══════════════════════════════════════════\n');
}
