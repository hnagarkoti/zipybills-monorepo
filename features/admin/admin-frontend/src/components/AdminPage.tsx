/**
 * AdminPage – Phase 2 Admin Panel
 *
 * Tabbed interface for system administration:
 * - System Overview (dashboard stats, DB info)
 * - Audit Logs (searchable, filterable activity trail)
 * - Backups (create/list/delete database backups)
 * - License (view license status)
 * - Export (download reports as CSV/JSON)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Database, FileText, Download, RefreshCw, Trash2,
  Search, Server, Users, HardDrive, Activity, ChevronRight,
  Key, ToggleLeft, ToggleRight, Clock,
} from 'lucide-react-native';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { Loading } from '@zipybills/ui-components';
import { useLocale } from '@zipybills/i18n-engine';
import {
  fetchAdminDashboard,
  fetchAuditLogs,
  fetchAuditStats,
  fetchBackups,
  createBackup,
  deleteBackup,
  fetchLicenseStatus,
  toggleFeatureFlag,
  type SystemDashboard,
  type AuditLog,
  type BackupItem,
} from '../services/api';

// ─── Tab Types ────────────────────────────────

type AdminTab = 'overview' | 'audit' | 'backups' | 'license' | 'export';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'System', icon: <Server size={16} color={colors.blue[500]} /> },
  { id: 'audit', label: 'Audit Logs', icon: <FileText size={16} color={colors.amber[500]} /> },
  { id: 'backups', label: 'Backups', icon: <Database size={16} color={colors.emerald[500]} /> },
  { id: 'license', label: 'License', icon: <Key size={16} color={colors.purple[500]} /> },
  { id: 'export', label: 'Export', icon: <Download size={16} color={colors.blue[400]} /> },
];

// ─── Main Page ────────────────────────────────

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const sem = useSemanticColors();
  const { t } = useLocale();

  const TABS_LABELS: Record<AdminTab, string> = {
    overview: t('admin.system'),
    audit: t('admin.auditLogs'),
    backups: t('admin.backups'),
    license: t('admin.license'),
    export: t('admin.export'),
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-4 pb-0">
        <View className="flex-row items-center mb-3">
          <Shield size={22} color={colors.blue[600]} />
          <Text className="text-xl font-bold text-gray-900 dark:text-white ml-2">
            {t('admin.title')}
          </Text>
        </View>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-row items-center px-4 py-3 mr-1 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
            >
              {tab.icon}
              <Text
                className={`ml-1.5 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {TABS_LABELS[tab.id] ?? tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && <SystemOverviewTab />}
      {activeTab === 'audit' && <AuditLogsTab />}
      {activeTab === 'backups' && <BackupsTab />}
      {activeTab === 'license' && <LicenseTab />}
      {activeTab === 'export' && <ExportTab />}
    </View>
  );
}

// ─── System Overview Tab ──────────────────────

function SystemOverviewTab() {
  const { t } = useLocale();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) return <Loading />;

  const d = data?.dashboard;
  if (!d) return <Text className="p-4 text-gray-500">{t('admin.failedToLoad')}</Text>;

  return (
    <ScrollView
      className="flex-1 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Quick Stats */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        <StatCard icon={<Users size={18} color={colors.blue[500]} />} label={t('admin.usersLabel')} value={String(d.users.total_users)} sub={`${d.users.active_users} ${t('common.active').toLowerCase()}`} />
        <StatCard icon={<Activity size={18} color={colors.amber[500]} />} label={t('admin.events24h')} value={String(d.activity.events_24h)} />
        <StatCard icon={<Server size={18} color={colors.purple[500]} />} label={t('admin.uptime')} value={formatUptime(d.system.uptime)} />
      </View>

      {/* Users Breakdown */}
      <SectionCard title={t('admin.usersLabel')}>
        <InfoRow label={t('roles.ADMIN') + 's'} value={String(d.users.admins)} />
        <InfoRow label={t('roles.SUPERVISOR') + 's'} value={String(d.users.supervisors)} />
        <InfoRow label={t('roles.OPERATOR') + 's'} value={String(d.users.operators)} />
        <InfoRow label={t('common.inactive')} value={String(d.users.inactive_users)} accent />
      </SectionCard>

      {/* Machines */}
      <SectionCard title={t('admin.machines')}>
        <InfoRow label={t('common.total')} value={String(d.machines.total_machines)} />
        <InfoRow label={t('machines.running')} value={String(d.machines.running)} />
        <InfoRow label={t('machines.idle')} value={String(d.machines.idle)} />
        <InfoRow label={t('machines.maintenance')} value={String(d.machines.maintenance)} accent />
      </SectionCard>

      {/* Production (7 day) */}
      <SectionCard title={t('admin.production7d')}>
        <InfoRow label={t('admin.plans')} value={String(d.production.total_plans)} />
        <InfoRow label={t('common.active')} value={String(d.production.active_plans)} />
        <InfoRow label={t('admin.completed')} value={String(d.production.completed_plans)} />
        <InfoRow label={t('admin.totalProduced')} value={String(d.production.total_produced)} />
      </SectionCard>

      {/* Feature Flags */}
      <SectionCard title={t('admin.featureFlags')}>
        {d.featureFlags.length === 0 ? (
          <Text className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.noFeatureFlags')}</Text>
        ) : (
          d.featureFlags.map((flag) => <FeatureFlagRow key={flag.feature_id} flag={flag} />)
        )}
      </SectionCard>

      {/* System Info */}
      <SectionCard title={t('admin.system')}>
        <InfoRow label={t('admin.node')} value={d.system.nodeVersion} />
        <InfoRow label={t('admin.platformLabel')} value={d.system.platform} />
      </SectionCard>

      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Audit Logs Tab ───────────────────────────

function AuditLogsTab() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'audit', page, search],
    queryFn: () => fetchAuditLogs({ page, limit: 30, search: search || undefined }),
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'audit-stats'],
    queryFn: fetchAuditStats,
  });

  const stats = statsQuery.data?.stats;

  return (
    <ScrollView
      className="flex-1 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Stats row */}
      {stats && (
        <View className="flex-row flex-wrap gap-3 mb-4">
          <StatCard icon={<FileText size={18} color={colors.blue[500]} />} label={t('admin.totalLogs')} value={String(stats.totalLogs)} />
          <StatCard icon={<Clock size={18} color={colors.amber[500]} />} label={t('admin.today')} value={String(stats.todayLogs)} />
        </View>
      )}

      {/* Search */}
      <View className="bg-white dark:bg-gray-900 rounded-xl p-3 mb-4 flex-row items-center border border-gray-200 dark:border-gray-700">
        <Search size={16} color={colors.gray[400]} />
        <TextInput
          className="flex-1 ml-2 text-sm text-gray-900 dark:text-white"
          placeholder={t('admin.searchAuditLogs')}
          placeholderTextColor={colors.gray[400]}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
        />
      </View>

      {/* Log entries */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {data?.logs.map((log) => (
            <AuditLogRow key={log.activity_id} log={log} />
          ))}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <View className="flex-row items-center justify-center gap-4 py-4">
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-500 rounded-lg disabled:opacity-40"
              >
                <Text className="text-white text-sm font-medium">{t('admin.previous')}</Text>
              </Pressable>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">
                Page {page} of {data.pagination.totalPages}
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 bg-blue-500 rounded-lg disabled:opacity-40"
              >
                <Text className="text-white text-sm font-medium">{t('common.next')}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Backups Tab ──────────────────────────────

function BackupsTab() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: fetchBackups,
  });

  const createMutation = useMutation({
    mutationFn: () => createBackup(notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] });
      setNotes('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'backups'] }),
  });

  return (
    <ScrollView
      className="flex-1 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Create Backup */}
      <SectionCard title={t('admin.createBackup')}>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-900 dark:text-white mb-3"
          placeholder={t('admin.notesOptional')}
          placeholderTextColor={colors.gray[400]}
          value={notes}
          onChangeText={setNotes}
        />
        <Pressable
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="bg-blue-600 py-3 rounded-lg items-center"
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white font-semibold text-sm">{t('admin.createBackupNow')}</Text>
          )}
        </Pressable>
        {createMutation.isError && (
          <Text className="text-red-500 text-xs mt-2">
            {(createMutation.error as Error).message}
          </Text>
        )}
        {createMutation.isSuccess && (
          <Text className="text-emerald-500 text-xs mt-2">{t('admin.backupSuccess')}</Text>
        )}
      </SectionCard>

      {/* Backup List */}
      <SectionCard title={t('admin.backupHistory')}>
        {isLoading ? (
          <Loading />
        ) : data?.backups.length === 0 ? (
          <Text className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.noBackups')}</Text>
        ) : (
          data?.backups.map((b) => (
            <View
              key={b.id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                  {b.id}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(b.createdAt).toLocaleString()} · {b.sizeHuman}
                  {b.notes ? ` · ${b.notes}` : ''}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View
                  className={`px-2 py-0.5 rounded-full ${
                    b.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : b.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      b.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : b.status === 'failed'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {b.status}
                  </Text>
                </View>
                <Pressable
                  onPress={() => deleteMutation.mutate(b.id)}
                  className="p-2"
                >
                  <Trash2 size={14} color={colors.red[400]} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      <View className="h-8" />
    </ScrollView>
  );
}

// ─── License Tab ──────────────────────────────

function LicenseTab() {
  const { t } = useLocale();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'license'],
    queryFn: fetchLicenseStatus,
  });

  if (isLoading) return <Loading />;

  const license = data?.license;

  return (
    <ScrollView
      className="flex-1 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {!license ? (
        <SectionCard title={t('admin.license')}>
          <View className="items-center py-8">
            <Key size={40} color={colors.gray[300]} />
            <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
              {t('admin.noLicense')}{'\n'}{t('admin.contactAdmin')}
            </Text>
          </View>
        </SectionCard>
      ) : (
        <>
          <SectionCard title={t('admin.licenseInfo')}>
            <InfoRow label={t('admin.status')} value={license.status} accent={license.status !== 'ACTIVE'} />
            <InfoRow label={t('admin.valid')} value={license.valid ? t('common.yes') : t('common.no')} accent={!license.valid} />
            <InfoRow label={t('admin.tier')} value={license.tier} />
            <InfoRow label={t('admin.company')} value={license.company} />
            <InfoRow label={t('admin.machines')} value={`${license.machinesUsed} / ${license.machinesAllowed === -1 ? '∞' : license.machinesAllowed}`} />
            <InfoRow label={t('admin.usersLabel')} value={`${license.usersActive} / ${license.usersAllowed === -1 ? '∞' : license.usersAllowed}`} />
            <InfoRow label={t('admin.daysLeft')} value={license.daysRemaining === -1 ? t('admin.noExpiry') : String(license.daysRemaining)} accent={license.daysRemaining >= 0 && license.daysRemaining <= 30} />
          </SectionCard>
          {license.warnings.length > 0 && (
            <SectionCard title={t('admin.warnings')}>
              {license.warnings.map((w, i) => (
                <Text key={i} className="text-amber-600 dark:text-amber-400 text-sm py-1">{w}</Text>
              ))}
            </SectionCard>
          )}
          {license.features.length > 0 && (
            <SectionCard title={t('admin.licensedFeatures')}>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">{license.features.join(', ')}</Text>
            </SectionCard>
          )}
        </>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Export Tab ────────────────────────────────

function ExportTab() {
  const { t } = useLocale();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const reports = [
    { id: 'production', label: t('admin.productionReport'), icon: <ClipboardIcon /> },
    { id: 'machine-wise', label: t('admin.machineReport'), icon: <HardDrive size={16} color={colors.blue[500]} /> },
    { id: 'shift-wise', label: t('admin.shiftReport'), icon: <Clock size={16} color={colors.amber[500]} /> },
    { id: 'downtime', label: t('admin.downtimeReport'), icon: <Activity size={16} color={colors.red[500]} /> },
    { id: 'efficiency', label: t('admin.efficiencyReport'), icon: <Activity size={16} color={colors.emerald[500]} /> },
    { id: 'summary', label: t('admin.summaryReport'), icon: <FileText size={16} color={colors.purple[500]} /> },
  ];

  return (
    <ScrollView className="flex-1 p-4">
      <SectionCard title={t('admin.dateRange')}>
        <View className="flex-row gap-3 mb-1">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.startDate')}</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-900 dark:text-white"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray[400]}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.endDate')}</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-900 dark:text-white"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray[400]}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('admin.availableReports')}>
        {reports.map((report) => (
          <ExportReportRow
            key={report.id}
            report={report}
            startDate={startDate}
            endDate={endDate}
          />
        ))}
      </SectionCard>

      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Shared Components ────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 min-w-[140px] flex-1">
      <View className="flex-row items-center mb-2">
        {icon}
        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
      {sub && <Text className="text-xs text-gray-400 mt-0.5">{sub}</Text>}
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
      <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
      <Text className="text-sm text-gray-500 dark:text-gray-400">{label}</Text>
      <Text
        className={`text-sm font-medium ${
          accent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function AuditLogRow({ log }: { log: AuditLog }) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-3 mb-2 border border-gray-200 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-1">
        <View className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
          <Text className="text-xs font-mono text-blue-700 dark:text-blue-400">{log.action}</Text>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(log.created_at).toLocaleString()}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          {log.full_name || log.username || 'System'}
        </Text>
        {log.entity_type && (
          <Text className="text-xs text-gray-400 ml-2">
            {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
          </Text>
        )}
      </View>
      {log.details && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>
          {log.details}
        </Text>
      )}
    </View>
  );
}

function FeatureFlagRow({ flag }: { flag: { feature_id: string; name: string; enabled: boolean; description: string } }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => toggleFeatureFlag(flag.feature_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
  });

  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
      <View className="flex-1 mr-3">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">{flag.name}</Text>
        {flag.description && (
          <Text className="text-xs text-gray-500 dark:text-gray-400">{flag.description}</Text>
        )}
      </View>
      <Pressable onPress={() => mutation.mutate()}>
        {flag.enabled ? (
          <ToggleRight size={22} color={colors.emerald[500]} />
        ) : (
          <ToggleLeft size={22} color={colors.gray[400]} />
        )}
      </Pressable>
    </View>
  );
}

function ExportReportRow({
  report,
  startDate,
  endDate,
}: {
  report: { id: string; label: string; icon: React.ReactNode };
  startDate: string;
  endDate: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    if (!startDate || !endDate) return;
    setDownloading(true);
    try {
      // On web, trigger download via link
      // On native, this would need file system handling
      const { apiFetch } = await import('@zipybills/factory-api-client');
      const qs = new URLSearchParams({ start_date: startDate, end_date: endDate, format });
      const url = `/api/export/${report.id}?${qs.toString()}`;
      // For web, open in new tab
      if (typeof window !== 'undefined') {
        const { API_BASE, getAuthToken } = await import('@zipybills/factory-api-client');
        const versionedUrl = url.replace('/api/', '/api/v1/');
        const token = getAuthToken();
        const fullUrl = `${API_BASE}${versionedUrl}${token ? `&token=${token}` : ''}`;
        window.open(fullUrl, '_blank');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const disabled = !startDate || !endDate;

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
      <View className="flex-row items-center flex-1">
        {report.icon}
        <Text className="text-sm text-gray-900 dark:text-white ml-2">{report.label}</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => handleExport('csv')}
          disabled={disabled || downloading}
          className={`px-3 py-1.5 rounded-lg ${disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/30'}`}
        >
          <Text className={`text-xs font-medium ${disabled ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
            CSV
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleExport('json')}
          disabled={disabled || downloading}
          className={`px-3 py-1.5 rounded-lg ${disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}
        >
          <Text className={`text-xs font-medium ${disabled ? 'text-gray-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            JSON
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ClipboardIcon() {
  return <FileText size={16} color={colors.blue[500]} />;
}

// ─── Helpers ──────────────────────────────────

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
