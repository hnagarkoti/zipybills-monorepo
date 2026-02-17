/**
 * Backup API – uses typed SDK from backup-system service-interface
 */

import {
  BackupApi,
  type BackupItem,
  type BackupCapabilities,
  type ExportResult,
  type CloudBackupResult,
  type GDriveBackupResult,
  type GDriveAuthUrlResult,
} from '@zipybills/factory-backup-service-interface';

export type {
  BackupItem,
  BackupCapabilities,
  ExportResult,
  CloudBackupResult,
  GDriveBackupResult,
  GDriveAuthUrlResult,
} from '@zipybills/factory-backup-service-interface';

export const backupApi = new BackupApi();

export async function fetchBackups(): Promise<BackupItem[]> {
  return backupApi.listBackups();
}

export async function fetchCapabilities(): Promise<BackupCapabilities> {
  return backupApi.getCapabilities();
}

export async function createExport(): Promise<ExportResult> {
  return backupApi.createExport();
}

export async function createCloudBackup(): Promise<CloudBackupResult> {
  return backupApi.createCloudBackup();
}

export function getDownloadUrl(backupId: string): string {
  return backupApi.getDownloadUrl(backupId);
}

export async function deleteBackup(backupId: string): Promise<void> {
  return backupApi.deleteBackup(backupId);
}

export async function getGDriveAuthUrl(): Promise<GDriveAuthUrlResult> {
  return backupApi.getGDriveAuthUrl();
}

export async function createGDriveBackup(): Promise<GDriveBackupResult> {
  return backupApi.createGDriveBackup();
}

export async function disconnectGDrive(): Promise<void> {
  return backupApi.disconnectGDrive();
}
