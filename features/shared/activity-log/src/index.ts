/**
 * FactoryOS Shared Activity Log
 *
 * Provides audit-trail logging used by all feature services.
 * Never throws — logging failures must not break the main flow.
 */

import { query } from '@zipybills/factory-database-config';

export async function logActivity(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: string,
  ipAddress?: string,
): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType || null, entityId || null, details || null, ipAddress || null],
    );
  } catch (err) {
    console.error('[FactoryOS] Failed to log activity:', err);
  }
}
