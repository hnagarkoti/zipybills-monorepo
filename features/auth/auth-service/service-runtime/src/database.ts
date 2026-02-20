/**
 * Auth Service – Database Operations
 *
 * All user queries are tenant-scoped in SaaS mode.
 * tenantId = null means on-prem / unscoped (backward compat).
 */

import { query } from '@zipybills/factory-database-config';
import type { User } from '@zipybills/factory-auth-service-interface';

// ─── Helpers ──────────────────────────────────

function tenantClause(paramIndex: number, tenantId?: number | null): { clause: string; params: any[] } {
  if (tenantId == null) return { clause: '', params: [] };
  return { clause: ` AND tenant_id = $${paramIndex}`, params: [tenantId] };
}

const NOT_DELETED = ' AND deleted_at IS NULL';

// ─── Queries ──────────────────────────────────

export async function getUserByUsername(username: string, tenantId?: number | null): Promise<User | null> {
  const t = tenantClause(2, tenantId);
  const result = await query<User>(
    `SELECT * FROM users WHERE username = $1${t.clause}${NOT_DELETED}`,
    [username, ...t.params],
  );
  return result.rows[0] || null;
}

export async function getUserById(userId: number, tenantId?: number | null): Promise<User | null> {
  const t = tenantClause(2, tenantId);
  const result = await query<User>(
    `SELECT * FROM users WHERE user_id = $1${t.clause}${NOT_DELETED}`,
    [userId, ...t.params],
  );
  return result.rows[0] || null;
}

export async function getAllUsers(tenantId?: number | null): Promise<Omit<User, 'password_hash'>[]> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE 1=1${t.clause}${NOT_DELETED}` : `WHERE deleted_at IS NULL`;
  const result = await query(
    `SELECT user_id, username, full_name, role, is_active, created_at, updated_at, tenant_id
     FROM users ${where} ORDER BY created_at DESC`,
    t.params,
  );
  return result.rows;
}

export async function createUser(
  username: string,
  passwordHash: string,
  fullName: string,
  role: string,
  tenantId?: number | null,
): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (username, password_hash, full_name, role, tenant_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [username, passwordHash, fullName, role, tenantId || null],
  );
  return result.rows[0]!;
}

export async function updateUser(
  userId: number,
  data: { full_name?: string; role?: string; is_active?: boolean; preferred_locale?: string },
  tenantId?: number | null,
): Promise<User | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.full_name !== undefined) { sets.push(`full_name = $${idx++}`); params.push(data.full_name); }
  if (data.role !== undefined) { sets.push(`role = $${idx++}`); params.push(data.role); }
  if (data.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.is_active); }
  if (data.preferred_locale !== undefined) { sets.push(`preferred_locale = $${idx++}`); params.push(data.preferred_locale); }
  sets.push(`updated_at = NOW()`);

  params.push(userId);
  const t = tenantClause(idx + 1, tenantId);
  const result = await query<User>(
    `UPDATE users SET ${sets.join(', ')} WHERE user_id = $${idx}${t.clause} RETURNING *`,
    [...params, ...t.params],
  );
  return result.rows[0] || null;
}

export async function updateUserPassword(userId: number, passwordHash: string, tenantId?: number | null): Promise<void> {
  const t = tenantClause(3, tenantId);
  await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2${t.clause}`,
    [passwordHash, userId, ...t.params],
  );
}

export async function deleteUser(userId: number, tenantId?: number | null): Promise<boolean> {
  const t = tenantClause(2, tenantId);
  const result = await query(
    `UPDATE users SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE user_id = $1${t.clause} AND deleted_at IS NULL`,
    [userId, ...t.params],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getUserCount(tenantId?: number | null): Promise<number> {
  const t = tenantClause(1, tenantId);
  const where = t.clause ? `WHERE 1=1${t.clause}${NOT_DELETED}` : `WHERE deleted_at IS NULL`;
  const result = await query(`SELECT COUNT(*) as count FROM users ${where}`, t.params);
  return parseInt(result.rows[0]!.count, 10);
}
