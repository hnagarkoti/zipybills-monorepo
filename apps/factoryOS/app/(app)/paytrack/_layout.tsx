import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { PayTrackLayout, type PayTrackTab } from '@zipybills/factory-paytrack-frontend';

function getActiveTab(pathname: string): PayTrackTab {
  if (pathname.includes('/paytrack/materials')) return 'materials';
  if (pathname.includes('/paytrack/projects')) return 'projects';
  if (pathname.includes('/paytrack/vendors')) return 'vendors';
  if (pathname.includes('/paytrack/payments')) return 'payments';
  return 'dashboard';
}

export default function PayTrackLayoutRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const activeTab = getActiveTab(pathname);
  const handleNavigate = (path: string) => router.push(path as never);
  const isIndex = pathname === '/paytrack' || pathname === '/paytrack/';

  // On sub-routes, wrap with the PayTrack sidebar layout
  if (!isIndex) {
    return (
      <PayTrackLayout activeTab={activeTab} onNavigate={handleNavigate}>
        <Slot />
      </PayTrackLayout>
    );
  }

  // On index, just render the index page directly
  return <Slot />;
}
