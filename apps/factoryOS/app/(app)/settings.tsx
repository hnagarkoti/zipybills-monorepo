/**
 * Settings route – /settings
 *
 * Renders the SettingsPage from the settings-frontend module.
 * Accessible to all authenticated users (tab visibility is role-gated internally).
 */
import React from 'react';
import { SettingsPage } from '@zipybills/factory-settings-frontend';

export default function SettingsRoute() {
  return <SettingsPage />;
}
