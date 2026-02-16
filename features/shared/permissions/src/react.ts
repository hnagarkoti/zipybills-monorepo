/**
 * FactoryOS Permission React Hooks
 *
 * Frontend permission checking hooks for conditional UI rendering.
 * Permissions are fetched from the API and cached in memory.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Permission, Role } from './index.js';
import { DEFAULT_PERMISSIONS } from './index.js';

// ─── Types ────────────────────────────────────

interface PermissionState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

// ─── In-Memory Cache ──────────────────────────

let cachedPermissions: Permission[] | null = null;
let cacheRole: string | null = null;

/**
 * Hook: Check if the current user has a specific permission.
 *
 * Uses the role from the JWT token to resolve default permissions.
 * For custom overrides, permissions should be fetched from the API.
 */
export function usePermission(permission: Permission, userRole?: Role): boolean {
  return useMemo(() => {
    if (!userRole) return false;
    if (cachedPermissions && cacheRole === userRole) {
      return cachedPermissions.includes(permission);
    }
    // Fallback to default permissions for the role
    const defaults = DEFAULT_PERMISSIONS[userRole] ?? [];
    return defaults.includes(permission);
  }, [permission, userRole]);
}

/**
 * Hook: Check if user has ANY of the specified permissions.
 */
export function useAnyPermission(permissions: Permission[], userRole?: Role): boolean {
  return useMemo(() => {
    if (!userRole) return false;
    const userPerms = cachedPermissions && cacheRole === userRole
      ? cachedPermissions
      : DEFAULT_PERMISSIONS[userRole] ?? [];
    return permissions.some((p) => userPerms.includes(p));
  }, [permissions, userRole]);
}

/**
 * Hook: Check if user has ALL of the specified permissions.
 */
export function useAllPermissions(permissions: Permission[], userRole?: Role): boolean {
  return useMemo(() => {
    if (!userRole) return false;
    const userPerms = cachedPermissions && cacheRole === userRole
      ? cachedPermissions
      : DEFAULT_PERMISSIONS[userRole] ?? [];
    return permissions.every((p) => userPerms.includes(p));
  }, [permissions, userRole]);
}

/**
 * Hook: Get all permissions for the current user's role.
 */
export function usePermissions(userRole?: Role): PermissionState {
  const [state, setState] = useState<PermissionState>({
    permissions: userRole ? (DEFAULT_PERMISSIONS[userRole] ?? []) : [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (userRole) {
      const perms = DEFAULT_PERMISSIONS[userRole] ?? [];
      cachedPermissions = perms;
      cacheRole = userRole;
      setState({ permissions: perms, loading: false, error: null });
    }
  }, [userRole]);

  return state;
}

/**
 * Utility: Clear the permission cache (e.g. on role change or logout).
 */
export function clearPermissionCache(): void {
  cachedPermissions = null;
  cacheRole = null;
}

// Re-export types for frontend consumers
export { DEFAULT_PERMISSIONS, ALL_PERMISSIONS } from './index.js';
export type { Permission, Role, Resource, Action } from './index.js';
