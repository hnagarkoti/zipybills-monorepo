/**
 * FactoryOS License API Router
 *
 * Endpoints:
 *   GET  /license/status     — current license status (any authenticated user)
 *   POST /license/activate   — activate a license key (ADMIN only)
 *   GET  /license/all        — list all licenses (ADMIN only)
 *   POST /license/generate   — generate a new license key (ADMIN only)
 *   POST /license/deactivate — deactivate current license (ADMIN only)
 */

import { Router } from 'express';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import {
  validateLicense,
  activateLicense,
  getAllLicenses,
  getActiveLicense,
  updateLicenseStatus,
  generateLicenseKey,
  LICENSE_TIERS,
  type LicenseTier,
} from './index.js';
import {
  loadOrGenerateKeys,
  generateSignedLicense,
  saveLicenseFile,
  loadLicenseFile,
  validateSignedLicense,
  getHardwareFingerprint,
  printLicenseInfo,
  exportLicenseBase64,
  importLicenseBase64,
  type SignedLicenseType,
} from './signed-license.js';
import { invalidateLicenseCache } from './middleware.js';

export const licenseRouter = Router();

// ─── Public (authenticated) ───────────────────

licenseRouter.get('/license/status', requireAuth, async (_req, res) => {
  try {
    const validation = await validateLicense();
    res.json({ success: true, license: validation });
  } catch (err) {
    console.error('[License] Status error:', err);
    res.status(500).json({ success: false, error: 'Failed to check license' });
  }
});

// ─── Admin Only ───────────────────────────────

licenseRouter.post('/license/activate', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { license_key, company_name, tier, expires_in_days } = req.body;

    if (!license_key || !company_name || !tier) {
      res.status(400).json({
        success: false,
        error: 'license_key, company_name, and tier are required',
      });
      return;
    }

    if (!['TRIAL', 'STARTER', 'STANDARD', 'ENTERPRISE'].includes(tier)) {
      res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be TRIAL, STARTER, STANDARD, or ENTERPRISE',
      });
      return;
    }

    const license = await activateLicense(
      license_key,
      company_name,
      tier as LicenseTier,
      expires_in_days,
    );

    invalidateLicenseCache();

    await logActivity(
      req.user!.user_id,
      'ACTIVATE_LICENSE',
      'license',
      license.license_id,
      `Activated ${tier} license for ${company_name}`,
      req.ip,
    );

    res.json({ success: true, license });
  } catch (err) {
    console.error('[License] Activate error:', err);
    res.status(500).json({ success: false, error: 'Failed to activate license' });
  }
});

licenseRouter.get('/license/all', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const licenses = await getAllLicenses();
    res.json({ success: true, licenses });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch licenses' });
  }
});

licenseRouter.post('/license/generate', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { tier } = req.body;
    const validTier = tier && ['TRIAL', 'STARTER', 'STANDARD', 'ENTERPRISE'].includes(tier)
      ? tier
      : 'STANDARD';

    const key = generateLicenseKey();
    const tierDef = LICENSE_TIERS[validTier as LicenseTier];

    await logActivity(
      req.user!.user_id,
      'GENERATE_LICENSE_KEY',
      'license',
      undefined,
      `Generated ${validTier} license key`,
      req.ip,
    );

    res.json({
      success: true,
      key,
      tier: validTier,
      limits: {
        maxMachines: tierDef.maxMachines,
        maxUsers: tierDef.maxUsers,
        features: tierDef.features,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate key' });
  }
});

licenseRouter.post('/license/deactivate', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const license = await getActiveLicense();
    if (!license) {
      res.status(404).json({ success: false, error: 'No active license found' });
      return;
    }

    await updateLicenseStatus(license.license_id, 'SUSPENDED');
    invalidateLicenseCache();

    await logActivity(
      req.user!.user_id,
      'DEACTIVATE_LICENSE',
      'license',
      license.license_id,
      `Deactivated license ${license.license_key}`,
      req.ip,
    );

    res.json({ success: true, message: 'License deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to deactivate license' });
  }
});

licenseRouter.get('/license/tiers', requireAuth, async (_req, res) => {
  res.json({ success: true, tiers: LICENSE_TIERS });
});

// ─── Signed License Endpoints (Enterprise) ───

licenseRouter.get('/license/hardware-id', requireAuth, async (_req, res) => {
  try {
    const hardwareId = getHardwareFingerprint();
    res.json({ success: true, hardwareId });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get hardware ID' });
  }
});

licenseRouter.post('/license/signed/generate', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      issued_to,
      type,
      expires_in_days,
      max_machines,
      max_users,
      features,
      modules,
      hardware_id,
      grace_period_days,
      contact_email,
      support_tier,
    } = req.body;

    if (!issued_to || !type) {
      res.status(400).json({ success: false, error: 'issued_to and type are required' });
      return;
    }

    const validTypes: SignedLicenseType[] = ['TRIAL', 'TIME_BASED', 'PER_MACHINE', 'PER_USER', 'PERPETUAL', 'OFFLINE'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: `Invalid type. Must be: ${validTypes.join(', ')}` });
      return;
    }

    const keys = loadOrGenerateKeys();
    const signedLicense = generateSignedLicense(
      {
        issuedTo: issued_to,
        type,
        expiresInDays: expires_in_days,
        maxMachines: max_machines,
        maxUsers: max_users,
        features,
        modules,
        hardwareId: hardware_id,
        gracePeriodDays: grace_period_days,
        contactEmail: contact_email,
        supportTier: support_tier,
      },
      keys.privateKey
    );

    await logActivity(
      req.user!.user_id,
      'GENERATE_SIGNED_LICENSE',
      'license',
      undefined,
      `Generated ${type} signed license for ${issued_to}`,
      req.ip,
    );

    // Return as both JSON and base64 for easy distribution
    res.json({
      success: true,
      license: signedLicense,
      base64: exportLicenseBase64(signedLicense),
      publicKey: keys.publicKey,
    });
  } catch (err) {
    console.error('[License] Signed generate error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate signed license' });
  }
});

licenseRouter.post('/license/signed/install', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { license, base64 } = req.body;

    let signedLicense;
    if (base64) {
      signedLicense = importLicenseBase64(base64);
    } else if (license) {
      signedLicense = license;
    } else {
      res.status(400).json({ success: false, error: 'license or base64 is required' });
      return;
    }

    // Validate before installing
    const keys = loadOrGenerateKeys();
    const validation = validateSignedLicense(signedLicense, keys.publicKey);

    if (!validation.valid && validation.status !== 'GRACE_PERIOD') {
      res.status(400).json({
        success: false,
        error: validation.errors[0] || 'Invalid license',
        validation,
      });
      return;
    }

    // Save to file
    const filePath = saveLicenseFile(signedLicense);
    invalidateLicenseCache();

    await logActivity(
      req.user!.user_id,
      'INSTALL_SIGNED_LICENSE',
      'license',
      undefined,
      `Installed signed license for ${signedLicense.data.issuedTo}`,
      req.ip,
    );

    res.json({
      success: true,
      message: 'License installed successfully',
      filePath,
      validation,
    });
  } catch (err) {
    console.error('[License] Install error:', err);
    res.status(500).json({ success: false, error: 'Failed to install license' });
  }
});

licenseRouter.get('/license/signed/status', requireAuth, async (_req, res) => {
  try {
    const licenseFile = loadLicenseFile();
    if (!licenseFile) {
      res.json({
        success: true,
        installed: false,
        message: 'No signed license file installed',
      });
      return;
    }

    const keys = loadOrGenerateKeys();
    const validation = validateSignedLicense(licenseFile, keys.publicKey);

    res.json({
      success: true,
      installed: true,
      validation,
      license: licenseFile.data,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check signed license' });
  }
});

licenseRouter.get('/license/signed/export', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const licenseFile = loadLicenseFile();
    if (!licenseFile) {
      res.status(404).json({ success: false, error: 'No signed license installed' });
      return;
    }

    res.json({
      success: true,
      license: licenseFile,
      base64: exportLicenseBase64(licenseFile),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export license' });
  }
});
