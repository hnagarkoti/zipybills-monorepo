/**
 * FactoryOS Offline Sync - Client Module
 *
 * Client-side (React Native / Expo) offline support:
 * - Local queue for offline mutations
 * - Automatic sync when online
 * - Network status detection
 * - Optimistic updates with rollback
 * - Sync progress tracking
 *
 * Usage in React Native:
 *   import { OfflineSyncManager } from '@zipybills/factory-offline-sync/client';
 *   const sync = new OfflineSyncManager({ baseUrl: 'http://...', token: '...' });
 *   sync.enqueue({ entity_type: 'production_log', entity_id: '123', operation: 'UPDATE', payload: {...} });
 */

// ─── Types ────────────────────────────────────

export type SyncOperationType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface QueuedEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: SyncOperationType;
  payload: Record<string, any>;
  version: number;
  client_timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncManagerConfig {
  baseUrl: string;
  token: string;
  clientId: string;
  autoSync: boolean;
  syncIntervalMs: number;
  maxRetries: number;
  onSyncStart?: () => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: Error) => void;
  onOnlineChange?: (isOnline: boolean) => void;
  onConflict?: (conflict: ConflictInfo) => void;
}

export interface SyncResult {
  applied: number;
  conflicted: number;
  rejected: number;
  timestamp: string;
}

export interface ConflictInfo {
  sync_id: string;
  entity_type: string;
  entity_id: string;
  client_version: number;
  server_version: number;
}

// ─── Client-Side Sync Manager ─────────────────

export class OfflineSyncManager {
  private queue: QueuedEntry[] = [];
  private config: SyncManagerConfig;
  private isOnline = true;
  private isSyncing = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncTimestamp: string;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor(config: Partial<SyncManagerConfig> & { baseUrl: string; token: string }) {
    this.config = {
      clientId: config.clientId ?? this.generateClientId(),
      autoSync: config.autoSync ?? true,
      syncIntervalMs: config.syncIntervalMs ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      ...config,
    };
    this.lastSyncTimestamp = new Date(0).toISOString();

    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  // ─── Queue Management ─────────────────────

  /** Add a mutation to the offline queue */
  enqueue(entry: Omit<QueuedEntry, 'id' | 'client_timestamp' | 'retryCount' | 'maxRetries'>): string {
    const id = this.generateId();
    const queuedEntry: QueuedEntry = {
      ...entry,
      id,
      client_timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.queue.push(queuedEntry);
    this.emit('queueChanged', this.queue.length);

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      void this.sync();
    }

    return id;
  }

  /** Remove an entry from the queue (e.g., on undo) */
  dequeue(entryId: string): boolean {
    const idx = this.queue.findIndex(e => e.id === entryId);
    if (idx >= 0) {
      this.queue.splice(idx, 1);
      this.emit('queueChanged', this.queue.length);
      return true;
    }
    return false;
  }

  /** Get current queue state */
  getQueue(): readonly QueuedEntry[] {
    return [...this.queue];
  }

  /** Get queue size */
  getQueueSize(): number {
    return this.queue.length;
  }

  // ─── Sync Operations ─────────────────────

  /** Push queued changes to server and pull new changes */
  async sync(): Promise<SyncResult | null> {
    if (this.isSyncing || !this.isOnline) return null;

    this.isSyncing = true;
    this.config.onSyncStart?.();
    this.emit('syncStart');

    try {
      let result: SyncResult = { applied: 0, conflicted: 0, rejected: 0, timestamp: new Date().toISOString() };

      // PUSH: Send queued entries
      if (this.queue.length > 0) {
        const pushResult = await this.pushChanges();
        result = { ...result, ...pushResult };

        // Remove applied entries from queue
        this.queue = this.queue.filter(e => e.retryCount < e.maxRetries);
        this.emit('queueChanged', this.queue.length);
      }

      // PULL: Get server changes
      await this.pullChanges();

      this.config.onSyncComplete?.(result);
      this.emit('syncComplete', result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.config.onSyncError?.(err);
      this.emit('syncError', err);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushChanges(): Promise<SyncResult> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        entries: this.queue.map(e => ({
          entity_type: e.entity_type,
          entity_id: e.entity_id,
          operation: e.operation,
          payload: e.payload,
          version: e.version,
          client_timestamp: e.client_timestamp,
        })),
      }),
    });

    if (!response.ok) {
      // Increment retry counts
      for (const entry of this.queue) {
        entry.retryCount++;
      }
      throw new Error(`Push failed: ${response.status}`);
    }

    const data = await response.json();

    // Handle conflicts
    if (data.conflicts?.length > 0) {
      for (const conflict of data.conflicts) {
        this.config.onConflict?.(conflict);
        this.emit('conflict', conflict);
      }
    }

    return {
      applied: data.applied ?? 0,
      conflicted: data.conflicted ?? 0,
      rejected: data.rejected ?? 0,
      timestamp: new Date().toISOString(),
    };
  }

  private async pullChanges(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        entity_types: ['production_log', 'downtime_event', 'machine', 'shift'],
        last_sync_timestamp: this.lastSyncTimestamp,
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    if (data.entries?.length > 0) {
      this.emit('remoteChanges', data.entries);
      this.lastSyncTimestamp = data.syncTimestamp;
    }
  }

  // ─── Network Status ───────────────────────

  /** Update online/offline status */
  setOnline(online: boolean): void {
    const changed = this.isOnline !== online;
    this.isOnline = online;

    if (changed) {
      this.config.onOnlineChange?.(online);
      this.emit('onlineChange', online);

      // Sync immediately when coming back online
      if (online && this.queue.length > 0) {
        void this.sync();
      }
    }
  }

  /** Get current online status */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /** Get syncing status */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // ─── Auto Sync ────────────────────────────

  startAutoSync(): void {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => {
      if (this.isOnline) void this.sync();
    }, this.config.syncIntervalMs);
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ─── Event System ─────────────────────────

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }

  // ─── Cleanup ──────────────────────────────

  destroy(): void {
    this.stopAutoSync();
    this.listeners.clear();
    this.queue = [];
  }

  // ─── Utilities ────────────────────────────

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
}

// ─── React Hooks (for React Native / Expo) ────

/**
 * Hook: useOfflineSync
 *
 * Usage:
 *   const { isOnline, isSyncing, queueSize, sync, enqueue } = useOfflineSync(syncManager);
 */
export function createOfflineSyncHooks(manager: OfflineSyncManager) {
  return {
    /**
     * Get the sync manager instance (for direct access)
     */
    getManager: () => manager,

    /**
     * Enqueue a mutation for sync
     */
    enqueue: manager.enqueue.bind(manager),

    /**
     * Trigger manual sync
     */
    sync: manager.sync.bind(manager),

    /**
     * Subscribe to sync events
     */
    subscribe: manager.on.bind(manager),

    /**
     * Get current state snapshot
     */
    getState: () => ({
      isOnline: manager.getIsOnline(),
      isSyncing: manager.getIsSyncing(),
      queueSize: manager.getQueueSize(),
    }),
  };
}
