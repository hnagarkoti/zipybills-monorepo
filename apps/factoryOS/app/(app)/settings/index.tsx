/**
 * Settings route – /settings
 *
 * Renders the SettingsPage hub from the settings-frontend module.
 * On desktop it auto-navigates to /settings/appearance.
 * On mobile it shows the settings tab list.
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsPage } from '@zipybills/factory-settings-frontend';

export default function SettingsRoute() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path as never);
  };

  return <SettingsPage onNavigate={handleNavigate} />;
}
