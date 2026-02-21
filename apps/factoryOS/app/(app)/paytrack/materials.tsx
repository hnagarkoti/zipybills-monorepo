import React from 'react';
import { MaterialsPage } from '@zipybills/factory-paytrack-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function PayTrackMaterialsRoute() {
  const { user } = useAuthStore();
  return <MaterialsPage userRole={user?.role ?? 'OPERATOR'} />;
}
