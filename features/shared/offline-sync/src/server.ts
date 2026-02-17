/**
 * FactoryOS Offline Sync - Server Module
 *
 * Server-side implementation of the outbox pattern for offline support:
 * - Outbox table for queued changes from offline clients
 * - Conflict resolution (last-write-wins, field-level merge, manual)
 * - Sync endpoints for push/pull operations
 * - Version vectors for causality tracking
 * - Batch sync with pagination
 */

import { Router } from 'express';
import { query } from '@zipybills/factory-database-config';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────

export type SyncOperationType = 'INSERT' | 'UPDATE' | 'DELETE';
export type ConflictResolution = 'LAST_WRITE_WINS' | 'FIELD_MERGE' | 'MANUAL' | 'CLIENT_WINS' | 'SERVER_WINS';
export type SyncStatus = 'PENDING' | 'APPLIED' | 'CONFLICTED' | 'REJECTED';

export interface SyncEntry {
  sync_id: string;
  client_id: string;
  tenant_id: number;
  entity_type: string;         // e.g. 'production_log', 'downtime_event'
  entity_id: string;
  operation: SyncOperationType;
  payload: Record<string, any>;
  version: number;
  client_timestamp: string;
  server_timestamp: string | null;
  status: SyncStatus;
  conflict_data: Record<string, any> | null;
  created_by: number;
}

export interface SyncPushRequest {
  client_id: string;
  entries: Array<{
    entity_type: string;
    entity_id: string;
    operation: SyncOperationType;
    payload: Record<string, any>;
    version: number;
    client_timestamp: string;
  }>;
}

export interface SyncPullRequest {
  client_id: string;
  entity_types: string[];
  last_sync_timestamp: string;
  limit?: number;
}

export interface SyncResult {
  applied: number;
  conflicted: number;
  rejected: number;
  conflicts: Array<{
    sync_id: string;
    entity_type: string;
    entity_id: string;
    client_version: number;
    server_version: number;
    resolution: ConflictResolution;
  }>;
}

// ─── Schema ───────────────────────────────────

export async function initializeOfflineSyncSchema(): Promise<void> {
  // Outbox: stores pending changes from offline clients
  await query(`
    CREATE TABLE IF NOT EXISTS sync_outbox (
      sync_id          VARCHAR(50) PRIMARY KEY,
      client_id        VARCHAR(100) NOT NULL,
      tenant_id        INT NOT NULL,
      entity_type      VARCHAR(100) NOT NULL,
      entity_id        VARCHAR(100) NOT NULL,
      operation        VARCHAR(10) CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
      payload          JSONB DEFAULT '{}',
      version          INT DEFAULT 1,
      client_timestamp TIMESTAMPTZ NOT NULL,
      server_timestamp TIMESTAMPTZ DEFAULT NOW(),
      status           VARCHAR(20) DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'APPLIED', 'CONFLICTED', 'REJECTED')),
      conflict_data    JSONB,
      created_by       INT NOT NULL,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Version tracking per entity
  await query(`
    CREATE TABLE IF NOT EXISTS sync_versions (
      tenant_id        INT NOT NULL,
      entity_type      VARCHAR(100) NOT NULL,
      entity_id        VARCHAR(100) NOT NULL,
      current_version  INT DEFAULT 1,
      last_modified_by INT,
      last_modified_at TIMESTAMPTZ DEFAULT NOW(),
      checksum         VARCHAR(64),
      PRIMARY KEY (tenant_id, entity_type, entity_id)
    );
  `);

  // Client sync state
  await query(`
    CREATE TABLE IF NOT EXISTS sync_client_state (
      client_id        VARCHAR(100) NOT NULL,
      tenant_id        INT NOT NULL,
      user_id          INT NOT NULL,
      last_sync_at     TIMESTAMPTZ DEFAULT NOW(),
      device_info      JSONB DEFAULT '{}',
      is_online        BOOLEAN DEFAULT true,
      PRIMARY KEY (client_id, tenant_id)
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_sync_outbox_tenant ON sync_outbox(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity_type, entity_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sync_outbox_timestamp ON sync_outbox(server_timestamp DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sync_versions_modified ON sync_versions(last_modified_at DESC);`);

  console.log('[OfflineSync] ✅ Offline sync schema initialized');
}

// ─── Conflict Resolution ──────────────────────

async function resolveConflict(
  entry: SyncEntry,
  serverVersion: number,
  serverData: Record<string, any> | null,
  strategy: ConflictResolution = 'LAST_WRITE_WINS',
): Promise<{ resolved: boolean; data: Record<string, any> | null; status: SyncStatus }> {
  switch (strategy) {
    case 'LAST_WRITE_WINS': {
      // Compare timestamps, latest wins
      if (serverData) {
        const serverTime = new Date(serverData.last_modified_at || 0).getTime();
        const clientTime = new Date(entry.client_timestamp).getTime();
        if (clientTime >= serverTime) {
          return { resolved: true, data: entry.payload, status: 'APPLIED' };
        }
        return { resolved: false, data: serverData, status: 'REJECTED' };
      }
      return { resolved: true, data: entry.payload, status: 'APPLIED' };
    }

    case 'CLIENT_WINS':
      return { resolved: true, data: entry.payload, status: 'APPLIED' };

    case 'SERVER_WINS':
      return { resolved: false, data: serverData, status: 'REJECTED' };

    case 'FIELD_MERGE': {
      // Merge non-conflicting fields
      if (serverData) {
        const merged = { ...serverData, ...entry.payload };
        return { resolved: true, data: merged, status: 'APPLIED' };
      }
      return { resolved: true, data: entry.payload, status: 'APPLIED' };
    }

    case 'MANUAL':
      return {
        resolved: false,
        data: null,
        status: 'CONFLICTED',
      };

    default:
      return { resolved: true, data: entry.payload, status: 'APPLIED' };
  }
}

// ─── Sync Operations ─────────────────────────

/**
 * Process a batch of sync entries from an offline client (PUSH)
 */
export async function processSyncPush(
  tenantId: number,
  userId: number,
  request: SyncPushRequest,
  conflictStrategy: ConflictResolution = 'LAST_WRITE_WINS',
): Promise<SyncResult> {
  const result: SyncResult = {
    applied: 0,
    conflicted: 0,
    rejected: 0,
    conflicts: [],
  };

  for (const entry of request.entries) {
    const syncId = uuidv4();

    // Check current server version
    const versionResult = await query<{ current_version: number; checksum: string }>(
      `SELECT current_version, checksum FROM sync_versions
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [tenantId, entry.entity_type, entry.entity_id],
    );

    const serverVersion = versionResult.rows[0]?.current_version ?? 0;

    // If versions match or no server version, apply directly
    if (entry.version >= serverVersion) {
      // Apply the change
      await query(`
        INSERT INTO sync_outbox (sync_id, client_id, tenant_id, entity_type, entity_id, 
          operation, payload, version, client_timestamp, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'APPLIED', $10)
      `, [
        syncId, request.client_id, tenantId, entry.entity_type, entry.entity_id,
        entry.operation, JSON.stringify(entry.payload), entry.version + 1,
        entry.client_timestamp, userId,
      ]);

      // Update version tracker
      await query(`
        INSERT INTO sync_versions (tenant_id, entity_type, entity_id, current_version, last_modified_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, entity_type, entity_id)
        DO UPDATE SET current_version = $4, last_modified_by = $5, last_modified_at = NOW()
      `, [tenantId, entry.entity_type, entry.entity_id, entry.version + 1, userId]);

      result.applied++;
    } else {
      // Conflict detected - resolve based on strategy
      const resolution = await resolveConflict(
        { sync_id: syncId, client_id: request.client_id, tenant_id: tenantId,
          entity_type: entry.entity_type, entity_id: entry.entity_id,
          operation: entry.operation, payload: entry.payload, version: entry.version,
          client_timestamp: entry.client_timestamp, server_timestamp: null,
          status: 'PENDING', conflict_data: null, created_by: userId },
        serverVersion,
        null,
        conflictStrategy,
      );

      await query(`
        INSERT INTO sync_outbox (sync_id, client_id, tenant_id, entity_type, entity_id,
          operation, payload, version, client_timestamp, status, conflict_data, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        syncId, request.client_id, tenantId, entry.entity_type, entry.entity_id,
        entry.operation, JSON.stringify(entry.payload), entry.version,
        entry.client_timestamp, resolution.status,
        resolution.data ? JSON.stringify(resolution.data) : null, userId,
      ]);

      if (resolution.status === 'CONFLICTED') {
        result.conflicted++;
      } else if (resolution.status === 'REJECTED') {
        result.rejected++;
      } else {
        result.applied++;
      }

      result.conflicts.push({
        sync_id: syncId,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        client_version: entry.version,
        server_version: serverVersion,
        resolution: conflictStrategy,
      });
    }
  }

  // Update client sync state
  await query(`
    INSERT INTO sync_client_state (client_id, tenant_id, user_id, last_sync_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (client_id, tenant_id)
    DO UPDATE SET last_sync_at = NOW(), is_online = true
  `, [request.client_id, tenantId, userId]);

  return result;
}

/**
 * Get changes since last sync for a client (PULL)
 */
export async function processSyncPull(
  tenantId: number,
  request: SyncPullRequest,
): Promise<{ entries: SyncEntry[]; hasMore: boolean; syncTimestamp: string }> {
  const limit = request.limit ?? 100;

  const result = await query<SyncEntry>(`
    SELECT * FROM sync_outbox
    WHERE tenant_id = $1
      AND entity_type = ANY($2)
      AND status = 'APPLIED'
      AND server_timestamp > $3
      AND client_id != $4
    ORDER BY server_timestamp ASC
    LIMIT $5
  `, [tenantId, request.entity_types, request.last_sync_timestamp, request.client_id, limit + 1]);

  const hasMore = result.rows.length > limit;
  const entries = result.rows.slice(0, limit);

  const syncTimestamp = entries.length > 0
    ? entries[entries.length - 1]!.server_timestamp ?? new Date().toISOString()
    : new Date().toISOString();

  return { entries, hasMore, syncTimestamp };
}

/**
 * Get unresolved conflicts for a tenant
 */
export async function getUnresolvedConflicts(
  tenantId: number,
): Promise<SyncEntry[]> {
  const result = await query<SyncEntry>(`
    SELECT * FROM sync_outbox
    WHERE tenant_id = $1 AND status = 'CONFLICTED'
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}

/**
 * Manually resolve a conflict
 */
export async function resolveConflictManually(
  syncId: string,
  resolution: 'accept_client' | 'accept_server' | 'merge',
  mergedData?: Record<string, any>,
): Promise<void> {
  if (resolution === 'accept_client') {
    await query(`UPDATE sync_outbox SET status = 'APPLIED' WHERE sync_id = $1`, [syncId]);
  } else if (resolution === 'accept_server') {
    await query(`UPDATE sync_outbox SET status = 'REJECTED' WHERE sync_id = $1`, [syncId]);
  } else if (resolution === 'merge' && mergedData) {
    await query(`
      UPDATE sync_outbox SET status = 'APPLIED', payload = $1 WHERE sync_id = $2
    `, [JSON.stringify(mergedData), syncId]);
  }
}

// ─── Router ───────────────────────────────────

export const offlineSyncRouter = Router();

/** Push offline changes */
offlineSyncRouter.post('/sync/push', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.tenant_id;
    const userId = authReq.user?.userId;
    if (!tenantId || !userId) return res.status(401).json({ error: 'Unauthorized' });

    const body = req.body as SyncPushRequest;
    if (!body.client_id || !Array.isArray(body.entries)) {
      return res.status(400).json({ error: 'client_id and entries required' });
    }

    const conflictStrategy = (req.query.strategy as ConflictResolution) || 'LAST_WRITE_WINS';
    const result = await processSyncPush(tenantId, userId, body, conflictStrategy);

    await logActivity(userId, 'SYNC_PUSH', 'sync', null,
      `Pushed ${body.entries.length} entries: ${result.applied} applied, ${result.conflicted} conflicted`);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[OfflineSync] Push error:', error);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

/** Pull changes since last sync */
offlineSyncRouter.post('/sync/pull', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.tenant_id;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const body = req.body as SyncPullRequest;
    if (!body.client_id || !body.last_sync_timestamp) {
      return res.status(400).json({ error: 'client_id and last_sync_timestamp required' });
    }

    const result = await processSyncPull(tenantId, body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[OfflineSync] Pull error:', error);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

/** Get conflicts for resolution */
offlineSyncRouter.get('/sync/conflicts', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.tenant_id;
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

    const conflicts = await getUnresolvedConflicts(tenantId);
    res.json({ success: true, conflicts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conflicts' });
  }
});

/** Resolve a conflict manually */
offlineSyncRouter.post('/sync/conflicts/:syncId/resolve', requireAuth, async (req, res) => {
  try {
    const { syncId } = req.params;
    const { resolution, mergedData } = req.body;

    if (!['accept_client', 'accept_server', 'merge'].includes(resolution)) {
      return res.status(400).json({ error: 'Invalid resolution type' });
    }

    await resolveConflictManually(syncId!, resolution, mergedData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

/** Get sync status for a client */
offlineSyncRouter.get('/sync/status', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.user?.tenant_id;
    const clientId = req.query.client_id as string;

    if (!tenantId || !clientId) {
      return res.status(400).json({ error: 'client_id query parameter required' });
    }

    const state = await query(`
      SELECT * FROM sync_client_state 
      WHERE client_id = $1 AND tenant_id = $2
    `, [clientId, tenantId]);

    const pendingCount = await query(`
      SELECT COUNT(*) as count FROM sync_outbox
      WHERE tenant_id = $1 AND status = 'PENDING'
    `, [tenantId]);

    const conflictCount = await query(`
      SELECT COUNT(*) as count FROM sync_outbox
      WHERE tenant_id = $1 AND status = 'CONFLICTED'
    `, [tenantId]);

    res.json({
      success: true,
      clientState: state.rows[0] ?? null,
      pendingEntries: parseInt(pendingCount.rows[0]?.count ?? '0', 10),
      unresolvedConflicts: parseInt(conflictCount.rows[0]?.count ?? '0', 10),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});
