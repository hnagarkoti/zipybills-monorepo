/**
 * Appearance settings route – /settings/appearance
 */
import React from 'react';
import { AppearanceSettings } from '@zipybills/factory-settings-frontend';

export default function AppearanceRoute() {
  return <AppearanceSettings allowUserOverride />;
}
