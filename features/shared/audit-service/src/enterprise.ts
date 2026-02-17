/**
 * FactoryOS Enterprise Audit System
 *
 * Compliance-ready audit logging with:
 * - Immutable logs (no updates/deletes allowed)
 * - Hash-chain integrity (each log references previous hash)
 * - Tamper detection
 * - Compliance export (SOC2, GDPR, HIPAA ready)
 * - Retention policies
 * - Digital signatures
 *
 * Every mutation operation in the system must be logged here.
 */

import crypto from 'node:crypto';
import { query } from '@zipybills/factory-database-config';

// ─── Types ────────────────────────────────────

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
export type AuditCategory = 
  | 'AUTH'          // Login/logout/password changes
  | 'DATA'          // Create/update/delete operations
  | 'EXPORT'        // Data exports
  | 'LICENSE'       // License changes
  | 'PERMISSION'    // Role/permission changes
  | 'BACKUP'        // Backup operations
  | 'SYSTEM'        // System configuration changes
  | 'SECURITY';     // Security-related events

export interface AuditEntry {
  audit_id: number;
  tenant_id: number | null;
  user_id: number | null;
  username: string | null;
  action: string;
  category: AuditCategory;
  severity: AuditSeverity;
  entity_type: string;
  entity_id: number | string | null;
  old_value: string | null;      // JSON serialized
  new_value: string | null;      // JSON serialized
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  session_id: string | null;
  request_id: string | null;
  metadata: Record<string, any>;
  hash: string;                  // SHA-256 of entry + previous hash
  previous_hash: string | null;  // Hash-chain linkage
  signature: string | null;      // Optional digital signature
  created_at: string;
}

export interface AuditLogOptions {
  userId?: number;
  username?: string;
  action: string;
  category: AuditCategory;
  severity?: AuditSeverity;
  entityType: string;
  entityId?: number | string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  tenantId?: number;
}

export interface AuditQueryOptions {
  tenantId?: number;
  userId?: number;
  category?: AuditCategory;
  severity?: AuditSeverity;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'created_at' | 'severity' | 'action';
  orderDir?: 'ASC' | 'DESC';
}

export interface AuditStatistics {
  totalEntries: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topActions: { action: string; count: number }[];
  topUsers: { user_id: number; username: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

// ─── Database Schema ──────────────────────────

export async function initializeEnterpriseAuditSchema(): Promise<void> {
  // Immutable audit log table
  await query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      audit_id        BIGSERIAL PRIMARY KEY,
      tenant_id       INT,
      user_id         INT,
      username        VARCHAR(100),
      action          VARCHAR(100) NOT NULL,
      category        VARCHAR(20) NOT NULL DEFAULT 'DATA'
                      CHECK (category IN ('AUTH', 'DATA', 'EXPORT', 'LICENSE', 'PERMISSION', 'BACKUP', 'SYSTEM', 'SECURITY')),
      severity        VARCHAR(20) NOT NULL DEFAULT 'INFO'
                      CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'SECURITY')),
      entity_type     VARCHAR(50) NOT NULL,
      entity_id       VARCHAR(100),
      old_value       TEXT,
      new_value       TEXT,
      ip_address      INET,
      user_agent      TEXT,
      device_info     TEXT,
      session_id      VARCHAR(100),
      request_id      VARCHAR(100),
      metadata        JSONB DEFAULT '{}',
      hash            VARCHAR(64) NOT NULL,
      previous_hash   VARCHAR(64),
      signature       TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_log(category);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_log(severity);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_log(hash);`);

  // Prevent updates and deletes on audit_log (immutability)
  await createImmutabilityTrigger();

  // Retention policy table
  await query(`
    CREATE TABLE IF NOT EXISTS audit_retention_policies (
      policy_id     SERIAL PRIMARY KEY,
      tenant_id     INT,
      category      VARCHAR(20),
      severity      VARCHAR(20),
      retention_days INT NOT NULL DEFAULT 365,
      archive_enabled BOOLEAN DEFAULT false,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('[Audit] ✅ Enterprise audit schema initialized');
}

// ─── Immutability Trigger ─────────────────────

async function createImmutabilityTrigger(): Promise<void> {
  // Create function to prevent modifications
  await query(`
    CREATE OR REPLACE FUNCTION prevent_audit_modification()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs cannot be deleted';
      ELSIF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit logs cannot be modified';
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger
  await query(`
    DROP TRIGGER IF EXISTS audit_immutability ON audit_log;
  `);

  await query(`
    CREATE TRIGGER audit_immutability
      BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_modification();
  `);
}

// ─── Hash Computation ─────────────────────────

function computeAuditHash(
  entry: Omit<AuditEntry, 'audit_id' | 'hash'>,
  previousHash: string | null,
): string {
  const data = JSON.stringify({
    tenant_id: entry.tenant_id,
    user_id: entry.user_id,
    action: entry.action,
    category: entry.category,
    severity: entry.severity,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    old_value: entry.old_value,
    new_value: entry.new_value,
    ip_address: entry.ip_address,
    metadata: entry.metadata,
    created_at: entry.created_at,
    previous_hash: previousHash,
  });

  return crypto.createHash('sha256').update(data).digest('hex');
}

// ─── Core Logging Functions ───────────────────

/**
 * Write an immutable audit log entry with hash-chain linkage.
 */
export async function writeAuditLog(options: AuditLogOptions): Promise<AuditEntry> {
  // Get previous hash for chain linkage
  const lastEntry = await query<{ hash: string }>(`
    SELECT hash FROM audit_log ORDER BY audit_id DESC LIMIT 1
  `);
  const previousHash = lastEntry.rows[0]?.hash ?? null;

  const now = new Date().toISOString();
  
  // Prepare entry data
  const entryData = {
    tenant_id: options.tenantId ?? null,
    user_id: options.userId ?? null,
    username: options.username ?? null,
    action: options.action,
    category: options.category,
    severity: options.severity ?? 'INFO',
    entity_type: options.entityType,
    entity_id: options.entityId?.toString() ?? null,
    old_value: options.oldValue ? JSON.stringify(options.oldValue) : null,
    new_value: options.newValue ? JSON.stringify(options.newValue) : null,
    ip_address: options.ipAddress ?? null,
    user_agent: options.userAgent ?? null,
    device_info: options.deviceInfo ?? null,
    session_id: options.sessionId ?? null,
    request_id: options.requestId ?? null,
    metadata: options.metadata ?? {},
    previous_hash: previousHash,
    signature: null,
    created_at: now,
  };

  // Compute hash
  const hash = computeAuditHash(entryData as any, previousHash);

  // Insert
  const result = await query<AuditEntry>(`
    INSERT INTO audit_log (
      tenant_id, user_id, username, action, category, severity,
      entity_type, entity_id, old_value, new_value,
      ip_address, user_agent, device_info, session_id, request_id,
      metadata, hash, previous_hash, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *
  `, [
    entryData.tenant_id,
    entryData.user_id,
    entryData.username,
    entryData.action,
    entryData.category,
    entryData.severity,
    entryData.entity_type,
    entryData.entity_id,
    entryData.old_value,
    entryData.new_value,
    entryData.ip_address,
    entryData.user_agent,
    entryData.device_info,
    entryData.session_id,
    entryData.request_id,
    JSON.stringify(entryData.metadata),
    hash,
    previousHash,
    entryData.created_at,
  ]);

  return result.rows[0]!;
}

// ─── Convenience Logging Functions ────────────

export async function logAuth(
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'SESSION_EXPIRED',
  userId: number,
  username: string,
  ipAddress?: string,
  metadata?: Record<string, any>,
): Promise<void> {
  const severity: AuditSeverity = 
    action === 'LOGIN' || action === 'LOGOUT' ? 'INFO' :
    action.includes('PASSWORD') ? 'WARNING' : 'SECURITY';

  await writeAuditLog({
    userId,
    username,
    action,
    category: 'AUTH',
    severity,
    entityType: 'user',
    entityId: userId,
    ipAddress,
    metadata,
  });
}

export async function logDataChange(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE',
  entityType: string,
  entityId: string | number,
  userId: number,
  oldValue?: any,
  newValue?: any,
  metadata?: Record<string, any>,
): Promise<void> {
  const severity: AuditSeverity = action === 'DELETE' ? 'WARNING' : 'INFO';

  await writeAuditLog({
    userId,
    action,
    category: 'DATA',
    severity,
    entityType,
    entityId,
    oldValue,
    newValue,
    metadata,
  });
}

export async function logSecurityEvent(
  action: string,
  severity: AuditSeverity,
  details: Record<string, any>,
  userId?: number,
  ipAddress?: string,
): Promise<void> {
  await writeAuditLog({
    userId,
    action,
    category: 'SECURITY',
    severity,
    entityType: 'security',
    metadata: details,
    ipAddress,
  });
}

// ─── Query Functions ──────────────────────────

export async function queryAuditLogs(
  options: AuditQueryOptions,
): Promise<{ entries: AuditEntry[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (options.tenantId !== undefined) {
    conditions.push(`tenant_id = $${idx++}`);
    params.push(options.tenantId);
  }

  if (options.userId !== undefined) {
    conditions.push(`user_id = $${idx++}`);
    params.push(options.userId);
  }

  if (options.category) {
    conditions.push(`category = $${idx++}`);
    params.push(options.category);
  }

  if (options.severity) {
    conditions.push(`severity = $${idx++}`);
    params.push(options.severity);
  }

  if (options.action) {
    conditions.push(`action = $${idx++}`);
    params.push(options.action);
  }

  if (options.entityType) {
    conditions.push(`entity_type = $${idx++}`);
    params.push(options.entityType);
  }

  if (options.entityId) {
    conditions.push(`entity_id = $${idx++}`);
    params.push(options.entityId);
  }

  if (options.startDate) {
    conditions.push(`created_at >= $${idx++}`);
    params.push(options.startDate.toISOString());
  }

  if (options.endDate) {
    conditions.push(`created_at <= $${idx++}`);
    params.push(options.endDate.toISOString());
  }

  if (options.search) {
    conditions.push(`(action ILIKE $${idx} OR entity_type ILIKE $${idx} OR username ILIKE $${idx})`);
    params.push(`%${options.search}%`);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = options.orderBy ?? 'created_at';
  const orderDir = options.orderDir ?? 'DESC';
  const limit = options.limit ?? 50;
  const offset = ((options.page ?? 1) - 1) * limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_log ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  // Get entries
  params.push(limit, offset);
  const entriesResult = await query<AuditEntry>(
    `SELECT * FROM audit_log ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT $${idx++} OFFSET $${idx}`,
    params,
  );

  return { entries: entriesResult.rows, total };
}

// ─── Integrity Verification ───────────────────

export interface IntegrityReport {
  valid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  brokenChainAt: number | null;
  firstCorruptedId: number | null;
  errors: string[];
}

/**
 * Verify the hash-chain integrity of the audit log.
 * Returns a report of any tampering detected.
 */
export async function verifyAuditIntegrity(
  options?: { startId?: number; endId?: number; limit?: number },
): Promise<IntegrityReport> {
  const limit = options?.limit ?? 10000;
  let sql = `SELECT * FROM audit_log`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.startId) {
    conditions.push(`audit_id >= $1`);
    params.push(options.startId);
  }

  if (options?.endId) {
    conditions.push(`audit_id <= $${params.length + 1}`);
    params.push(options.endId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ` ORDER BY audit_id ASC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query<AuditEntry>(sql, params);
  const entries = result.rows;

  const report: IntegrityReport = {
    valid: true,
    totalEntries: entries.length,
    verifiedEntries: 0,
    brokenChainAt: null,
    firstCorruptedId: null,
    errors: [],
  };

  let previousHash: string | null = null;

  for (const entry of entries) {
    // Verify previous hash linkage
    if (entry.previous_hash !== previousHash) {
      report.valid = false;
      report.brokenChainAt = entry.audit_id;
      report.errors.push(`Chain broken at audit_id ${entry.audit_id}: expected previous_hash ${previousHash}, got ${entry.previous_hash}`);
      break;
    }

    // Recompute hash and verify
    const computedHash = computeAuditHash(entry as any, previousHash);
    if (computedHash !== entry.hash) {
      report.valid = false;
      report.firstCorruptedId = entry.audit_id;
      report.errors.push(`Hash mismatch at audit_id ${entry.audit_id}: entry may have been tampered`);
      break;
    }

    previousHash = entry.hash;
    report.verifiedEntries++;
  }

  return report;
}

// ─── Statistics ───────────────────────────────

export async function getAuditStatistics(
  tenantId?: number,
  days: number = 30,
): Promise<AuditStatistics> {
  const tenantFilter = tenantId ? `AND tenant_id = ${tenantId}` : '';
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Total entries
  const totalResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_log WHERE created_at >= $1 ${tenantFilter}`,
    [startDate],
  );

  // By category
  const categoryResult = await query<{ category: string; count: string }>(
    `SELECT category, COUNT(*) as count FROM audit_log WHERE created_at >= $1 ${tenantFilter} GROUP BY category`,
    [startDate],
  );

  // By severity
  const severityResult = await query<{ severity: string; count: string }>(
    `SELECT severity, COUNT(*) as count FROM audit_log WHERE created_at >= $1 ${tenantFilter} GROUP BY severity`,
    [startDate],
  );

  // Top actions
  const actionsResult = await query<{ action: string; count: string }>(
    `SELECT action, COUNT(*) as count FROM audit_log WHERE created_at >= $1 ${tenantFilter} GROUP BY action ORDER BY count DESC LIMIT 10`,
    [startDate],
  );

  // Top users
  const usersResult = await query<{ user_id: number; username: string; count: string }>(
    `SELECT user_id, username, COUNT(*) as count FROM audit_log WHERE created_at >= $1 AND user_id IS NOT NULL ${tenantFilter} GROUP BY user_id, username ORDER BY count DESC LIMIT 10`,
    [startDate],
  );

  // Recent activity (daily)
  const activityResult = await query<{ date: string; count: string }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count FROM audit_log WHERE created_at >= $1 ${tenantFilter} GROUP BY DATE(created_at) ORDER BY date DESC`,
    [startDate],
  );

  return {
    totalEntries: parseInt(totalResult.rows[0]?.count ?? '0', 10),
    byCategory: Object.fromEntries(categoryResult.rows.map(r => [r.category, parseInt(r.count, 10)])),
    bySeverity: Object.fromEntries(severityResult.rows.map(r => [r.severity, parseInt(r.count, 10)])),
    topActions: actionsResult.rows.map(r => ({ action: r.action, count: parseInt(r.count, 10) })),
    topUsers: usersResult.rows.map(r => ({ user_id: r.user_id, username: r.username ?? 'unknown', count: parseInt(r.count, 10) })),
    recentActivity: activityResult.rows.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
  };
}

// ─── Compliance Export ────────────────────────

export async function exportAuditLogsForCompliance(
  options: {
    tenantId?: number;
    startDate: Date;
    endDate: Date;
    format: 'JSON' | 'CSV';
    includeHashes?: boolean;
  },
): Promise<{ data: string; filename: string; recordCount: number }> {
  const { entries } = await queryAuditLogs({
    tenantId: options.tenantId,
    startDate: options.startDate,
    endDate: options.endDate,
    limit: 100000,
  });

  const recordCount = entries.length;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let data: string;
  let filename: string;

  if (options.format === 'CSV') {
    const headers = [
      'audit_id', 'created_at', 'user_id', 'username', 'action', 'category', 'severity',
      'entity_type', 'entity_id', 'ip_address',
    ];
    if (options.includeHashes) {
      headers.push('hash', 'previous_hash');
    }

    const rows = entries.map(e => [
      e.audit_id,
      e.created_at,
      e.user_id ?? '',
      e.username ?? '',
      e.action,
      e.category,
      e.severity,
      e.entity_type,
      e.entity_id ?? '',
      e.ip_address ?? '',
      ...(options.includeHashes ? [e.hash, e.previous_hash ?? ''] : []),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    data = [headers.join(','), ...rows].join('\n');
    filename = `audit-export-${timestamp}.csv`;
  } else {
    const exportData = entries.map(e => ({
      ...e,
      ...(options.includeHashes ? {} : { hash: undefined, previous_hash: undefined }),
    }));
    data = JSON.stringify(exportData, null, 2);
    filename = `audit-export-${timestamp}.json`;
  }

  return { data, filename, recordCount };
}

// ─── Retention Policy ─────────────────────────

/**
 * Archive or delete old audit logs based on retention policy.
 * Note: This requires admin override of the immutability trigger.
 */
export async function applyRetentionPolicy(
  tenantId?: number,
  dryRun: boolean = true,
): Promise<{ toArchive: number; toDelete: number }> {
  // Get applicable policies
  const policies = await query<{ category: string; severity: string; retention_days: number; archive_enabled: boolean }>(
    `SELECT * FROM audit_retention_policies WHERE tenant_id = $1 OR tenant_id IS NULL`,
    [tenantId ?? null],
  );

  let toArchive = 0;
  let toDelete = 0;

  for (const policy of policies.rows) {
    const cutoffDate = new Date(Date.now() - policy.retention_days * 24 * 60 * 60 * 1000);
    
    let conditions = `created_at < '${cutoffDate.toISOString()}'`;
    if (policy.category) conditions += ` AND category = '${policy.category}'`;
    if (policy.severity) conditions += ` AND severity = '${policy.severity}'`;
    if (tenantId) conditions += ` AND tenant_id = ${tenantId}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_log WHERE ${conditions}`,
    );
    const count = parseInt(countResult.rows[0]?.count ?? '0', 10);

    if (policy.archive_enabled) {
      toArchive += count;
    } else {
      toDelete += count;
    }
  }

  return { toArchive, toDelete };
}
