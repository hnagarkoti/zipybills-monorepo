/**
 * FactoryOS Offline Sync
 *
 * Re-exports server and client modules for convenience.
 */

export {
  offlineSyncRouter,
  initializeOfflineSyncSchema,
  processSyncPush,
  processSyncPull,
  getUnresolvedConflicts,
  resolveConflictManually,
} from './server.js';

export type {
  SyncEntry,
  SyncPushRequest,
  SyncPullRequest,
  SyncResult,
  SyncOperationType,
  ConflictResolution,
  SyncStatus,
} from './server.js';
