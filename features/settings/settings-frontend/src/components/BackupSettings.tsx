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
import { View, Text, Pressable, ActivityIndicator, ScrollView, Platform, Linking, Switch } from 'react-native';
import { Download, Cloud, HardDrive, RefreshCw, Trash2, ExternalLink, Check, AlertCircle, Lock, Shield, Package } from 'lucide-react-native';
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
  BACKUP_MODULES,
  type BackupItem,
  type BackupCapabilities,
  type BackupOptions,
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
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</Text>
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
        <Text className="text-sm font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
          {typeLabels[backup.type] || backup.type}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {formatDate(backup.createdAt)} · {backup.sizeHuman} · {totalRecords} {t('common.records')}
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
            className="flex-row items-center gap-1 px-2 py-1.5 rounded-md bg-purple-50 dark:bg-purple-900/30"
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

// ─── Module Selector ──────────────────────────

function ModuleSelector({
  selectedModules,
  onToggleModule,
  onSelectAll,
  encrypted,
  onToggleEncrypt,
  t,
}: {
  selectedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onSelectAll: () => void;
  encrypted: boolean;
  onToggleEncrypt: (val: boolean) => void;
  t: (key: string) => string;
}) {
  const allSelected = BACKUP_MODULES.every((m) => selectedModules.has(m.id));

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-2">
          <Package size={16} color={colors.primary} />
          <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('backup.selectModules') || 'Select Modules'}
          </Text>
        </View>
        <Pressable onPress={onSelectAll}>
          <Text className="text-xs font-medium" style={{ color: colors.primary }}>
            {allSelected
              ? (t('backup.deselectAll') || 'Deselect All')
              : (t('backup.selectAll') || 'Select All')}
          </Text>
        </Pressable>
      </View>

      {/* Module checkboxes */}
      <View className="px-4 py-2">
        {BACKUP_MODULES.map((mod) => {
          const checked = selectedModules.has(mod.id);
          return (
            <Pressable
              key={mod.id}
              onPress={() => onToggleModule(mod.id)}
              className="flex-row items-center py-2.5 border-b border-gray-50 dark:border-gray-700"
            >
              <View
                className="w-5 h-5 rounded border mr-3 items-center justify-center"
                style={{
                  backgroundColor: checked ? colors.primary : 'transparent',
                  borderColor: checked ? colors.primary : '#d1d5db',
                  borderWidth: 1.5,
                }}
              >
                {checked && <Check size={12} color="#fff" />}
              </View>
              <Text className={`text-sm flex-1 ${checked ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {t(mod.labelKey) || mod.id}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Encryption toggle */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-2 flex-1">
          <Shield size={14} color={encrypted ? colors.primary : colors.gray} />
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('backup.encryptData') || 'Encrypt Backup'}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {t('backup.encryptDesc') || 'AES-256 encryption using server secret key'}
            </Text>
          </View>
        </View>
        <Switch
          value={encrypted}
          onValueChange={onToggleEncrypt}
          trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
          thumbColor={encrypted ? colors.primary : '#f4f3f4'}
        />
      </View>

      {/* Selected count */}
      <View className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10">
        <Text className="text-xs text-emerald-700 dark:text-emerald-400">
          {selectedModules.size === 0
            ? (t('backup.noModulesSelected') || 'No modules selected — please select at least one')
            : `${selectedModules.size} ${selectedModules.size === 1 ? 'module' : 'modules'} selected${encrypted ? ' · Encrypted' : ''}`}
        </Text>
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

  // ─── Module selection & encryption state ──
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    () => new Set(BACKUP_MODULES.map((m) => m.id)),
  );
  const [encrypted, setEncrypted] = useState(true);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedModules((prev) => {
      const allSelected = BACKUP_MODULES.every((m) => prev.has(m.id));
      return allSelected ? new Set<string>() : new Set(BACKUP_MODULES.map((m) => m.id));
    });
  };

  /** Build BackupOptions from current selection */
  const getBackupOptions = (): BackupOptions => ({
    modules: Array.from(selectedModules),
    encrypted,
  });

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

  const noModulesSelected = selectedModules.size === 0;

  const handleExport = async () => {
    if (noModulesSelected) { showToast(t('backup.pleaseSelectModule') || 'Please select at least one module', 'error'); return; }
    try {
      setExporting(true);
      const res = await createExport(getBackupOptions());
      if (res.success) {
        showToast(t('backup.exportCreated'));
        // Auto-download on web
        if (Platform.OS === 'web') {
          window.open(getDownloadUrl(res.backup.id), '_blank');
        }
        loadData();
      } else {
        showToast(res.error || t('backup.exportFailed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('backup.exportFailed'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCloudBackup = async () => {
    if (noModulesSelected) { showToast(t('backup.pleaseSelectModule') || 'Please select at least one module', 'error'); return; }
    try {
      setCloudBacking(true);
      const res = await createCloudBackup(getBackupOptions());
      if (res.success) {
        showToast(t('backup.cloudBackupCreated'));
        loadData();
      } else {
        showToast(res.error || t('backup.cloudBackupFailed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('backup.cloudBackupFailed'), 'error');
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
              showToast(t('backup.gdriveConnected'));
              loadData();
              window.removeEventListener('message', handler);
            }
          };
          window.addEventListener('message', handler);
        } else {
          Linking.openURL(res.authUrl);
        }
      } else {
        showToast(res.error || t('backup.gdriveNotConfigured'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('backup.gdriveConnectFailed'), 'error');
    }
  };

  const handleGDriveBackup = async () => {
    if (noModulesSelected) { showToast(t('backup.pleaseSelectModule') || 'Please select at least one module', 'error'); return; }
    try {
      setGdriveBacking(true);
      const res = await createGDriveBackup(getBackupOptions());
      if (res.success) {
        showToast(t('backup.gdriveBackupDone'));
        loadData();
      } else {
        showToast(res.error || t('backup.gdriveBackupFailed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('backup.gdriveBackupFailed'), 'error');
    } finally {
      setGdriveBacking(false);
    }
  };

  const handleGDriveDisconnect = async () => {
    try {
      await disconnectGDrive();
      showToast(t('backup.gdriveDisconnected'));
      loadData();
    } catch (err: any) {
      showToast(t('backup.disconnectFailed'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBackup(id);
      showToast(t('backup.backupDeleted'));
      loadData();
    } catch {
      showToast(t('backup.deleteFailed'), 'error');
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
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('settings.backup')}</Text>
        <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
          <Text className="text-xs font-semibold text-emerald-700">{plan}</Text>
        </View>
      </View>

      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('backup.subtitle')}
      </Text>

      {/* ─── Module Selection ──────────────── */}
      <ModuleSelector
        selectedModules={selectedModules}
        onToggleModule={toggleModule}
        onSelectAll={toggleSelectAll}
        encrypted={encrypted}
        onToggleEncrypt={setEncrypted}
        t={t}
      />

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
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('backup.gdriveBackup')}</Text>
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
                className="flex-row items-center justify-center gap-2 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30"
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
        <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('backup.backupHistory')}</Text>
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
