import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  HardDrive,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  FileText,
  RefreshCw,
  BarChart3,
  AlertTriangle,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface BackupRecord {
  id: number;
  tenant_id: number;
  filename: string;
  status: 'completed' | 'failed' | 'in_progress' | 'pending';
  size_bytes: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  backup_type?: string;
  company_name?: string;
}

interface BackupsResponse {
  backups: BackupRecord[];
  stats: {
    totalBackups: number;
    totalSize: number;
    completedCount?: number;
    failedCount?: number;
  };
}

/* ─── Helpers ──────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} color="#15803d" /> },
  failed: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} color="#b91c1c" /> },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <RefreshCw size={14} color="#1d4ed8" /> },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={14} color="#92400e" /> },
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ─── Stat Card ──────────────────────────── */
function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-5 flex-1 min-w-[180px]">
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">{icon}</View>
      </View>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-500 mt-1">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>}
    </View>
  );
}

/* ─── Main Page ──────────────────────────── */
export default function BackupsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery<BackupsResponse>({
    queryKey: ['platform-backups'],
    queryFn: () => apiFetch('/api/super-admin/backups'),
  });

  const backups = data?.backups ?? [];
  const stats = data?.stats;

  const filteredBackups = statusFilter
    ? backups.filter((b) => b.status === statusFilter)
    : backups;

  const completedCount = backups.filter((b) => b.status === 'completed').length;
  const failedCount = backups.filter((b) => b.status === 'failed').length;

  /* ─── Loading State ─── */
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-sm text-gray-500 mt-3">Loading backups…</Text>
      </View>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <View className="w-14 h-14 rounded-full bg-red-100 items-center justify-center mb-4">
          <AlertTriangle size={28} color="#dc2626" />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-1">Failed to Load Backups</Text>
        <Text className="text-sm text-gray-500 text-center mb-4">
          {(error as Error).message || 'Something went wrong'}
        </Text>
        <Pressable onPress={() => refetch()} className="bg-indigo-600 px-5 py-2.5 rounded-lg">
          <Text className="text-sm font-medium text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Backup Management</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Cross-tenant backup history and monitoring
          </Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          className="flex-row items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-lg"
        >
          <RefreshCw size={16} color="#6b7280" />
          <Text className="text-sm font-medium text-gray-600">Refresh</Text>
        </Pressable>
      </View>

      {/* Stats Row */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        <StatCard
          title="Total Backups"
          value={String(stats?.totalBackups ?? backups.length)}
          icon={<Database size={20} color="#6366f1" />}
        />
        <StatCard
          title="Total Size"
          value={formatBytes(stats?.totalSize ?? 0)}
          icon={<HardDrive size={20} color="#0891b2" />}
        />
        <StatCard
          title="Successful"
          value={String(completedCount)}
          icon={<CheckCircle size={20} color="#16a34a" />}
          subtitle={`${backups.length > 0 ? Math.round((completedCount / backups.length) * 100) : 0}% success rate`}
        />
        <StatCard
          title="Failed"
          value={String(failedCount)}
          icon={<XCircle size={20} color="#dc2626" />}
        />
      </View>

      {/* Filters */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {[
          { key: null, label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Failed' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'pending', label: 'Pending' },
        ].map((f) => (
          <Pressable
            key={f.key ?? 'all'}
            onPress={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-lg border ${
              statusFilter === f.key ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                statusFilter === f.key ? 'text-indigo-700' : 'text-gray-600'
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Backup List */}
      {filteredBackups.length === 0 ? (
        <View className="bg-white rounded-xl border border-gray-200 p-10 items-center">
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
            <HardDrive size={28} color="#9ca3af" />
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-1">No Backups Found</Text>
          <Text className="text-sm text-gray-500 text-center">
            {statusFilter
              ? `No backups with status "${statusFilter}".`
              : 'No backup records yet. Backups are created per-tenant when triggered.'}
          </Text>
        </View>
      ) : (
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <View className="flex-row bg-gray-50 border-b border-gray-200 px-4 py-3">
            <Text className="flex-[2] text-xs font-semibold text-gray-500 uppercase">Filename</Text>
            <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Tenant</Text>
            <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Status</Text>
            <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Size</Text>
            <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Date</Text>
          </View>

          {/* Rows */}
          {filteredBackups.map((backup, idx) => {
            const cfg = STATUS_CONFIG[backup.status] ?? STATUS_CONFIG.pending;
            return (
              <View
                key={backup.id}
                className={`flex-row items-center px-4 py-3.5 ${
                  idx < filteredBackups.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-[2] flex-row items-center gap-2">
                  <FileText size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-900 font-medium" numberOfLines={1}>
                    {backup.filename || `backup_${backup.id}`}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-600" numberOfLines={1}>
                    {backup.company_name ?? `Tenant #${backup.tenant_id}`}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full self-start ${cfg.bg}`}>
                    {cfg.icon}
                    <Text className={`text-xs font-semibold capitalize ${cfg.text}`}>
                      {backup.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-600">{formatBytes(backup.size_bytes)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-gray-600">{formatDate(backup.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Info */}
      <View className="bg-blue-50 rounded-xl p-4 mt-6 flex-row items-start gap-3">
        <BarChart3 size={18} color="#2563eb" />
        <View className="flex-1">
          <Text className="text-sm font-medium text-blue-800 mb-1">Backup Info</Text>
          <Text className="text-xs text-blue-600 leading-5">
            Backups are created per-tenant and stored server-side. Only tenants on the Enterprise plan
            can trigger backups. Use the tenant detail page to export tenant data as CSV for lighter
            data extraction.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
