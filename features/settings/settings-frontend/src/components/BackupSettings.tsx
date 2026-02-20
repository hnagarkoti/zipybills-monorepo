/**
 * BackupSettings – Backup & Data Management section
 *
 * Provides:
 *   - Data Export (download JSON) — all plans
 *   - Cloud Backup (encrypted server-side) — paid plans only
 *   - Google Drive Backup (OAuth) — all plans
 *   - Backup history list
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Platform, Linking } from 'react-native';
import { Download, Cloud, HardDrive, RefreshCw, Trash2, ExternalLink, Check, AlertCircle, Lock } from 'lucide-react-native';
import { useLocale } from '@zipybills/i18n-engine';
import {
  fetchBackups,
  fetchCapabilities,
  createExport,
  createCloudBackup,
  getDownloadUrl,
  deleteBackup,
  getGDriveAuthUrl,
  createGDriveBackup,
  disconnectGDrive,
  type BackupItem,
  type BackupCapabilities,
} from '../services/backup-api';

// ─── Helpers ──────────────────────────────────

const colors = {
  primary: '#059669',
  primaryBg: '#ecfdf5',
  blue: '#2563eb',
  blueBg: '#eff6ff',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  gray: '#6b7280',
  grayBg: '#f9fafb',
  red: '#dc2626',
  amber: '#d97706',
  white: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#6b7280',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-Components ───────────────────────────

function ActionCard({ icon, title, description, buttonLabel, onPress, loading, disabled, variant = 'primary', badge }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'blue' | 'purple';
  badge?: string;
}) {
  const c = variant === 'blue' ? colors.blue : variant === 'purple' ? colors.purple : colors.primary;
  const bg = variant === 'blue' ? colors.blueBg : variant === 'purple' ? colors.purpleBg : colors.primaryBg;

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-3">
      <View className="flex-row items-start gap-3">
        <View style={{ backgroundColor: bg, padding: 10, borderRadius: 10 }}>
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-gray-900 dark:text-white">{title}</Text>
            {badge && (
              <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-medium text-amber-700">{badge}</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        disabled={loading || disabled}
        className="mt-3 flex-row items-center justify-center py-2.5 rounded-lg"
        style={{ backgroundColor: disabled ? '#e5e7eb' : c, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : disabled ? (
          <>
            <Lock size={14} color="#9ca3af" />
            <Text className="text-sm font-medium text-gray-400 ml-2">{buttonLabel}</Text>
          </>
        ) : (
          <Text className="text-sm font-medium text-white">{buttonLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

function BackupRow({ backup, onDelete, t }: { backup: BackupItem; onDelete: (id: string) => void; t: (key: string) => string }) {
  const typeIcons: Record<string, React.ReactNode> = {
    export: <Download size={14} color={colors.primary} />,
    cloud: <Cloud size={14} color={colors.blue} />,
    gdrive: <HardDrive size={14} color={colors.purple} />,
  };
  const typeLabels: Record<string, string> = {
    export: t('backup.localExport'),
    cloud: t('backup.cloudBackup'),
    gdrive: t('backup.googleDrive'),
  };
  const statusColors: Record<string, string> = {
    completed: '#059669',
    failed: '#dc2626',
    'in-progress': '#d97706',
  };

  const totalRecords = Object.values(backup.recordCounts || {}).reduce((a, b) => a + (b as number), 0);

  return (
    <View className="flex-row items-center py-3 px-3 border-b border-gray-100 dark:border-gray-700">
      <View className="mr-3">{typeIcons[backup.type] || <Download size={14} color={colors.gray} />}</View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900 dark:text-white" numberOfLines={1}>
          {typeLabels[backup.type] || backup.type}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {formatDate(backup.createdAt)} · {backup.sizeHuman} · {totalRecords} records
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-1">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColors[backup.status] || colors.gray }} />
          <Text className="text-xs text-gray-500 capitalize">{backup.status}</Text>
        </View>

        {backup.type === 'export' && backup.status === 'completed' && (
          <Pressable
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open(getDownloadUrl(backup.id), '_blank');
              }
            }}
            className="p-1.5 rounded-md bg-gray-100"
          >
            <Download size={14} color={colors.primary} />
          </Pressable>
        )}

        {backup.type === 'gdrive' && backup.status === 'completed' && backup.gdriveFileId && (
          <Pressable
            onPress={() => {
              const url = `https://drive.google.com/file/d/${backup.gdriveFileId}/view`;
              if (Platform.OS === 'web') {
                window.open(url, '_blank');
              } else {
                Linking.openURL(url);
              }
            }}
            className="flex-row items-center gap-1 px-2 py-1.5 rounded-md bg-purple-50 dark:bg-purple-900/20"
          >
            <ExternalLink size={12} color={colors.purple} />
            <Text className="text-xs font-medium" style={{ color: colors.purple }}>{t('backup.viewInDrive')}</Text>
          </Pressable>
        )}

        <Pressable onPress={() => onDelete(backup.id)} className="p-1.5 rounded-md bg-red-50">
          <Trash2 size={14} color={colors.red} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────

export function BackupSettings() {
  const { t } = useLocale();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [capabilities, setCapabilities] = useState<BackupCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [cloudBacking, setCloudBacking] = useState(false);
  const [gdriveBacking, setGdriveBacking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [backupList, capRes] = await Promise.all([
        fetchBackups().catch(() => [] as BackupItem[]),
        fetchCapabilities(),
      ]);
      setBackups(backupList);
      setCapabilities(capRes);
    } catch (err) {
      console.error('Load backup data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Actions ────────────────────────────────

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await createExport();
      if (res.success) {
        showToast(`Export created: ${res.backup.sizeHuman} (${Object.values(res.backup.recordCounts || {}).reduce((a: number, b: any) => a + b, 0)} records)`);
        // Auto-download on web
        if (Platform.OS === 'web') {
          window.open(getDownloadUrl(res.backup.id), '_blank');
        }
        loadData();
      } else {
        showToast(res.error || 'Export failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCloudBackup = async () => {
    try {
      setCloudBacking(true);
      const res = await createCloudBackup();
      if (res.success) {
        showToast(`Cloud backup created: ${res.backup.sizeHuman} (encrypted, expires in 90 days)`);
        loadData();
      } else {
        showToast(res.error || 'Cloud backup failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Cloud backup failed', 'error');
    } finally {
      setCloudBacking(false);
    }
  };

  const handleGDriveConnect = async () => {
    try {
      const res = await getGDriveAuthUrl();
      if (res.authUrl) {
        if (Platform.OS === 'web') {
          window.open(res.authUrl, '_blank', 'width=600,height=700');
          // Listen for connection success
          const handler = (event: MessageEvent) => {
            if (event.data?.type === 'GDRIVE_CONNECTED') {
              showToast(`Google Drive connected: ${event.data.email}`);
              loadData();
              window.removeEventListener('message', handler);
            }
          };
          window.addEventListener('message', handler);
        } else {
          Linking.openURL(res.authUrl);
        }
      } else {
        showToast(res.error || 'Google Drive not configured', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to connect Google Drive', 'error');
    }
  };

  const handleGDriveBackup = async () => {
    try {
      setGdriveBacking(true);
      const res = await createGDriveBackup();
      if (res.success) {
        showToast(`Backed up to Google Drive: ${res.backup.sizeHuman} → ${res.backup.driveEmail}`);
        loadData();
      } else {
        showToast(res.error || 'Google Drive backup failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Google Drive backup failed', 'error');
    } finally {
      setGdriveBacking(false);
    }
  };

  const handleGDriveDisconnect = async () => {
    try {
      await disconnectGDrive();
      showToast('Google Drive disconnected');
      loadData();
    } catch (err: any) {
      showToast('Failed to disconnect', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBackup(id);
      showToast('Backup deleted');
      loadData();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // ─── Render ────────────────────────────────

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm text-gray-500 mt-3">{t('backup.loadingSettings')}</Text>
      </View>
    );
  }

  const cap = capabilities?.capabilities;
  const plan = capabilities?.plan ?? 'FREE';
  const gdriveConnected = cap?.googleDrive?.connected ?? false;

  return (
    <View className="flex-1">
      {/* Toast */}
      {toast && (
        <View
          className="mb-4 px-4 py-3 rounded-lg flex-row items-center gap-2"
          style={{ backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4' }}
        >
          {toast.type === 'error'
            ? <AlertCircle size={16} color={colors.red} />
            : <Check size={16} color={colors.primary} />
          }
          <Text className="text-sm flex-1" style={{ color: toast.type === 'error' ? colors.red : colors.primary }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* Plan badge */}
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.backup')}</Text>
        <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
          <Text className="text-xs font-semibold text-emerald-700">{plan}</Text>
        </View>
      </View>

      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('backup.subtitle')}
      </Text>

      {/* ─── Action Cards ──────────────────── */}

      {/* 1. Data Export (all plans) */}
      <ActionCard
        icon={<Download size={20} color={colors.primary} />}
        title={t('backup.downloadExport')}
        description={t('backup.downloadExportDesc')}
        buttonLabel={t('backup.exportDownload')}
        onPress={handleExport}
        loading={exporting}
        variant="primary"
      />

      {/* 2. Cloud Backup (paid plans only) */}
      <ActionCard
        icon={<Cloud size={20} color={colors.blue} />}
        title={t('backup.cloudBackup')}
        description={cap?.cloudBackup?.available
          ? t('backup.cloudBackupAvailableDesc')
          : t('backup.cloudBackupLockedDesc')}
        buttonLabel={cap?.cloudBackup?.available ? t('backup.createCloudBackup') : t('backup.upgradeToEnable')}
        onPress={cap?.cloudBackup?.available ? handleCloudBackup : () => {}}
        loading={cloudBacking}
        disabled={!cap?.cloudBackup?.available}
        variant="blue"
        badge={!cap?.cloudBackup?.available ? t('backup.starterPlus') : undefined}
      />

      {/* 3. Google Drive (all plans) */}
      <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <View className="flex-row items-start gap-3">
          <View style={{ backgroundColor: colors.purpleBg, padding: 10, borderRadius: 10 }}>
            <HardDrive size={20} color={colors.purple} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-white">{t('backup.gdriveBackup')}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {gdriveConnected
                ? `${t('backup.connectedAs')} ${cap?.googleDrive?.email}. ${t('backup.backupDirectly')}`
                : t('backup.connectGdriveDesc')}
            </Text>
          </View>
        </View>

        {gdriveConnected ? (
          <View className="mt-3" style={{ gap: 8 }}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleGDriveBackup}
                disabled={gdriveBacking}
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg"
                style={{ backgroundColor: colors.purple, opacity: gdriveBacking ? 0.7 : 1 }}
              >
                {gdriveBacking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-medium text-white">{t('backup.backupToDrive')}</Text>
                )}
              </Pressable>
              <Pressable
                onPress={handleGDriveDisconnect}
                className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700"
              >
                <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('backup.disconnect')}</Text>
              </Pressable>
            </View>

            {cap?.googleDrive?.folderId && (
              <Pressable
                onPress={() => {
                  const url = `https://drive.google.com/drive/folders/${cap.googleDrive.folderId}`;
                  if (Platform.OS === 'web') {
                    window.open(url, '_blank');
                  } else {
                    Linking.openURL(url);
                  }
                }}
                className="flex-row items-center justify-center gap-2 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20"
              >
                <ExternalLink size={14} color={colors.purple} />
                <Text className="text-sm font-medium" style={{ color: colors.purple }}>{t('backup.openDriveFolder')}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable
            onPress={handleGDriveConnect}
            className="mt-3 flex-row items-center justify-center py-2.5 rounded-lg gap-2"
            style={{ backgroundColor: colors.purple }}
          >
            <ExternalLink size={14} color="#fff" />
            <Text className="text-sm font-medium text-white">{t('backup.connectGdrive')}</Text>
          </Pressable>
        )}
      </View>

      {/* ─── Backup History ────────────────── */}
      <View className="mt-2 mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900 dark:text-white">{t('backup.backupHistory')}</Text>
        <Pressable onPress={loadData} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700">
          <RefreshCw size={14} color={colors.gray} />
        </Pressable>
      </View>

      {backups.length === 0 ? (
        <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center border border-gray-200 dark:border-gray-700">
          <HardDrive size={32} color="#d1d5db" />
          <Text className="text-sm text-gray-400 mt-3">{t('backup.noBackups')}</Text>
          <Text className="text-xs text-gray-400 mt-1">{t('backup.noBackupsDesc')}</Text>
        </View>
      ) : (
        <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {backups.map((b) => (
            <BackupRow key={b.id} backup={b} onDelete={handleDelete} t={t} />
          ))}
        </View>
      )}
    </View>
  );
}
