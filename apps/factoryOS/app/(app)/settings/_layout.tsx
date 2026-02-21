/**
 * settings/_layout – Nested layout for /settings/* routes
 *
 * Desktop: SettingsLayout wrapper with sidebar + <Slot /> for content
 * Mobile:  Slot renders the sub-route directly (full screen)
 *
 * The sidebar highlights the active tab based on the current pathname.
 */
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { SettingsLayout } from '@zipybills/factory-settings-frontend';
import type { SettingsTab } from '@zipybills/factory-settings-frontend';

/** Map pathname to SettingsTab */
function getActiveTab(pathname: string): SettingsTab {
  if (pathname.includes('/settings/company-profile')) return 'company-profile';
  if (pathname.includes('/settings/language')) return 'language';
  if (pathname.includes('/settings/compliance')) return 'compliance';
  if (pathname.includes('/settings/backup')) return 'backup';
  return 'appearance'; // default
}

export default function SettingsLayoutRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const activeTab = getActiveTab(pathname);

  const handleNavigate = (path: string) => {
    router.push(path as never);
  };

  // Desktop: wrap in SettingsLayout (sidebar + content)
  // Mobile at /settings index: Slot will render settings/index.tsx directly (tab list)
  // Mobile at /settings/xxx: Slot renders sub-route, SettingsLayout wraps with back button
  const isIndex = pathname === '/settings' || pathname === '/settings/';

  if (isDesktop && !isIndex) {
    return (
      <SettingsLayout activeTab={activeTab} onNavigate={handleNavigate}>
        <Slot />
      </SettingsLayout>
    );
  }

  // Mobile or index: render slot directly (index shows tab list, sub-routes show full screen)
  if (!isDesktop && !isIndex) {
    return (
      <SettingsLayout activeTab={activeTab} onNavigate={handleNavigate}>
        <Slot />
      </SettingsLayout>
    );
  }

  // Index page: no wrapper needed, SettingsPage handles its own layout
  return <Slot />;
}
