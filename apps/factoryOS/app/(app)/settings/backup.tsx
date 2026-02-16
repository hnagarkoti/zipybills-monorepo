/**
 * Backup & Data settings route – /settings/backup
 *
 * Visible to ADMIN role only.
 */
import React from 'react';
import { BackupSettings } from '@zipybills/factory-settings-frontend';

export default function BackupRoute() {
  return <BackupSettings />;
}
