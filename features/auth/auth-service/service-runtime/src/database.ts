/**
 * Auth Service – Database Operations
 */

import { query } from '@zipybills/factory-database-config';
import type { User } from '@zipybills/factory-auth-service-interface';

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await query<User>('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await query<User>('SELECT * FROM users WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
  const result = await query(
    `SELECT user_id, username, full_name, role, is_active, created_at, updated_at
     FROM users ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function createUser(
  username: string,
  passwordHash: string,
  fullName: string,
  role: string,
): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [username, passwordHash, fullName, role],
  );
  return result.rows[0]!;
}

export async function updateUser(
  userId: number,
  data: { full_name?: string; role?: string; is_active?: boolean },
): Promise<User | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (data.full_name !== undefined) { sets.push(`full_name = $${idx++}`); params.push(data.full_name); }
  if (data.role !== undefined) { sets.push(`role = $${idx++}`); params.push(data.role); }
  if (data.is_active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(data.is_active); }
  sets.push(`updated_at = NOW()`);

  params.push(userId);
  const result = await query<User>(
    `UPDATE users SET ${sets.join(', ')} WHERE user_id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] || null;
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2', [passwordHash, userId]);
}

export async function deleteUser(userId: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE user_id = $1', [userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUserCount(): Promise<number> {
  const result = await query('SELECT COUNT(*) as count FROM users');
  return parseInt(result.rows[0]!.count, 10);
}
