/**
 * FactoryOS Tenant Backup & Export Service
 *
 * Provides tenant-scoped data export and backup functionality:
 * - JSON data export (all tenants can view/download their data)
 * - Cloud Backup (paid plans only — stored server-side)
 * - Google Drive Backup (OAuth integration — user authorizes their Gmail/Drive)
 * - Backup history & scheduling
 *
 * All data exports are tenant-isolated — a tenant can only export their own data.
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { query } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';

export const tenantBackupRouter = Router();

// ─── Config ───────────────────────────────────

const BACKUP_DIR = process.env.TENANT_BACKUP_DIR || path.resolve(process.cwd(), 'tenant-backups');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GDRIVE_CALLBACK_PATH = '/api/v1/tenant-backups/gdrive/callback';

/** Build the full redirect URI from the incoming request's origin */
function getGDriveRedirectUri(req: { protocol: string; get(name: string): string | undefined }): string {
  // Allow explicit override via env var (e.g. behind a custom domain)
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:4000';
  return `${proto}://${host}${GDRIVE_CALLBACK_PATH}`;
}

// ─── Schema ───────────────────────────────────

export async function initTenantBackupSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS tenant_backups (
      backup_id       VARCHAR(50)  PRIMARY KEY,
      tenant_id       INT          NOT NULL,
      backup_type     VARCHAR(30)  DEFAULT 'manual',
      storage_type    VARCHAR(20)  DEFAULT 'local',
      filename        VARCHAR(255) NOT NULL,
      size_bytes      BIGINT       DEFAULT 0,
      status          VARCHAR(20)  DEFAULT 'in-progress',
      download_url    TEXT,
      gdrive_file_id  TEXT,
      tables_exported TEXT[]       DEFAULT '{}',
      record_counts   JSONB        DEFAULT '{}',
      notes           TEXT,
      error_msg       TEXT,
      expires_at      TIMESTAMPTZ,
      created_by      INT,
      created_at      TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tenant_gdrive_tokens (
      tenant_id       INT          PRIMARY KEY,
      access_token    TEXT         NOT NULL,
      refresh_token   TEXT         NOT NULL,
      token_expiry    TIMESTAMPTZ  NOT NULL,
      user_email      TEXT,
      folder_id       TEXT,
      connected_by    INT,
      connected_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at      TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant ON tenant_backups(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tenant_backups_created ON tenant_backups(created_at DESC);`);
  console.log('[TenantBackup] ✅ Tenant backup schema initialized');
}

// ─── Helpers ──────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function humanSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function backupId(): string {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  return `tb_${ts}_${crypto.randomBytes(3).toString('hex')}`;
}

function getTenantId(req: AuthenticatedRequest): number | null {
  return (req as any).tenantId ?? (req.user as any)?.tenant_id ?? null;
}

async function getTenantPlan(tenantId: number): Promise<string> {
  const r = await query('SELECT plan FROM tenants WHERE tenant_id = $1', [tenantId]);
  return r.rows[0]?.plan ?? 'FREE';
}

// ─── Data Export (all plans) ──────────────────

/**
 * Export all tenant data as a structured JSON object.
 * This is available to ALL plans (including FREE) so users always have access to their data.
 */
async function exportTenantData(tenantId: number): Promise<{
  data: Record<string, any[]>;
  counts: Record<string, number>;
  tables: string[];
}> {
  const tables = [
    { name: 'users',           query: 'SELECT user_id, username, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1', key: 'users' },
    { name: 'machines',        query: 'SELECT * FROM machines WHERE tenant_id = $1 ORDER BY machine_id', key: 'machines' },
    { name: 'shifts',          query: 'SELECT * FROM shifts WHERE tenant_id = $1 ORDER BY shift_id', key: 'shifts' },
    { name: 'production_plans', query: 'SELECT * FROM production_plans WHERE tenant_id = $1 ORDER BY plan_id', key: 'production_plans' },
    { name: 'production_logs', query: 'SELECT * FROM production_logs WHERE tenant_id = $1 ORDER BY log_id', key: 'production_logs' },
    { name: 'downtime_events', query: 'SELECT * FROM downtime_events WHERE tenant_id = $1 ORDER BY event_id', key: 'downtime_events' },
  ];

  const data: Record<string, any[]> = {};
  const counts: Record<string, number> = {};
  const exportedTables: string[] = [];

  for (const t of tables) {
    try {
      const r = await query(t.query, [tenantId]);
      data[t.key] = r.rows;
      counts[t.key] = r.rows.length;
      exportedTables.push(t.name);
    } catch {
      // Table might not exist — skip
      data[t.key] = [];
      counts[t.key] = 0;
    }
  }

  return { data, counts, tables: exportedTables };
}

// ═══════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════

/** List tenant's backups */
tenantBackupRouter.get('/tenant-backups', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const result = await query(
      `SELECT b.*, u.username, u.full_name
       FROM tenant_backups b
       LEFT JOIN users u ON b.created_by = u.user_id
       WHERE b.tenant_id = $1
       ORDER BY b.created_at DESC`,
      [tenantId],
    );

    const backups = result.rows.map((r: any) => ({
      id: r.backup_id,
      type: r.backup_type,
      storageType: r.storage_type,
      filename: r.filename,
      sizeBytes: parseInt(r.size_bytes, 10),
      sizeHuman: humanSize(parseInt(r.size_bytes, 10)),
      status: r.status,
      recordCounts: r.record_counts,
      tablesExported: r.tables_exported,
      createdBy: r.full_name || r.username,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      gdriveFileId: r.gdrive_file_id,
      notes: r.notes,
    }));

    // Check Google Drive connection
    const gdriveCheck = await query(
      'SELECT user_email, connected_at FROM tenant_gdrive_tokens WHERE tenant_id = $1',
      [tenantId],
    );

    res.json({
      success: true,
      backups,
      gdrive: gdriveCheck.rows[0] ? {
        connected: true,
        email: gdriveCheck.rows[0].user_email,
        connectedAt: gdriveCheck.rows[0].connected_at,
      } : { connected: false },
    });
  } catch (err) {
    console.error('[TenantBackup] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to list backups' });
  }
});

/** Get backup capabilities (what's available on current plan) */
tenantBackupRouter.get('/tenant-backups/capabilities', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const plan = await getTenantPlan(tenantId);
    const isPaid = plan !== 'FREE';

    // Check Google Drive connection
    const gdriveCheck = await query(
      'SELECT user_email, connected_at FROM tenant_gdrive_tokens WHERE tenant_id = $1',
      [tenantId],
    );

    res.json({
      success: true,
      plan,
      capabilities: {
        // Everyone can export & download their data
        dataExport: { available: true, description: 'Download your data as JSON file' },
        // Cloud backup requires paid plan
        cloudBackup: {
          available: isPaid,
          description: isPaid
            ? 'Server-side encrypted cloud backups with scheduling'
            : 'Upgrade to Starter or higher for cloud backups',
          requiresPlan: 'STARTER',
        },
        // Google Drive available on all plans (it's the user's own storage)
        googleDrive: {
          available: true,
          connected: !!gdriveCheck.rows[0],
          email: gdriveCheck.rows[0]?.user_email ?? null,
          folderId: gdriveCheck.rows[0]?.folder_id ?? null,
          description: 'Back up to your personal Google Drive',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get capabilities' });
  }
});

/**
 * Create a data export (JSON dump) — available to ALL plans.
 * Users always have the right to download their own data.
 */
tenantBackupRouter.post('/tenant-backups/export', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const id = backupId();
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const tenantInfo = await query('SELECT company_name, tenant_slug FROM tenants WHERE tenant_id = $1', [tenantId]);
    const slug = tenantInfo.rows[0]?.tenant_slug ?? 'tenant';
    const filename = `${slug}_export_${new Date().toISOString().slice(0, 10)}_${id}.json`;

    // Record start
    await query(
      `INSERT INTO tenant_backups (backup_id, tenant_id, backup_type, storage_type, filename, status, created_by, notes)
       VALUES ($1, $2, 'export', 'local', $3, 'in-progress', $4, $5)`,
      [id, tenantId, filename, req.user!.user_id, req.body.notes || null],
    );

    // Export data
    const { data, counts, tables } = await exportTenantData(tenantId);

    const exportPayload = {
      meta: {
        exportId: id,
        tenantId,
        companyName: tenantInfo.rows[0]?.company_name,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        recordCounts: counts,
      },
      ...data,
    };

    // Write to disk
    const tenantDir = path.join(BACKUP_DIR, String(tenantId));
    ensureDir(tenantDir);
    const filepath = path.join(tenantDir, filename);
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    fs.writeFileSync(filepath, jsonStr, 'utf-8');

    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

    // Update record
    await query(
      `UPDATE tenant_backups SET status = 'completed', size_bytes = $1, tables_exported = $2, record_counts = $3 WHERE backup_id = $4`,
      [sizeBytes, tables, JSON.stringify(counts), id],
    );

    await logActivity(
      req.user!.user_id, 'BACKUP_EXPORT', 'tenant_backup', undefined,
      `Data export ${id} created (${humanSize(sizeBytes)})`, req.ip, tenantId,
    );

    res.json({
      success: true,
      backup: {
        id,
        filename,
        sizeBytes,
        sizeHuman: humanSize(sizeBytes),
        status: 'completed',
        recordCounts: counts,
      },
    });
  } catch (err: any) {
    console.error('[TenantBackup] Export error:', err);
    await query(`UPDATE tenant_backups SET status = 'failed', error_msg = $1 WHERE backup_id = $2`, [err.message, id]).catch(() => {});
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

/** Download a backup file — supports ?token= query param for browser downloads */
tenantBackupRouter.get('/tenant-backups/:id/download', async (req: AuthenticatedRequest, res, next) => {
  // Allow token via query param for direct browser downloads (window.open)
  const queryToken = req.query.token as string | undefined;
  if (queryToken && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
}, requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const result = await query(
      `SELECT filename FROM tenant_backups WHERE backup_id = $1 AND tenant_id = $2 AND status = 'completed'`,
      [req.params.id, tenantId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Backup not found' }); return;
    }

    const filepath = path.join(BACKUP_DIR, String(tenantId), result.rows[0].filename);
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: 'Backup file not found on disk' }); return;
    }

    await logActivity(
      req.user!.user_id, 'BACKUP_DOWNLOAD', 'tenant_backup', undefined,
      `Downloaded backup ${req.params.id}`, req.ip, tenantId,
    );

    res.download(filepath, result.rows[0].filename);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Download failed' });
  }
});

/** Delete a backup */
tenantBackupRouter.delete('/tenant-backups/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const result = await query(
      `SELECT filename FROM tenant_backups WHERE backup_id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Backup not found' }); return;
    }

    const filepath = path.join(BACKUP_DIR, String(tenantId), result.rows[0].filename);
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch {}

    await query('DELETE FROM tenant_backups WHERE backup_id = $1', [req.params.id]);

    res.json({ success: true, message: 'Backup deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

// ═══════════════════════════════════════════════
// CLOUD BACKUP (paid plans only)
// ═══════════════════════════════════════════════

/**
 * Create a cloud backup — stored server-side with encryption.
 * Only available on STARTER plan and above.
 */
tenantBackupRouter.post('/tenant-backups/cloud', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const id = backupId();
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    // Check plan allows cloud backup
    const plan = await getTenantPlan(tenantId);
    if (plan === 'FREE') {
      res.status(403).json({
        success: false,
        error: 'Cloud backup requires Starter plan or higher. Upgrade to enable.',
        code: 'PLAN_UPGRADE_REQUIRED',
        currentPlan: plan,
        requiredPlan: 'STARTER',
      });
      return;
    }

    const tenantInfo = await query('SELECT company_name, tenant_slug FROM tenants WHERE tenant_id = $1', [tenantId]);
    const slug = tenantInfo.rows[0]?.tenant_slug ?? 'tenant';
    const filename = `${slug}_cloud_${new Date().toISOString().slice(0, 10)}_${id}.json.enc`;

    await query(
      `INSERT INTO tenant_backups (backup_id, tenant_id, backup_type, storage_type, filename, status, created_by, notes, expires_at)
       VALUES ($1, $2, 'cloud', 'cloud', $3, 'in-progress', $4, $5, NOW() + INTERVAL '90 days')`,
      [id, tenantId, filename, req.user!.user_id, req.body.notes || null],
    );

    // Export data
    const { data, counts, tables } = await exportTenantData(tenantId);

    const exportPayload = {
      meta: {
        exportId: id,
        tenantId,
        companyName: tenantInfo.rows[0]?.company_name,
        exportedAt: new Date().toISOString(),
        encrypted: true,
        version: '1.0',
        recordCounts: counts,
      },
      ...data,
    };

    // Encrypt and write
    const jsonStr = JSON.stringify(exportPayload);
    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const tenantDir = path.join(BACKUP_DIR, String(tenantId), 'cloud');
    ensureDir(tenantDir);
    const filepath = path.join(tenantDir, filename);

    // Write: IV(16) + AuthTag(16) + EncryptedData
    const output = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(filepath, output);

    // Store encryption key in DB (in production, use a KMS)
    const sizeBytes = output.length;
    await query(
      `UPDATE tenant_backups SET status = 'completed', size_bytes = $1, tables_exported = $2, record_counts = $3,
       download_url = $4 WHERE backup_id = $5`,
      [sizeBytes, tables, JSON.stringify(counts), encryptionKey.toString('hex'), id],
    );

    await logActivity(
      req.user!.user_id, 'CLOUD_BACKUP', 'tenant_backup', undefined,
      `Cloud backup ${id} created (${humanSize(sizeBytes)}, encrypted)`, req.ip, tenantId,
    );

    res.json({
      success: true,
      backup: {
        id,
        filename,
        sizeBytes,
        sizeHuman: humanSize(sizeBytes),
        status: 'completed',
        encrypted: true,
        expiresIn: '90 days',
        recordCounts: counts,
      },
    });
  } catch (err: any) {
    console.error('[TenantBackup] Cloud backup error:', err);
    await query(`UPDATE tenant_backups SET status = 'failed', error_msg = $1 WHERE backup_id = $2`, [err.message, id]).catch(() => {});
    res.status(500).json({ success: false, error: 'Cloud backup failed' });
  }
});

// ═══════════════════════════════════════════════
// GOOGLE DRIVE BACKUP (OAuth)
// ═══════════════════════════════════════════════

/**
 * Get Google Drive authorization URL.
 * User clicks this to authorize FactoryOS to write to their Drive.
 */
tenantBackupRouter.get('/tenant-backups/gdrive/auth-url', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(501).json({
        success: false,
        error: 'Google Drive integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        code: 'GDRIVE_NOT_CONFIGURED',
      });
      return;
    }

    // Generate state token with tenantId + userId for callback verification
    const redirectUri = getGDriveRedirectUri(req);
    const state = Buffer.from(JSON.stringify({
      tenantId,
      userId: req.user!.user_id,
      ts: Date.now(),
      redirectUri,
    })).toString('base64url');

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    res.json({ success: true, authUrl, configured: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
});

/**
 * Google Drive OAuth callback.
 * Called by Google after user authorizes — exchanges code for tokens.
 */
tenantBackupRouter.get('/tenant-backups/gdrive/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).send('Missing authorization code or state'); return;
    }

    // Decode state
    let stateData: { tenantId: number; userId: number; ts: number; redirectUri: string };
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString());
    } catch {
      res.status(400).send('Invalid state parameter'); return;
    }

    // Exchange code for tokens (redirect_uri must match the one used in auth URL)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: stateData.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as any;

    if (!tokens.access_token) {
      console.error('[GDrive] Token exchange failed:', tokens);
      res.status(400).send('Failed to exchange authorization code'); return;
    }

    // Get user email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json() as any;

    // Create a FactoryOS folder in Drive
    let folderId: string | null = null;
    try {
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'FactoryOS Backups',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const folder = await folderRes.json() as any;
      folderId = folder.id;
    } catch (err) {
      console.error('[GDrive] Failed to create folder:', err);
    }

    // Store tokens
    const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
    await query(
      `INSERT INTO tenant_gdrive_tokens (tenant_id, access_token, refresh_token, token_expiry, user_email, folder_id, connected_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, tenant_gdrive_tokens.refresh_token),
         token_expiry = EXCLUDED.token_expiry,
         user_email = EXCLUDED.user_email,
         folder_id = COALESCE(EXCLUDED.folder_id, tenant_gdrive_tokens.folder_id),
         connected_by = EXCLUDED.connected_by,
         updated_at = NOW()`,
      [stateData.tenantId, tokens.access_token, tokens.refresh_token || '', expiry, userInfo.email, folderId, stateData.userId],
    );

    await logActivity(
      stateData.userId, 'GDRIVE_CONNECTED', 'tenant_backup', undefined,
      `Google Drive connected: ${userInfo.email}`, req.ip, stateData.tenantId,
    );

    // Redirect back to app settings page
    res.send(`
      <!DOCTYPE html>
      <html><head><title>FactoryOS — Google Drive Connected</title></head>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4">
        <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
          <h2 style="color:#059669">✅ Google Drive Connected!</h2>
          <p>Connected as <strong>${userInfo.email}</strong></p>
          <p>Backups will be saved to: <strong>FactoryOS Backups</strong> folder</p>
          <p style="margin-top:20px">You can close this window and return to the app.</p>
          <script>window.opener?.postMessage({ type: 'GDRIVE_CONNECTED', email: '${userInfo.email}' }, '*'); setTimeout(() => window.close(), 3000);</script>
        </div>
      </body></html>
    `);
  } catch (err) {
    console.error('[GDrive] Callback error:', err);
    res.status(500).send('Google Drive authorization failed. Please try again.');
  }
});

/**
 * Refresh Google Drive access token using stored refresh token.
 */
async function refreshGDriveToken(tenantId: number): Promise<string | null> {
  const r = await query('SELECT access_token, refresh_token, token_expiry FROM tenant_gdrive_tokens WHERE tenant_id = $1', [tenantId]);
  if (!r.rows[0]) return null;

  const { access_token, refresh_token, token_expiry } = r.rows[0];

  // Return current token if not expired (with 5-minute buffer)
  if (new Date(token_expiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return access_token;
  }

  if (!refresh_token) return null;

  // Refresh the token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await tokenRes.json() as any;
  if (!tokens.access_token) return null;

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);
  await query(
    'UPDATE tenant_gdrive_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE tenant_id = $3',
    [tokens.access_token, expiry, tenantId],
  );

  return tokens.access_token;
}

/**
 * Backup tenant data to Google Drive.
 * Available on ALL plans (user's own storage, not our cloud).
 */
tenantBackupRouter.post('/tenant-backups/gdrive', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const id = backupId();
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    // Check Google Drive is connected
    const gdriveInfo = await query('SELECT folder_id, user_email FROM tenant_gdrive_tokens WHERE tenant_id = $1', [tenantId]);
    if (!gdriveInfo.rows[0]) {
      res.status(400).json({
        success: false,
        error: 'Google Drive not connected. Authorize your account first.',
        code: 'GDRIVE_NOT_CONNECTED',
      });
      return;
    }

    const accessToken = await refreshGDriveToken(tenantId);
    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: 'Google Drive authorization expired. Please reconnect.',
        code: 'GDRIVE_TOKEN_EXPIRED',
      });
      return;
    }

    const tenantInfo = await query('SELECT company_name, tenant_slug FROM tenants WHERE tenant_id = $1', [tenantId]);
    const companyName = tenantInfo.rows[0]?.company_name ?? 'FactoryOS';
    const slug = tenantInfo.rows[0]?.tenant_slug ?? 'tenant';
    const filename = `${companyName}_backup_${new Date().toISOString().slice(0, 10)}.json`;

    await query(
      `INSERT INTO tenant_backups (backup_id, tenant_id, backup_type, storage_type, filename, status, created_by, notes)
       VALUES ($1, $2, 'gdrive', 'gdrive', $3, 'in-progress', $4, $5)`,
      [id, tenantId, filename, req.user!.user_id, req.body.notes || null],
    );

    // Export data
    const { data, counts, tables } = await exportTenantData(tenantId);

    const exportPayload = {
      meta: {
        exportId: id,
        tenantId,
        companyName,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        recordCounts: counts,
      },
      ...data,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

    // Upload to Google Drive
    const folderId = gdriveInfo.rows[0].folder_id;
    const boundary = `---factoryos-${crypto.randomBytes(8).toString('hex')}`;
    const metadata = JSON.stringify({
      name: filename,
      mimeType: 'application/json',
      ...(folderId ? { parents: [folderId] } : {}),
    });

    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      jsonStr,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    const uploadData = await uploadRes.json() as any;

    if (!uploadData.id) {
      throw new Error(`Google Drive upload failed: ${JSON.stringify(uploadData)}`);
    }

    await query(
      `UPDATE tenant_backups SET status = 'completed', size_bytes = $1, tables_exported = $2, record_counts = $3, gdrive_file_id = $4
       WHERE backup_id = $5`,
      [sizeBytes, tables, JSON.stringify(counts), uploadData.id, id],
    );

    await logActivity(
      req.user!.user_id, 'GDRIVE_BACKUP', 'tenant_backup', undefined,
      `Backed up to Google Drive (${humanSize(sizeBytes)}) → ${gdriveInfo.rows[0].user_email}`, req.ip, tenantId,
    );

    res.json({
      success: true,
      backup: {
        id,
        filename,
        sizeBytes,
        sizeHuman: humanSize(sizeBytes),
        status: 'completed',
        gdriveFileId: uploadData.id,
        driveEmail: gdriveInfo.rows[0].user_email,
        recordCounts: counts,
      },
    });
  } catch (err: any) {
    console.error('[TenantBackup] GDrive backup error:', err);
    await query(`UPDATE tenant_backups SET status = 'failed', error_msg = $1 WHERE backup_id = $2`, [err.message, id]).catch(() => {});
    res.status(500).json({ success: false, error: 'Google Drive backup failed: ' + err.message });
  }
});

/** Disconnect Google Drive */
tenantBackupRouter.delete('/tenant-backups/gdrive/disconnect', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    await query('DELETE FROM tenant_gdrive_tokens WHERE tenant_id = $1', [tenantId]);

    await logActivity(
      req.user!.user_id, 'GDRIVE_DISCONNECTED', 'tenant_backup', undefined,
      'Google Drive disconnected', req.ip, tenantId,
    );

    res.json({ success: true, message: 'Google Drive disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

/** Get Google Drive connection status */
tenantBackupRouter.get('/tenant-backups/gdrive/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) { res.status(403).json({ success: false, error: 'No tenant context' }); return; }

    const r = await query(
      'SELECT user_email, connected_at, folder_id FROM tenant_gdrive_tokens WHERE tenant_id = $1',
      [tenantId],
    );

    if (!r.rows[0]) {
      res.json({ success: true, connected: false, configured: !!GOOGLE_CLIENT_ID });
      return;
    }

    res.json({
      success: true,
      connected: true,
      email: r.rows[0].user_email,
      connectedAt: r.rows[0].connected_at,
      folderId: r.rows[0].folder_id,
      configured: !!GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});
