import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Wifi,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value?: string;
  details?: string;
}

interface SystemHealth {
  status: string;
  uptime?: string;
  database?: { status: string; latency_ms?: number };
  memory?: { used_mb?: number; total_mb?: number; percent?: number };
  cpu?: { percent?: number };
  services?: Array<{ name: string; status: string; latency?: number }>;
}

const STATUS_CONFIG = {
  healthy: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={16} color="#15803d" /> },
  warning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle size={16} color="#92400e" /> },
  critical: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={16} color="#b91c1c" /> },
};

function HealthCard({
  title,
  status,
  value,
  subtitle,
  icon,
}: {
  title: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.healthy;
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-5 flex-1 min-w-[200px]">
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">{icon}</View>
        <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${cfg.bg}`}>
          {cfg.icon}
          <Text className={`text-xs font-semibold capitalize ${cfg.text}`}>{status}</Text>
        </View>
      </View>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-500 mt-1">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>}
    </View>
  );
}

function ProgressBar({ percent, color = '#4f46e5' }: { percent: number; color?: string }) {
  const barColor =
    percent > 90 ? '#dc2626' : percent > 75 ? '#f59e0b' : '#16a34a';

  return (
    <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color || barColor }}
      />
    </View>
  );
}

export default function HealthPage() {
  const healthQuery = useQuery({
    queryKey: ['platform-health'],
    queryFn: () => apiFetch('/api/saas-dashboard/system-health'),
    refetchInterval: 30000, // Refresh every 30s
  });

  const isLoading = healthQuery.isLoading;
  const health: SystemHealth = healthQuery.data ?? {};

  // Derive status
  const overallStatus =
    health.status === 'healthy'
      ? 'healthy'
      : health.status === 'degraded'
        ? 'warning'
        : health.status
          ? 'critical'
          : 'healthy';

  const dbStatus =
    health.database?.status === 'connected' ? 'healthy' : 'critical';
  const dbLatency = health.database?.latency_ms ?? 0;

  const memPercent = health.memory?.percent ?? 0;
  const memStatus: 'healthy' | 'warning' | 'critical' =
    memPercent > 90 ? 'critical' : memPercent > 75 ? 'warning' : 'healthy';

  const cpuPercent = health.cpu?.percent ?? 0;
  const cpuStatus: 'healthy' | 'warning' | 'critical' =
    cpuPercent > 90 ? 'critical' : cpuPercent > 75 ? 'warning' : 'healthy';

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-3">Checking system health...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">System Health</Text>
            <Text className="text-sm text-gray-500">Real-time infrastructure monitoring</Text>
          </View>
          <View
            className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full ${
              STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG]?.bg ?? 'bg-gray-100'
            }`}
          >
            {STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG]?.icon}
            <Text
              className={`text-sm font-semibold capitalize ${
                STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG]?.text ?? 'text-gray-600'
              }`}
            >
              {overallStatus}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        {/* Key Metrics */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <HealthCard
            title="Database"
            status={dbStatus}
            value={`${dbLatency}ms`}
            subtitle="Query latency"
            icon={<Database size={20} color="#4f46e5" />}
          />
          <HealthCard
            title="Memory Usage"
            status={memStatus}
            value={`${memPercent.toFixed(0)}%`}
            subtitle={
              health.memory
                ? `${health.memory.used_mb?.toFixed(0) ?? 0}MB / ${health.memory.total_mb?.toFixed(0) ?? 0}MB`
                : undefined
            }
            icon={<HardDrive size={20} color="#8b5cf6" />}
          />
          <HealthCard
            title="CPU Usage"
            status={cpuStatus}
            value={`${cpuPercent.toFixed(0)}%`}
            icon={<Cpu size={20} color="#f59e0b" />}
          />
          <HealthCard
            title="Uptime"
            status="healthy"
            value={health.uptime ?? 'N/A'}
            icon={<Clock size={20} color="#16a34a" />}
          />
        </View>

        {/* Resource Gauges */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-4">Resource Utilization</Text>

          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <HardDrive size={14} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-700">Memory</Text>
              </View>
              <Text className="text-sm text-gray-500">{memPercent.toFixed(1)}%</Text>
            </View>
            <ProgressBar
              percent={memPercent}
              color={memPercent > 90 ? '#dc2626' : memPercent > 75 ? '#f59e0b' : '#16a34a'}
            />
          </View>

          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Cpu size={14} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-700">CPU</Text>
              </View>
              <Text className="text-sm text-gray-500">{cpuPercent.toFixed(1)}%</Text>
            </View>
            <ProgressBar
              percent={cpuPercent}
              color={cpuPercent > 90 ? '#dc2626' : cpuPercent > 75 ? '#f59e0b' : '#16a34a'}
            />
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Database size={14} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-700">Database Latency</Text>
              </View>
              <Text className="text-sm text-gray-500">{dbLatency}ms</Text>
            </View>
            <ProgressBar
              percent={Math.min(100, (dbLatency / 200) * 100)}
              color={dbLatency > 150 ? '#dc2626' : dbLatency > 80 ? '#f59e0b' : '#16a34a'}
            />
          </View>
        </View>

        {/* Services */}
        {health.services && health.services.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Server size={18} color="#4f46e5" />
              <Text className="text-base font-semibold text-gray-900">Services</Text>
            </View>

            {health.services.map((svc, i) => {
              const svcStatus =
                svc.status === 'running' || svc.status === 'healthy'
                  ? 'healthy'
                  : svc.status === 'degraded'
                    ? 'warning'
                    : 'critical';
              const cfg = STATUS_CONFIG[svcStatus];

              return (
                <View
                  key={i}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
                    <Text className="text-sm font-medium text-gray-700">{svc.name}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    {svc.latency !== undefined && (
                      <Text className="text-xs text-gray-400">{svc.latency}ms</Text>
                    )}
                    <View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
                      <Text className={`text-xs font-medium capitalize ${cfg.text}`}>
                        {svc.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Auto-refresh indicator */}
        <View className="flex-row items-center justify-center gap-2 py-4 mb-8">
          <Activity size={14} color="#9ca3af" />
          <Text className="text-xs text-gray-400">Auto-refreshing every 30 seconds</Text>
        </View>
      </View>
    </ScrollView>
  );
}
