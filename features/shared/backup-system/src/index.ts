/**
 * FactoryOS Backup System
 *
 * Provides database backup and restore functionality via pg_dump/pg_restore.
 * Supports:
 * - On-demand backup creation
 * - Scheduled backup management
 * - Backup listing and metadata
 * - Selective restore with safety checks
 * - Backup file download
 * - Automatic cleanup of old backups
 */

import { Router } from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { query } from '@zipybills/factory-database-config';
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';

const execFileAsync = promisify(execFile);

export const backupRouter = Router();

// ─── Config ───────────────────────────────────

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'factory_os';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '20', 10);

// ─── Types ────────────────────────────────────

export interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
  sizeHuman: string;
  type: 'manual' | 'scheduled';
  createdBy: string | null;
  status: 'completed' | 'failed' | 'in-progress';
  notes: string | null;
}

// ─── Schema ───────────────────────────────────

export async function initBackupSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS backup_history (
      backup_id    VARCHAR(50)  PRIMARY KEY,
      filename     VARCHAR(255) NOT NULL,
      created_at   TIMESTAMPTZ  DEFAULT NOW(),
      size_bytes   BIGINT       DEFAULT 0,
      backup_type  VARCHAR(20)  DEFAULT 'manual',
      created_by   INTEGER      REFERENCES users(user_id),
      status       VARCHAR(20)  DEFAULT 'in-progress',
      notes        TEXT,
      error_msg    TEXT
    );
  `);
}

// ─── Helpers ──────────────────────────────────

function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function humanFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function generateBackupId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').split('.')[0];
  const rand = Math.random().toString(36).substring(2, 6);
  return `bk_${ts}_${rand}`;
}

async function cleanupOldBackups(): Promise<number> {
  const result = await query(
    `SELECT backup_id, filename FROM backup_history
     WHERE status = 'completed'
     ORDER BY created_at DESC
     OFFSET $1`,
    [MAX_BACKUPS],
  );

  let deleted = 0;
  for (const row of result.rows) {
    const filepath = path.join(BACKUP_DIR, row.filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      await query(`DELETE FROM backup_history WHERE backup_id = $1`, [row.backup_id]);
      deleted++;
    } catch {
      // Continue with next
    }
  }
  return deleted;
}

// ─── Routes ───────────────────────────────────

/** List all backups */
backupRouter.get('/backups', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const result = await query(`
      SELECT bh.*, u.username, u.full_name
      FROM backup_history bh
      LEFT JOIN users u ON bh.created_by = u.user_id
      ORDER BY bh.created_at DESC
    `);

    const backups: BackupMetadata[] = result.rows.map((r: any) => ({
      id: r.backup_id,
      filename: r.filename,
      createdAt: r.created_at,
      sizeBytes: parseInt(r.size_bytes, 10),
      sizeHuman: humanFileSize(parseInt(r.size_bytes, 10)),
      type: r.backup_type,
      createdBy: r.full_name || r.username || null,
      status: r.status,
      notes: r.notes,
    }));

    res.json({ success: true, backups, backupDir: BACKUP_DIR });
  } catch (err) {
    console.error('[Backup] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to list backups' });
  }
});

/** Create a new backup */
backupRouter.post('/backups', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const backupId = generateBackupId();
  const filename = `${DB_NAME}_${backupId}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    ensureBackupDir();

    // Record backup start
    await query(
      `INSERT INTO backup_history (backup_id, filename, backup_type, created_by, status, notes)
       VALUES ($1, $2, $3, $4, 'in-progress', $5)`,
      [backupId, filename, req.body.type || 'manual', req.user!.user_id, req.body.notes || null],
    );

    // Run pg_dump with gzip
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    await execFileAsync('pg_dump', [
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-U', DB_USER,
      '-d', DB_NAME,
      '--format=custom',
      '--compress=6',
      '-f', filepath,
    ], { env });

    // Get file size
    const stats = fs.statSync(filepath);

    // Update backup record
    await query(
      `UPDATE backup_history SET status = 'completed', size_bytes = $1 WHERE backup_id = $2`,
      [stats.size, backupId],
    );

    // Cleanup old backups
    const cleaned = await cleanupOldBackups();

    await logActivity(
      req.user!.user_id,
      'BACKUP_CREATED',
      'backup',
      undefined,
      `Backup ${backupId} created (${humanFileSize(stats.size)})${cleaned > 0 ? `. Cleaned up ${cleaned} old backups.` : ''}`,
      req.ip,
    );

    res.json({
      success: true,
      backup: {
        id: backupId,
        filename,
        sizeBytes: stats.size,
        sizeHuman: humanFileSize(stats.size),
        status: 'completed',
      },
    });
  } catch (err: any) {
    console.error('[Backup] pg_dump error:', err);

    // Update backup record with error
    await query(
      `UPDATE backup_history SET status = 'failed', error_msg = $1 WHERE backup_id = $2`,
      [err.message || 'Unknown error', backupId],
    ).catch(() => {});

    // Clean up partial file
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch {}

    res.status(500).json({
      success: false,
      error: 'Backup failed. Ensure pg_dump is available on the server.',
      details: err.message,
    });
  }
});

/** Download a backup file */
backupRouter.get('/backups/:id/download', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const result = await query(
      `SELECT filename FROM backup_history WHERE backup_id = $1 AND status = 'completed'`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Backup not found' });
      return;
    }

    const filepath = path.join(BACKUP_DIR, result.rows[0].filename);
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: 'Backup file missing from disk' });
      return;
    }

    res.download(filepath, result.rows[0].filename);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to download backup' });
  }
});

/** Restore from a backup */
backupRouter.post('/backups/:id/restore', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query(
      `SELECT filename FROM backup_history WHERE backup_id = $1 AND status = 'completed'`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Backup not found' });
      return;
    }

    const filepath = path.join(BACKUP_DIR, result.rows[0].filename);
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ success: false, error: 'Backup file missing from disk' });
      return;
    }

    // Safety: require explicit confirmation
    if (req.body.confirm !== true) {
      res.status(400).json({
        success: false,
        error: 'Restore requires explicit confirmation. Send { "confirm": true } in request body.',
        warning: 'This will OVERWRITE the current database. Create a backup first!',
      });
      return;
    }

    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    await execFileAsync('pg_restore', [
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-U', DB_USER,
      '-d', DB_NAME,
      '--clean',
      '--if-exists',
      filepath,
    ], { env });

    await logActivity(
      req.user!.user_id,
      'BACKUP_RESTORED',
      'backup',
      undefined,
      `Database restored from backup ${req.params.id}`,
      req.ip,
    );

    res.json({
      success: true,
      message: `Database restored from backup ${req.params.id}`,
    });
  } catch (err: any) {
    console.error('[Backup] Restore error:', err);
    res.status(500).json({
      success: false,
      error: 'Restore failed',
      details: err.message,
    });
  }
});

/** Delete a backup */
backupRouter.delete('/backups/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await query(
      `SELECT filename FROM backup_history WHERE backup_id = $1`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Backup not found' });
      return;
    }

    const filepath = path.join(BACKUP_DIR, result.rows[0].filename);
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch {}

    await query(`DELETE FROM backup_history WHERE backup_id = $1`, [req.params.id]);

    await logActivity(
      req.user!.user_id,
      'BACKUP_DELETED',
      'backup',
      undefined,
      `Backup ${req.params.id} deleted`,
      req.ip,
    );

    res.json({ success: true, message: `Backup ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete backup' });
  }
});

/** Get backup system status */
backupRouter.get('/backups/status', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const [countResult, latestResult, totalSizeResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM backup_history WHERE status = 'completed'`),
      query(`SELECT * FROM backup_history WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1`),
      query(`SELECT COALESCE(SUM(size_bytes), 0) as total_size FROM backup_history WHERE status = 'completed'`),
    ]);

    // Check if pg_dump is available
    let pgDumpAvailable = false;
    try {
      await execFileAsync('pg_dump', ['--version']);
      pgDumpAvailable = true;
    } catch {}

    const totalSize = parseInt(totalSizeResult.rows[0]?.total_size ?? '0', 10);

    res.json({
      success: true,
      status: {
        pgDumpAvailable,
        backupDir: BACKUP_DIR,
        totalBackups: parseInt(countResult.rows[0]?.total ?? '0', 10),
        maxBackups: MAX_BACKUPS,
        totalSize: totalSize,
        totalSizeHuman: humanFileSize(totalSize),
        latestBackup: latestResult.rows[0]
          ? {
              id: latestResult.rows[0].backup_id,
              createdAt: latestResult.rows[0].created_at,
              sizeHuman: humanFileSize(parseInt(latestResult.rows[0].size_bytes, 10)),
            }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get backup status' });
  }
});
