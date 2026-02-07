import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { fetchDashboard, type DashboardData, type MachineStatus } from '../services/api';

function StatCard({ label, value, subtitle, color }: {
  label: string; value: string | number; subtitle?: string; color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50',
    yellow: 'bg-yellow-50', purple: 'bg-purple-50', gray: 'bg-gray-50',
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-700', green: 'text-green-700', red: 'text-red-700',
    yellow: 'text-yellow-700', purple: 'text-purple-700', gray: 'text-gray-700',
  };
  const labelColors: Record<string, string> = {
    blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-500',
    yellow: 'text-yellow-500', purple: 'text-purple-500', gray: 'text-gray-500',
  };

  return (
    <View className={`${bgColors[color] || bgColors.gray} rounded-xl p-4 border border-gray-100`}>
      <Text className={`text-xs font-medium ${labelColors[color] || labelColors.gray} mb-1`}>{label}</Text>
      <Text className={`text-2xl font-bold ${textColors[color] || textColors.gray}`}>{value}</Text>
      {subtitle && <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>}
    </View>
  );
}

function MachineBar({ machine }: { machine: MachineStatus }) {
  const pct = machine.today_target > 0
    ? Math.min(100, Math.round((machine.today_produced / machine.today_target) * 100))
    : 0;
  const barColor = pct >= 90 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  const statusColor = machine.status === 'ACTIVE' ? 'bg-green-400' : machine.status === 'MAINTENANCE' ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <View className="bg-white rounded-lg p-3 border border-gray-100 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-2 ${statusColor}`} />
          <Text className="text-sm font-semibold text-gray-800">{machine.machine_name}</Text>
          <Text className="text-xs text-gray-400 ml-2">{machine.machine_code}</Text>
        </View>
        <Text className="text-xs font-bold text-gray-600">{machine.today_produced}/{machine.today_target}</Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-xs text-gray-400 mt-1 text-right">{pct}% of target</Text>
    </View>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const dashboard = await fetchDashboard();
      setData(dashboard);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    timer.current = setInterval(loadData, 10000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [loadData]);

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-lg text-gray-400">Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-lg text-red-500 mb-4">⚠️ {error}</Text>
        <Pressable onPress={loadData} className="bg-emerald-500 px-6 py-3 rounded-lg">
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const d = data!;

  return (
    <ScrollView className="flex-1 p-4">
      {/* Live Status Banner */}
      <View className={`rounded-xl p-3 mb-4 flex-row items-center ${d.rejectionRate > 5 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        <View className={`w-2.5 h-2.5 rounded-full mr-2 ${d.rejectionRate > 5 ? 'bg-red-400' : 'bg-green-400'}`} />
        <Text className={`text-sm font-medium ${d.rejectionRate > 5 ? 'text-red-700' : 'text-green-700'}`}>
          {d.rejectionRate > 5 ? `⚠️ High rejection rate: ${d.rejectionRate}%` : '✅ Production running normally'}
        </Text>
        <Text className="text-xs text-gray-400 ml-auto">Live</Text>
      </View>

      {/* Key Metrics — using simple 2-col grid for compatibility */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[45%]">
          <StatCard label="Today's Target" value={d.todayTarget} subtitle={`${d.todayPlans} plans`} color="blue" />
        </View>
        <View className="flex-1 min-w-[45%]">
          <StatCard label="Produced" value={d.todayProduced} subtitle={`${d.efficiency}% efficiency`} color="green" />
        </View>
        <View className="flex-1 min-w-[45%]">
          <StatCard label="Rejected" value={d.todayRejected} subtitle={`${d.rejectionRate}% rate`} color="red" />
        </View>
        <View className="flex-1 min-w-[45%]">
          <StatCard label="Downtime" value={`${d.todayDowntimeMin}m`} subtitle={`${d.activeMachines}/${d.totalMachines} active`} color="yellow" />
        </View>
      </View>

      {/* Efficiency Bar */}
      {d.todayTarget > 0 && (
        <View className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900">Production Efficiency</Text>
            <Text className="text-sm font-bold text-emerald-600">{d.efficiency}%</Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <View className="bg-green-400 h-full" style={{ width: `${Math.min(d.efficiency, 100)}%` }} />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-xs text-gray-400">OK: {d.todayOk}</Text>
            <Text className="text-xs text-gray-400">Target: {d.todayTarget}</Text>
          </View>
        </View>
      )}

      {/* Shift Summary */}
      {d.shiftSummary.length > 0 && (
        <View className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
          <Text className="text-sm font-semibold text-gray-900 mb-3">Shift Performance</Text>
          {d.shiftSummary.map((shift, i) => {
            const shiftPct = shift.target > 0 ? Math.round((shift.produced / shift.target) * 100) : 0;
            return (
              <View key={i} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-700 font-medium">{shift.shift_name}</Text>
                  <Text className="text-xs text-gray-500">{shift.produced}/{shift.target} ({shiftPct}%)</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(shiftPct, 100)}%` }} />
                </View>
                {shift.rejected > 0 && (
                  <Text className="text-xs text-red-400 mt-0.5">⚠ {shift.rejected} rejected</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Machine Utilization */}
      {d.machineStatus.length > 0 && (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-gray-900 mb-3">Machine Utilization</Text>
          {d.machineStatus.map((m) => (
            <MachineBar key={m.machine_id} machine={m} />
          ))}
        </View>
      )}

      {/* Recent Activity */}
      {d.recentActivity.length > 0 && (
        <View className="mt-4 bg-white rounded-xl border border-gray-100 p-4 mb-8">
          <Text className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</Text>
          {d.recentActivity.slice(0, 10).map((a) => (
            <View key={a.activity_id} className="flex-row items-start py-2 border-b border-gray-50">
              <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs">📋</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-800">{a.action.replace(/_/g, ' ')}</Text>
                {a.details && <Text className="text-xs text-gray-400 mt-0.5">{a.details}</Text>}
              </View>
              <Text className="text-xs text-gray-300 ml-2">{a.full_name}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
