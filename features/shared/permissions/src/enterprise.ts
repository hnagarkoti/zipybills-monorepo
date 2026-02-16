/**
 * FactoryOS Enterprise Permissions System
 *
 * Industry-standard RBAC + ABAC capabilities:
 * - Custom roles (user-defined, editable)
 * - System roles (immutable templates)
 * - Permission groups/bundles
 * - Scope-based permissions (machine, department, plant level)
 * - Role hierarchy with inheritance
 * - Time-based/temporary permissions
 *
 * Permission format: "resource:action" or "resource:action:scope_type:scope_id"
 * Examples:
 *   "machines:view"                    — View all machines
 *   "machines:view:department:MACH"    — View machines in MACH department only
 *   "production:create:machine:5"      — Log production for machine #5 only
 */

import { query } from '@zipybills/factory-database-config';
import { logActivity } from '@zipybills/factory-activity-log';
import type { Permission, Role, Resource, Action } from './index.js';

// ─── Enhanced Types ───────────────────────────

export type ScopeType = 'global' | 'plant' | 'department' | 'machine';

export interface ScopedPermission {
  resource: Resource;
  action: Action;
  scopeType: ScopeType;
  scopeId?: string | number;  // department code, machine_id, plant code
}

export interface CustomRole {
  role_id: number;
  role_code: string;           // Unique identifier (e.g., 'SHIFT_LEAD')
  role_name: string;           // Display name
  description: string;
  is_system: boolean;          // True = immutable system role
  parent_role_id: number | null; // For hierarchy/inheritance
  priority: number;            // Higher = more authority
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroup {
  group_id: number;
  group_code: string;
  group_name: string;
  description: string;
  permissions: Permission[];
  created_at: string;
}

export interface ScopedUserPermission {
  id: number;
  user_id: number;
  permission: Permission;
  scope_type: ScopeType;
  scope_id: string | null;
  granted: boolean;
  expires_at: string | null;    // For temporary permissions
  granted_by: number;
  created_at: string;
}

export interface RoleTemplate {
  template_id: number;
  template_code: string;
  template_name: string;
  description: string;
  base_role: string;
  permissions: Permission[];
  scopes: { type: ScopeType; ids: string[] }[];
}

// ─── Enterprise Schema ────────────────────────

export async function initializeEnterprisePermissionsSchema(): Promise<void> {
  // Custom roles table
  await query(`
    CREATE TABLE IF NOT EXISTS custom_roles (
      role_id         SERIAL PRIMARY KEY,
      role_code       VARCHAR(50) UNIQUE NOT NULL,
      role_name       VARCHAR(100) NOT NULL,
      description     TEXT,
      is_system       BOOLEAN DEFAULT false,
      parent_role_id  INT REFERENCES custom_roles(role_id) ON DELETE SET NULL,
      priority        INT DEFAULT 0,
      tenant_id       INT,
      created_by      INT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Permission groups (bundles)
  await query(`
    CREATE TABLE IF NOT EXISTS permission_groups (
      group_id      SERIAL PRIMARY KEY,
      group_code    VARCHAR(50) UNIQUE NOT NULL,
      group_name    VARCHAR(100) NOT NULL,
      description   TEXT,
      permissions   TEXT[] DEFAULT '{}',
      tenant_id     INT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Role-to-group mapping
  await query(`
    CREATE TABLE IF NOT EXISTS role_permission_groups (
      id        SERIAL PRIMARY KEY,
      role_id   INT NOT NULL REFERENCES custom_roles(role_id) ON DELETE CASCADE,
      group_id  INT NOT NULL REFERENCES permission_groups(group_id) ON DELETE CASCADE,
      UNIQUE(role_id, group_id)
    );
  `);

  // Scoped user permissions (with expiry support)
  await query(`
    CREATE TABLE IF NOT EXISTS scoped_user_permissions (
      id          SERIAL PRIMARY KEY,
      user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      permission  VARCHAR(100) NOT NULL,
      scope_type  VARCHAR(20) DEFAULT 'global'
                  CHECK (scope_type IN ('global', 'plant', 'department', 'machine')),
      scope_id    VARCHAR(50),
      granted     BOOLEAN DEFAULT true,
      expires_at  TIMESTAMPTZ,
      granted_by  INT REFERENCES users(user_id),
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, permission, scope_type, scope_id)
    );
  `);

  // Role templates for quick role creation
  await query(`
    CREATE TABLE IF NOT EXISTS role_templates (
      template_id     SERIAL PRIMARY KEY,
      template_code   VARCHAR(50) UNIQUE NOT NULL,
      template_name   VARCHAR(100) NOT NULL,
      description     TEXT,
      base_role       VARCHAR(20) NOT NULL,
      permissions     TEXT[] DEFAULT '{}',
      scopes          JSONB DEFAULT '[]',
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add user_role_id for custom role assignment
  await query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_role_id INT REFERENCES custom_roles(role_id);
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `);

  // Create indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_custom_roles_code ON custom_roles(role_code);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_scoped_perms_user ON scoped_user_permissions(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_scoped_perms_scope ON scoped_user_permissions(scope_type, scope_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_scoped_perms_expires ON scoped_user_permissions(expires_at) WHERE expires_at IS NOT NULL;`);

  // Seed system roles
  await seedSystemRoles();
  // Seed default permission groups
  await seedPermissionGroups();

  console.log('[Permissions] ✅ Enterprise permissions schema initialized');
}

// ─── System Roles Seeding ─────────────────────

async function seedSystemRoles(): Promise<void> {
  const systemRoles = [
    { code: 'ADMIN', name: 'Administrator', desc: 'Full system access', priority: 100 },
    { code: 'SUPERVISOR', name: 'Supervisor', desc: 'Production floor oversight', priority: 50  },
    { code: 'OPERATOR', name: 'Operator', desc: 'Production data entry', priority: 10 },
    { code: 'VIEWER', name: 'Viewer', desc: 'Read-only access', priority: 5 },
    { code: 'SHIFT_LEAD', name: 'Shift Lead', desc: 'Shift-level supervision', priority: 30 },
    { code: 'QUALITY', name: 'Quality Inspector', desc: 'Quality control access', priority: 25 },
    { code: 'MAINTENANCE', name: 'Maintenance Tech', desc: 'Machine maintenance access', priority: 20 },
  ];

  for (const role of systemRoles) {
    await query(`
      INSERT INTO custom_roles (role_code, role_name, description, is_system, priority)
      VALUES ($1, $2, $3, true, $4)
      ON CONFLICT (role_code) DO NOTHING
    `, [role.code, role.name, role.desc, role.priority]);
  }
}

// ─── Permission Groups Seeding ────────────────

async function seedPermissionGroups(): Promise<void> {
  const groups: { code: string; name: string; desc: string; perms: string[] }[] = [
    {
      code: 'PRODUCTION_VIEW',
      name: 'Production Viewing',
      desc: 'View production data',
      perms: ['machines:view', 'shifts:view', 'plans:view', 'production:view', 'downtime:view'],
    },
    {
      code: 'PRODUCTION_EDIT',
      name: 'Production Entry',
      desc: 'Create and edit production data',
      perms: ['production:create', 'production:update', 'downtime:create', 'downtime:update'],
    },
    {
      code: 'PRODUCTION_FULL',
      name: 'Full Production Access',
      desc: 'Complete production management',
      perms: ['plans:create', 'plans:update', 'plans:delete', 'production:delete', 'downtime:delete'],
    },
    {
      code: 'REPORTING',
      name: 'Reporting',
      desc: 'Generate and export reports',
      perms: ['reports:view', 'reports:export', 'plans:export', 'production:export', 'downtime:export'],
    },
    {
      code: 'USER_MANAGEMENT',
      name: 'User Management',
      desc: 'Manage user accounts',
      perms: ['users:view', 'users:create', 'users:update', 'users:delete', 'users:manage'],
    },
    {
      code: 'SYSTEM_ADMIN',
      name: 'System Administration',
      desc: 'System-level administration',
      perms: ['settings:view', 'settings:manage', 'license:view', 'license:manage', 'backup:view', 'backup:create', 'backup:manage', 'audit:view', 'audit:export'],
    },
    {
      code: 'MACHINE_MANAGEMENT',
      name: 'Machine Management',
      desc: 'Full machine configuration access',
      perms: ['machines:view', 'machines:create', 'machines:update', 'machines:delete', 'machines:manage'],
    },
  ];

  for (const group of groups) {
    await query(`
      INSERT INTO permission_groups (group_code, group_name, description, permissions)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_code) DO NOTHING
    `, [group.code, group.name, group.desc, group.perms]);
  }
}

// ─── Custom Role CRUD ─────────────────────────

export async function createCustomRole(
  roleCode: string,
  roleName: string,
  description: string,
  parentRoleId: number | null,
  priority: number,
  createdBy: number,
  tenantId?: number,
): Promise<CustomRole> {
  const result = await query<CustomRole>(`
    INSERT INTO custom_roles (role_code, role_name, description, parent_role_id, priority, tenant_id, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [roleCode, roleName, description, parentRoleId, priority, tenantId, createdBy]);

  await logActivity(createdBy, 'CREATE_ROLE', 'role', result.rows[0]!.role_id, `Created role ${roleCode}`);
  return result.rows[0]!;
}

export async function getCustomRole(roleId: number): Promise<CustomRole | null> {
  const result = await query<CustomRole>(`SELECT * FROM custom_roles WHERE role_id = $1`, [roleId]);
  return result.rows[0] ?? null;
}

export async function getCustomRoleByCode(code: string): Promise<CustomRole | null> {
  const result = await query<CustomRole>(`SELECT * FROM custom_roles WHERE role_code = $1`, [code]);
  return result.rows[0] ?? null;
}

export async function getAllCustomRoles(tenantId?: number): Promise<CustomRole[]> {
  let sql = `SELECT * FROM custom_roles`;
  const params: (number | null)[] = [];
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $1 OR tenant_id IS NULL`;
    params.push(tenantId);
  }
  
  sql += ` ORDER BY priority DESC, role_name`;
  const result = await query<CustomRole>(sql, params);
  return result.rows;
}

export async function updateCustomRole(
  roleId: number,
  updates: Partial<Pick<CustomRole, 'role_name' | 'description' | 'priority' | 'parent_role_id'>>,
  updatedBy: number,
): Promise<CustomRole | null> {
  // Check if system role
  const existing = await getCustomRole(roleId);
  if (!existing) return null;
  if (existing.is_system) {
    throw new Error('Cannot modify system role');
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(roleId);

  const sql = `UPDATE custom_roles SET ${fields.join(', ')} WHERE role_id = $${idx} RETURNING *`;
  const result = await query<CustomRole>(sql, values);

  await logActivity(updatedBy, 'UPDATE_ROLE', 'role', roleId, `Updated role ${existing.role_code}`);
  return result.rows[0] ?? null;
}

export async function deleteCustomRole(roleId: number, deletedBy: number): Promise<boolean> {
  const existing = await getCustomRole(roleId);
  if (!existing) return false;
  if (existing.is_system) {
    throw new Error('Cannot delete system role');
  }

  await query(`DELETE FROM custom_roles WHERE role_id = $1`, [roleId]);
  await logActivity(deletedBy, 'DELETE_ROLE', 'role', roleId, `Deleted role ${existing.role_code}`);
  return true;
}

// ─── Permission Groups CRUD ───────────────────

export async function getAllPermissionGroups(tenantId?: number): Promise<PermissionGroup[]> {
  let sql = `SELECT * FROM permission_groups`;
  const params: (number | null)[] = [];
  
  if (tenantId) {
    sql += ` WHERE tenant_id = $1 OR tenant_id IS NULL`;
    params.push(tenantId);
  }
  
  sql += ` ORDER BY group_name`;
  const result = await query<PermissionGroup>(sql, params);
  return result.rows;
}

export async function assignGroupToRole(roleId: number, groupId: number): Promise<void> {
  await query(`
    INSERT INTO role_permission_groups (role_id, group_id)
    VALUES ($1, $2)
    ON CONFLICT (role_id, group_id) DO NOTHING
  `, [roleId, groupId]);
}

export async function removeGroupFromRole(roleId: number, groupId: number): Promise<void> {
  await query(`DELETE FROM role_permission_groups WHERE role_id = $1 AND group_id = $2`, [roleId, groupId]);
}

export async function getRoleGroups(roleId: number): Promise<PermissionGroup[]> {
  const result = await query<PermissionGroup>(`
    SELECT pg.* FROM permission_groups pg
    JOIN role_permission_groups rpg ON pg.group_id = rpg.group_id
    WHERE rpg.role_id = $1
  `, [roleId]);
  return result.rows;
}

// ─── Scoped Permissions ───────────────────────

export async function grantScopedPermission(
  userId: number,
  permission: Permission,
  scopeType: ScopeType,
  scopeId: string | null,
  grantedBy: number,
  expiresAt?: Date,
): Promise<ScopedUserPermission> {
  const result = await query<ScopedUserPermission>(`
    INSERT INTO scoped_user_permissions (user_id, permission, scope_type, scope_id, granted, granted_by, expires_at)
    VALUES ($1, $2, $3, $4, true, $5, $6)
    ON CONFLICT (user_id, permission, scope_type, scope_id) 
    DO UPDATE SET granted = true, expires_at = $6, granted_by = $5
    RETURNING *
  `, [userId, permission, scopeType, scopeId, grantedBy, expiresAt ?? null]);

  const scopeDesc = scopeId ? `${scopeType}:${scopeId}` : scopeType;
  await logActivity(grantedBy, 'GRANT_SCOPED_PERMISSION', 'user', userId, `Granted ${permission} (${scopeDesc})`);
  
  return result.rows[0]!;
}

export async function revokeScopedPermission(
  userId: number,
  permission: Permission,
  scopeType: ScopeType,
  scopeId: string | null,
  revokedBy: number,
): Promise<void> {
  await query(`
    DELETE FROM scoped_user_permissions 
    WHERE user_id = $1 AND permission = $2 AND scope_type = $3 AND (scope_id = $4 OR ($4 IS NULL AND scope_id IS NULL))
  `, [userId, permission, scopeType, scopeId]);

  const scopeDesc = scopeId ? `${scopeType}:${scopeId}` : scopeType;
  await logActivity(revokedBy, 'REVOKE_SCOPED_PERMISSION', 'user', userId, `Revoked ${permission} (${scopeDesc})`);
}

export async function getUserScopedPermissions(userId: number): Promise<ScopedUserPermission[]> {
  const result = await query<ScopedUserPermission>(`
    SELECT * FROM scoped_user_permissions 
    WHERE user_id = $1 
      AND granted = true 
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY permission, scope_type
  `, [userId]);
  return result.rows;
}

// ─── Hierarchical Permission Resolution ──────

/**
 * Get all permissions for a user including:
 * - Inherited from custom role
 * - Inherited from role's permission groups
 * - Direct scoped permissions
 * - Parent role inheritance
 */
export async function resolveUserPermissions(
  userId: number,
  customRoleId?: number,
): Promise<{
  permissions: Permission[];
  scopedPermissions: ScopedUserPermission[];
  roleHierarchy: CustomRole[];
}> {
  const allPermissions = new Set<Permission>();
  const roleHierarchy: CustomRole[] = [];

  // Resolve role hierarchy
  if (customRoleId) {
    let currentRoleId: number | null = customRoleId;
    while (currentRoleId) {
      const role = await getCustomRole(currentRoleId);
      if (!role) break;
      roleHierarchy.push(role);
      
      // Get groups for this role
      const groups = await getRoleGroups(role.role_id);
      for (const group of groups) {
        for (const perm of group.permissions) {
          allPermissions.add(perm as Permission);
        }
      }
      
      currentRoleId = role.parent_role_id;
    }
  }

  // Get direct scoped permissions
  const scopedPermissions = await getUserScopedPermissions(userId);
  for (const sp of scopedPermissions) {
    allPermissions.add(sp.permission as Permission);
  }

  return {
    permissions: Array.from(allPermissions),
    scopedPermissions,
    roleHierarchy,
  };
}

/**
 * Check if user has permission with optional scope check.
 */
export async function hasScopedPermission(
  userId: number,
  permission: Permission,
  scopeType?: ScopeType,
  scopeId?: string,
): Promise<boolean> {
  // Check for global permission first
  const globalCheck = await query(`
    SELECT 1 FROM scoped_user_permissions 
    WHERE user_id = $1 AND permission = $2 AND scope_type = 'global' AND granted = true
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `, [userId, permission]);

  if (globalCheck.rows.length > 0) return true;

  // Check for scoped permission if scope provided
  if (scopeType && scopeId) {
    const scopedCheck = await query(`
      SELECT 1 FROM scoped_user_permissions 
      WHERE user_id = $1 AND permission = $2 AND scope_type = $3 AND scope_id = $4 AND granted = true
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `, [userId, permission, scopeType, scopeId]);

    if (scopedCheck.rows.length > 0) return true;
  }

  return false;
}

// ─── Cleanup Expired Permissions ──────────────

export async function cleanupExpiredPermissions(): Promise<number> {
  const result = await query(`
    DELETE FROM scoped_user_permissions WHERE expires_at IS NOT NULL AND expires_at < NOW()
  `);
  return result.rowCount ?? 0;
}

// ─── Role Templates ───────────────────────────

export async function createRoleFromTemplate(
  templateCode: string,
  roleCode: string,
  roleName: string,
  createdBy: number,
  tenantId?: number,
): Promise<CustomRole> {
  const template = await query<RoleTemplate>(`
    SELECT * FROM role_templates WHERE template_code = $1
  `, [templateCode]);

  if (template.rows.length === 0) {
    throw new Error(`Template ${templateCode} not found`);
  }

  const tpl = template.rows[0]!;
  
  // Create role
  const role = await createCustomRole(
    roleCode,
    roleName,
    `Created from template: ${tpl.template_name}`,
    null,
    50,
    createdBy,
    tenantId,
  );

  // Assign permissions from template
  for (const perm of tpl.permissions) {
    await grantScopedPermission(createdBy, perm as Permission, 'global', null, createdBy);
  }

  return role;
}
