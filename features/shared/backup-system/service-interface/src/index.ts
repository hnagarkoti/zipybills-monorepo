/**
 * FactoryOS Backup Service Interface
 *
 * Types, API contract, and typed SDK client for tenant backup & data management.
 */

import { BaseApi, API_BASE } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

export interface BackupItem {
  id: string;
  type: string;
  storageType: string;
  filename: string;
  sizeHuman: string;
  status: string;
  recordCounts: Record<string, number>;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  gdriveFileId?: string;
}

export interface BackupCapabilities {
  plan: string;
  capabilities: {
    dataExport: { available: boolean; description: string };
    cloudBackup: { available: boolean; description: string; requiresPlan?: string };
    googleDrive: { available: boolean; connected: boolean; email: string | null; folderId: string | null; description: string };
  };
}

export interface ExportResult {
  success: boolean;
  backup: BackupItem;
  error?: string;
}

export interface CloudBackupResult {
  success: boolean;
  backup: BackupItem;
  error?: string;
}

export interface GDriveBackupResult {
  success: boolean;
  backup: BackupItem & { driveEmail: string };
  error?: string;
}

export interface GDriveAuthUrlResult {
  authUrl?: string;
  error?: string;
}

/** Options for backup operations — module selection & encryption */
export interface BackupOptions {
  /** Which modules to include. If empty/undefined, ALL modules are included. */
  modules?: string[];
  /** Whether to encrypt the backup data (uses BACKUP_ENCRYPTION_KEY from server env). */
  encrypted?: boolean;
}

/** Available module identifiers for backup selection */
export const BACKUP_MODULES = [
  { id: 'paytrack', labelKey: 'backup.module.paytrack', icon: 'receipt' },
  { id: 'planning', labelKey: 'backup.module.planning', icon: 'calendar' },
  { id: 'shifts', labelKey: 'backup.module.shifts', icon: 'clock' },
  { id: 'machines', labelKey: 'backup.module.machines', icon: 'cog' },
  { id: 'downtime', labelKey: 'backup.module.downtime', icon: 'alert-triangle' },
  { id: 'reports', labelKey: 'backup.module.reports', icon: 'bar-chart' },
  { id: 'settings', labelKey: 'backup.module.settings', icon: 'settings' },
] as const;

export type BackupModuleId = (typeof BACKUP_MODULES)[number]['id'];

// ─── Typed API Client ────────────────────────

export class BackupApi extends BaseApi {
  /** List all backups for the current tenant */
  async listBackups(): Promise<BackupItem[]> {
    const data = await this.request<{ backups: BackupItem[] }>('/api/tenant-backups');
    return data.backups;
  }

  /** Get backup capabilities for the current tenant/plan */
  async getCapabilities(): Promise<BackupCapabilities> {
    return this.request<BackupCapabilities>('/api/tenant-backups/capabilities');
  }

  /** Trigger a data export (JSON) */
  async createExport(options?: BackupOptions): Promise<ExportResult> {
    return this.request<ExportResult>('/api/tenant-backups/export', {
      method: 'POST',
      ...(options ? { body: JSON.stringify(options), headers: { 'Content-Type': 'application/json' } } : {}),
    });
  }

  /** Trigger a cloud backup (encrypted, server-side) */
  async createCloudBackup(options?: BackupOptions): Promise<CloudBackupResult> {
    return this.request<CloudBackupResult>('/api/tenant-backups/cloud', {
      method: 'POST',
      ...(options ? { body: JSON.stringify(options), headers: { 'Content-Type': 'application/json' } } : {}),
    });
  }

  /** Get the download URL for a completed backup (with auth token in query) */
  getDownloadUrl(backupId: string): string {
    const token = this.config.getAccessToken();
    const base = `${this.config.basePath}/api/${this.config.apiVersion}/tenant-backups/${backupId}/download`;
    return token ? `${base}?token=${token}` : base;
  }

  /** Delete a backup */
  async deleteBackup(backupId: string): Promise<void> {
    await this.request<{ success: boolean }>(`/api/tenant-backups/${backupId}`, { method: 'DELETE' });
  }

  /** Get Google Drive OAuth URL */
  async getGDriveAuthUrl(): Promise<GDriveAuthUrlResult> {
    return this.request<GDriveAuthUrlResult>('/api/tenant-backups/gdrive/auth-url');
  }

  /** Trigger a Google Drive backup */
  async createGDriveBackup(options?: BackupOptions): Promise<GDriveBackupResult> {
    return this.request<GDriveBackupResult>('/api/tenant-backups/gdrive', {
      method: 'POST',
      ...(options ? { body: JSON.stringify(options), headers: { 'Content-Type': 'application/json' } } : {}),
    });
  }

  /** Disconnect Google Drive */
  async disconnectGDrive(): Promise<void> {
    await this.request<{ success: boolean }>('/api/tenant-backups/gdrive/disconnect', { method: 'DELETE' });
  }
}
