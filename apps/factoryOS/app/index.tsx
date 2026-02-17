import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@zipybills/ui-store';

/**
 * Root index – auth-based redirect
 *
 * Platform admins → /platform
 * Tenant users   → /dashboard
 * Not logged in  → /login
 */
export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.is_platform_admin) {
    return <Redirect href="/platform" />;
  }

  return <Redirect href="/dashboard" />;
}
