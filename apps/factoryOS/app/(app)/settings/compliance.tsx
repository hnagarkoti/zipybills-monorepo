/**
 * Compliance settings route – /settings/compliance
 *
 * Restricted to ADMIN role only. Non-admins who navigate here directly
 * (e.g. by typing the URL) are redirected to /settings.
 */
import React from 'react';
import { Redirect } from 'expo-router';
import { ComplianceSettings } from '@zipybills/factory-settings-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function ComplianceRoute() {
  const { user } = useAuthStore();

  // Route-level guard: block direct URL access for non-admins.
  if (!user || user.role !== 'ADMIN') {
    return <Redirect href="/settings" />;
  }

  return <ComplianceSettings userRole={user.role} />;
}
