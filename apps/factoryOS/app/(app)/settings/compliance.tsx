/**
 * Compliance settings route – /settings/compliance
 *
 * Visible to ADMIN and SUPERVISOR roles.
 */
import React from 'react';
import { ComplianceSettings } from '@zipybills/factory-settings-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function ComplianceRoute() {
  const { user } = useAuthStore();
  return <ComplianceSettings userRole={user?.role ?? 'OPERATOR'} />;
}
