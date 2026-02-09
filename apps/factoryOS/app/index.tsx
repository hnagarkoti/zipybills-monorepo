import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@zipybills/ui-store';

/**
 * Root index – auth-based redirect
 *
 * If authenticated → /dashboard
 * If not → /login
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
