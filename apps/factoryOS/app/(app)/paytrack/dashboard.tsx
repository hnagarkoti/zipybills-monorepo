import React from 'react';
import { useRouter } from 'expo-router';
import { PayTrackDashboard } from '@zipybills/factory-paytrack-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function PayTrackDashboardRoute() {
  const router = useRouter();
  const { user } = useAuthStore();
  const handleNavigate = (tab: string) => router.push(`/paytrack/${tab}` as never);
  return <PayTrackDashboard onNavigate={handleNavigate} userRole={user?.role} />;
}
