/**
 * FactoryOS License Middleware
 *
 * Express middleware for license enforcement on API routes.
 * Checks license validity on every request (with caching).
 */

import type { Request, Response, NextFunction } from 'express';
import { validateLicense, type LicenseValidation } from './index.js';

// Cache validation result for 5 minutes to avoid DB hits on every request
let cachedValidation: LicenseValidation | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedValidation(): Promise<LicenseValidation> {
  const now = Date.now();
  if (cachedValidation && now - cacheTimestamp < CACHE_TTL) {
    return cachedValidation;
  }
  cachedValidation = await validateLicense();
  cacheTimestamp = now;
  return cachedValidation;
}

/** Force-refresh the cached license validation */
export function invalidateLicenseCache(): void {
  cachedValidation = null;
  cacheTimestamp = 0;
}

/**
 * Middleware that blocks requests when the license is invalid/expired.
 * Auth routes are always allowed (so admins can still log in to fix the license).
 */
export function requireLicense(req: Request, res: Response, next: NextFunction): void {
  // Always allow auth and health routes
  if (req.path.startsWith('/auth') || req.path === '/health' || req.path.startsWith('/license')) {
    next();
    return;
  }

  getCachedValidation()
    .then((validation) => {
      if (!validation.valid) {
        res.status(402).json({
          success: false,
          error: 'License required',
          license: {
            status: validation.status,
            warnings: validation.warnings,
          },
        });
        return;
      }

      // Attach license info to request for downstream use
      (req as any).license = validation;

      // Add warning headers if applicable
      if (validation.warnings.length > 0) {
        res.setHeader('X-License-Warning', validation.warnings[0]!);
      }
      if (validation.daysRemaining !== null && validation.daysRemaining <= 30) {
        res.setHeader('X-License-Expires-In', `${validation.daysRemaining}d`);
      }

      next();
    })
    .catch((err) => {
      console.error('[License] Validation error:', err);
      // Fail open — don't block on validation errors
      next();
    });
}

/**
 * Middleware that checks if a specific feature is licensed.
 */
export function requireLicensedFeature(featureId: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    getCachedValidation()
      .then((validation) => {
        if (!validation.valid) {
          res.status(402).json({
            success: false,
            error: 'License required',
          });
          return;
        }

        if (!validation.features.includes(featureId)) {
          res.status(403).json({
            success: false,
            error: `Feature "${featureId}" is not included in your ${validation.tier} license.`,
            upgrade: 'Contact sales to upgrade your license.',
          });
          return;
        }

        next();
      })
      .catch(() => next());
  };
}
