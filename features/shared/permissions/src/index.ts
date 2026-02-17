/**
 * FactoryOS Role Permissions System
 *
 * Granular RBAC that extends the basic ADMIN/SUPERVISOR/OPERATOR roles
 * with fine-grained permissions per resource and action.
 *
 * Architecture:
 *   Role → Permission Set → Individual Permissions
 *
 * Permission format: "resource:action"
 *   e.g., "machines:create", "reports:export", "users:delete"
 *
 * Resources: machines, shifts, plans, production, downtime, reports,
 *            users, settings, license, backup, audit
 *
 * Actions: view, create, update, delete, export, manage
 *
 * Default role mappings follow least-privilege principle.
 */

import { query } from '@zipybills/factory-database-config';
import { logActivity } from '@zipybills/factory-activity-log';

// ─── Types ────────────────────────────────────

export type Resource =
  | 'machines'
  | 'shifts'
  | 'plans'
  | 'production'
  | 'downtime'
  | 'reports'
  | 'users'
  | 'settings'
  | 'license'
  | 'backup'
  | 'audit';

export type Action = 'view' | 'create' | 'update' | 'delete' | 'export' | 'manage';

export type Permission = `${Resource}:${Action}`;

export type Role = 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';

export interface RolePermission {
  role: Role;
  permissions: Permission[];
  description: string;
}

// ─── Default Permission Matrix ────────────────

export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'machines:view', 'machines:create', 'machines:update', 'machines:delete', 'machines:manage',
    'shifts:view', 'shifts:create', 'shifts:update', 'shifts:delete', 'shifts:manage',
    'plans:view', 'plans:create', 'plans:update', 'plans:delete', 'plans:export',
    'production:view', 'production:create', 'production:update', 'production:delete', 'production:export',
    'downtime:view', 'downtime:create', 'downtime:update', 'downtime:delete', 'downtime:export',
    'reports:view', 'reports:export', 'reports:manage',
    'users:view', 'users:create', 'users:update', 'users:delete', 'users:manage',
    'settings:view', 'settings:manage',
    'license:view', 'license:manage',
    'backup:view', 'backup:create', 'backup:manage',
    'audit:view', 'audit:export',
  ],
  SUPERVISOR: [
    // View + manage production ops, no system admin
    'machines:view', 'machines:create', 'machines:update',
    'shifts:view', 'shifts:create', 'shifts:update',
    'plans:view', 'plans:create', 'plans:update', 'plans:delete', 'plans:export',
    'production:view', 'production:create', 'production:update', 'production:export',
    'downtime:view', 'downtime:create', 'downtime:update', 'downtime:export',
    'reports:view', 'reports:export',
    'users:view',
    'settings:view',
    'audit:view',
  ],
  OPERATOR: [
    // Input production data, view own area
    'machines:view',
    'shifts:view',
    'plans:view',
    'production:view', 'production:create', 'production:update',
    'downtime:view', 'downtime:create',
    'reports:view',
  ],
};

// ─── All Available Permissions ────────────────

export const ALL_PERMISSIONS: { resource: Resource; action: Action; label: string }[] = [
  { resource: 'machines', action: 'view', label: 'View machines' },
  { resource: 'machines', action: 'create', label: 'Add machines' },
  { resource: 'machines', action: 'update', label: 'Edit machines' },
  { resource: 'machines', action: 'delete', label: 'Delete machines' },
  { resource: 'machines', action: 'manage', label: 'Manage machines' },
  { resource: 'shifts', action: 'view', label: 'View shifts' },
  { resource: 'shifts', action: 'create', label: 'Create shifts' },
  { resource: 'shifts', action: 'update', label: 'Edit shifts' },
  { resource: 'shifts', action: 'delete', label: 'Delete shifts' },
  { resource: 'shifts', action: 'manage', label: 'Manage shifts' },
  { resource: 'plans', action: 'view', label: 'View production plans' },
  { resource: 'plans', action: 'create', label: 'Create plans' },
  { resource: 'plans', action: 'update', label: 'Edit plans' },
  { resource: 'plans', action: 'delete', label: 'Delete plans' },
  { resource: 'plans', action: 'export', label: 'Export plans' },
  { resource: 'production', action: 'view', label: 'View production logs' },
  { resource: 'production', action: 'create', label: 'Log production' },
  { resource: 'production', action: 'update', label: 'Edit production logs' },
  { resource: 'production', action: 'delete', label: 'Delete production logs' },
  { resource: 'production', action: 'export', label: 'Export production data' },
  { resource: 'downtime', action: 'view', label: 'View downtime' },
  { resource: 'downtime', action: 'create', label: 'Log downtime' },
  { resource: 'downtime', action: 'update', label: 'Edit downtime' },
  { resource: 'downtime', action: 'delete', label: 'Delete downtime' },
  { resource: 'downtime', action: 'export', label: 'Export downtime' },
  { resource: 'reports', action: 'view', label: 'View reports' },
  { resource: 'reports', action: 'export', label: 'Export reports' },
  { resource: 'reports', action: 'manage', label: 'Manage reports' },
  { resource: 'users', action: 'view', label: 'View users' },
  { resource: 'users', action: 'create', label: 'Create users' },
  { resource: 'users', action: 'update', label: 'Edit users' },
  { resource: 'users', action: 'delete', label: 'Delete users' },
  { resource: 'users', action: 'manage', label: 'Manage users' },
  { resource: 'settings', action: 'view', label: 'View settings' },
  { resource: 'settings', action: 'manage', label: 'Manage settings' },
  { resource: 'license', action: 'view', label: 'View license' },
  { resource: 'license', action: 'manage', label: 'Manage license' },
  { resource: 'backup', action: 'view', label: 'View backups' },
  { resource: 'backup', action: 'create', label: 'Create backups' },
  { resource: 'backup', action: 'manage', label: 'Manage backups' },
  { resource: 'audit', action: 'view', label: 'View audit logs' },
  { resource: 'audit', action: 'export', label: 'Export audit logs' },
];

// ─── Database Schema ──────────────────────────

export async function initializePermissionsSchema(): Promise<void> {
  // Custom role-permission overrides table
  await query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id          SERIAL PRIMARY KEY,
      role        VARCHAR(20) NOT NULL,
      permission  VARCHAR(50) NOT NULL,
      granted     BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(role, permission)
    );
  `);

  // User-specific permission overrides (for individual users)
  await query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id          SERIAL PRIMARY KEY,
      user_id     INT NOT NULL REFERENCES users(user_id),
      permission  VARCHAR(50) NOT NULL,
      granted     BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, permission)
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);`);

  console.log('[Permissions] ✅ Permissions schema initialized');
}

// ─── Permission Resolution ────────────────────

/**
 * Get effective permissions for a user.
 * Resolution order: Default role perms → Role overrides → User overrides
 */
export async function getUserPermissions(userId: number, role: Role): Promise<Permission[]> {
  // Start with default role permissions
  const basePermissions = new Set(DEFAULT_PERMISSIONS[role] ?? []);

  // Apply role-level overrides from DB
  const roleOverrides = await query(
    `SELECT permission, granted FROM role_permissions WHERE role = $1`,
    [role],
  );
  for (const row of roleOverrides.rows) {
    if (row.granted) {
      basePermissions.add(row.permission);
    } else {
      basePermissions.delete(row.permission);
    }
  }

  // Apply user-level overrides from DB
  const userOverrides = await query(
    `SELECT permission, granted FROM user_permissions WHERE user_id = $1`,
    [userId],
  );
  for (const row of userOverrides.rows) {
    if (row.granted) {
      basePermissions.add(row.permission);
    } else {
      basePermissions.delete(row.permission);
    }
  }

  return Array.from(basePermissions) as Permission[];
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(
  userId: number,
  role: Role,
  permission: Permission,
): Promise<boolean> {
  const perms = await getUserPermissions(userId, role);
  return perms.includes(permission);
}

/**
 * Check if a user has ALL of the specified permissions.
 */
export async function hasAllPermissions(
  userId: number,
  role: Role,
  permissions: Permission[],
): Promise<boolean> {
  const perms = await getUserPermissions(userId, role);
  return permissions.every((p) => perms.includes(p));
}

/**
 * Check if a user has ANY of the specified permissions.
 */
export async function hasAnyPermission(
  userId: number,
  role: Role,
  permissions: Permission[],
): Promise<boolean> {
  const perms = await getUserPermissions(userId, role);
  return permissions.some((p) => perms.includes(p));
}

// ─── Admin Operations ─────────────────────────

/** Set a role-level permission override */
export async function setRolePermission(
  role: Role,
  permission: Permission,
  granted: boolean,
  adminUserId: number,
): Promise<void> {
  await query(
    `INSERT INTO role_permissions (role, permission, granted, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (role, permission) DO UPDATE SET granted = $3, updated_at = NOW()`,
    [role, permission, granted],
  );

  await logActivity(
    adminUserId,
    granted ? 'GRANT_ROLE_PERMISSION' : 'REVOKE_ROLE_PERMISSION',
    'permission',
    undefined,
    `${granted ? 'Granted' : 'Revoked'} ${permission} for role ${role}`,
  );
}

/** Set a user-level permission override */
export async function setUserPermission(
  userId: number,
  permission: Permission,
  granted: boolean,
  adminUserId: number,
): Promise<void> {
  await query(
    `INSERT INTO user_permissions (user_id, permission, granted)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, permission) DO UPDATE SET granted = $3`,
    [userId, permission, granted],
  );

  await logActivity(
    adminUserId,
    granted ? 'GRANT_USER_PERMISSION' : 'REVOKE_USER_PERMISSION',
    'user',
    userId,
    `${granted ? 'Granted' : 'Revoked'} ${permission} for user #${userId}`,
  );
}

/** Get all role-level overrides */
export async function getRoleOverrides(role: Role): Promise<{ permission: string; granted: boolean }[]> {
  const result = await query(
    `SELECT permission, granted FROM role_permissions WHERE role = $1 ORDER BY permission`,
    [role],
  );
  return result.rows;
}

/** Get all user-level overrides */
export async function getUserOverrides(userId: number): Promise<{ permission: string; granted: boolean }[]> {
  const result = await query(
    `SELECT permission, granted FROM user_permissions WHERE user_id = $1 ORDER BY permission`,
    [userId],
  );
  return result.rows;
}

/** Remove all custom overrides for a role (reset to defaults) */
export async function resetRolePermissions(role: Role, adminUserId: number): Promise<void> {
  await query(`DELETE FROM role_permissions WHERE role = $1`, [role]);
  await logActivity(adminUserId, 'RESET_ROLE_PERMISSIONS', 'permission', undefined, `Reset permissions for role ${role}`);
}
