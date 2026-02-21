import React from 'react';
import { VendorsPage } from '@zipybills/factory-paytrack-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function PayTrackVendorsRoute() {
  const { user } = useAuthStore();
  return <VendorsPage userRole={user?.role ?? 'OPERATOR'} />;
}
