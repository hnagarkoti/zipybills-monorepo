/**
 * FactoryOS Cloud Auth – Express Router
 *
 * Routes:
 *   POST /saas/login        — SaaS-aware login (resolves tenant, returns tenant JWT)
 *   POST /saas/signup        — Self-service signup / onboarding
 *   GET  /saas/plans         — Available plans for signup page
 *   POST /saas/check-slug    — Validate slug availability
 *   POST /saas/check-username — Validate username availability
 */

import { Router, type Request, type Response } from 'express';
import { saasLogin, selfSignup, type SaaSLoginRequest, type SignupRequest } from './index.js';
import { getPlans } from '@zipybills/factory-subscription-billing';
import { query } from '@zipybills/factory-database-config';
import { logActivity } from '@zipybills/factory-activity-log';

export const cloudAuthRouter = Router();

// ─── SaaS Login ──────────────────────────────

cloudAuthRouter.post('/saas/login', async (req: Request, res: Response) => {
  try {
    const { username, password, tenant_slug } = req.body as SaaSLoginRequest;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (!tenant_slug) {
      return res.status(400).json({ success: false, error: 'Workspace ID (tenant_slug) is required' });
    }

    const result = await saasLogin({ username, password, tenant_slug });

    // Log activity
    try {
      await logActivity(
        result.user.user_id,
        'SAAS_LOGIN',
        'user',
        result.user.user_id,
        `SaaS login for ${result.tenant?.company_name || 'unknown tenant'}`,
        req.ip,
      );
    } catch { /* non-critical */ }

    res.json(result);
  } catch (error: any) {
    console.error('[CloudAuth] Login error:', error.message);
    res.status(401).json({ success: false, error: error.message || 'Login failed' });
  }
});

// ─── Self-Service Signup ─────────────────────

cloudAuthRouter.post('/saas/signup', async (req: Request, res: Response) => {
  try {
    const body = req.body as SignupRequest;

    if (!body.company_name || !body.slug || !body.admin_username || !body.admin_password || !body.admin_full_name || !body.admin_email || !body.admin_phone) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: company_name, slug, admin_username, admin_password, admin_full_name, admin_email, admin_phone',
      });
    }

    const result = await selfSignup(body);

    // Log activity
    try {
      await logActivity(
        result.user.user_id,
        'TENANT_SIGNUP',
        'tenant',
        result.tenant.tenant_id,
        `New tenant "${result.tenant.company_name}" registered`,
        req.ip,
      );
    } catch { /* non-critical */ }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('[CloudAuth] Signup error:', error.message);
    const status = error.message.includes('already taken') ? 409 : 400;
    res.status(status).json({ success: false, error: error.message || 'Signup failed' });
  }
});

// ─── Availability Checks ─────────────────────

cloudAuthRouter.post('/saas/check-slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const existing = await query(`SELECT tenant_id FROM tenants WHERE tenant_slug = $1`, [slug]);
    res.json({ available: existing.rows.length === 0, slug });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check slug availability' });
  }
});

cloudAuthRouter.post('/saas/check-username', async (req: Request, res: Response) => {
  try {
    const { username, tenant_slug } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    let available: boolean;
    if (tenant_slug) {
      // Scope check to the specified tenant (correct SaaS behaviour)
      const existing = await query(
        `SELECT u.user_id FROM users u
         JOIN tenant_users tu ON tu.user_id = u.user_id
         JOIN tenants t ON t.tenant_id = tu.tenant_id
         WHERE u.username = $1 AND t.tenant_slug = $2 AND u.deleted_at IS NULL`,
        [username, tenant_slug],
      );
      available = existing.rows.length === 0;
    } else {
      // No tenant context at signup time — slug hasn't been chosen yet, check globally
      const existing = await query(
        `SELECT user_id FROM users WHERE username = $1 AND deleted_at IS NULL`,
        [username],
      );
      available = existing.rows.length === 0;
    }

    res.json({ available, username });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// ─── Available Plans (for signup page) ───────

cloudAuthRouter.get('/saas/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await getPlans();
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// ─── Public Tenant Branding (for login page) ──
// Returns company_name + logo_url for a given workspace slug.
// No auth required — the login page needs this before the user authenticates.

cloudAuthRouter.get('/saas/tenant-branding/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ success: false, error: 'Workspace slug is required' });
      return;
    }

    const result = await query(
      `SELECT company_name, logo_url FROM tenants WHERE tenant_slug = $1 AND is_active = true LIMIT 1`,
      [slug.toLowerCase().trim()],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    const tenant = result.rows[0];
    res.json({
      success: true,
      company_name: tenant.company_name,
      logo_url: tenant.logo_url,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tenant branding' });
  }
});
