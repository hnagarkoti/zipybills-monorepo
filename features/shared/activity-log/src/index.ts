/**
 * FactoryOS Shared Activity Log
 *
 * Provides audit-trail logging used by all feature services.
 * Never throws — logging failures must not break the main flow.
 *
 * All entries are tenant-scoped in SaaS mode. The tenantId parameter
 * is required for proper tenant isolation — it must come from the
 * authenticated JWT, never from user input.
 */

import { query } from '@zipybills/factory-database-config';

export async function logActivity(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: string,
  ipAddress?: string,
  tenantId?: number | null,
): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType || null, entityId || null, details || null, ipAddress || null, tenantId || null],
    );
  } catch (err) {
    console.error('[FactoryOS] Failed to log activity:', err);
  }
}

/**
 * F4: Log an activity with structured before/after diff
 *
 * Stores oldValue/newValue as structured JSON in the details field
 * for proper audit trail of entity changes.
 */
export async function logActivityWithDiff(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  oldValue: Record<string, any> | null,
  newValue: Record<string, any> | null,
  ipAddress?: string,
  tenantId?: number | null,
): Promise<void> {
  const diff: Record<string, { old: any; new: any }> = {};

  if (oldValue && newValue) {
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const key of allKeys) {
      if (key === 'password_hash' || key === 'updated_at') continue; // Skip sensitive/auto fields
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        diff[key] = { old: oldValue[key], new: newValue[key] };
      }
    }
  }

  const details = JSON.stringify({
    action,
    entityType,
    entityId,
    diff: Object.keys(diff).length > 0 ? diff : undefined,
    before: oldValue ? { ...oldValue, password_hash: undefined } : undefined,
    after: newValue ? { ...newValue, password_hash: undefined } : undefined,
    timestamp: new Date().toISOString(),
  });

  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, details, ipAddress || null, tenantId || null],
    );
  } catch (err) {
    console.error('[FactoryOS] Failed to log activity with diff:', err);
  }
}

/**
 * J3: Log a cross-tenant access attempt
 *
 * Called when a query returns 0 results for a specific entity
 * but the entity may exist in another tenant's scope.
 */
export async function logCrossTenantAttempt(
  userId: number | null,
  entityType: string,
  entityId: number,
  requestedTenantId: number | null,
  ipAddress?: string,
): Promise<void> {
  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address, tenant_id)
       VALUES ($1, 'CROSS_TENANT_ACCESS_ATTEMPT', $2, $3, $4, $5, $6)`,
      [
        userId,
        entityType,
        entityId,
        JSON.stringify({
          warning: 'Possible cross-tenant access attempt',
          requestedTenantId,
          timestamp: new Date().toISOString(),
        }),
        ipAddress || null,
        requestedTenantId,
      ],
    );
  } catch (err) {
    console.error('[FactoryOS] Failed to log cross-tenant attempt:', err);
  }
}
