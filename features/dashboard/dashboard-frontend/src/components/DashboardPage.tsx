import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react-native';
import { fetchDashboard, type DashboardData, type MachineStatus } from '../services/api';
import { StatCard, ProgressBar, Alert, Loading } from '@zipybills/ui-components';
import { queryKeys } from '@zipybills/ui-query';

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View className="mr-2 items-center justify-center" style={{ width: 10, height: 10 }}>
      {/* Outer glow ring */}
      <Animated.View
        style={{ opacity, position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color, transform: [{ scale: 1 }] }}
        className="opacity-30"
      />
      {/* Inner solid dot */}
      <Animated.View
        style={{ opacity, width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
    </View>
  );
}

function MachineBar({ machine }: { machine: MachineStatus }) {
  const pct = machine.today_target > 0
    ? Math.min(100, Math.round((machine.today_produced / machine.today_target) * 100))
    : 0;

  return (
    <View className="bg-white rounded-lg p-3 border border-gray-100 mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-2 ${machine.status === 'ACTIVE' ? 'bg-green-400' : machine.status === 'MAINTENANCE' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          <Text className="text-sm font-semibold text-gray-800">{machine.machine_name}</Text>
          <Text className="text-xs text-gray-400 ml-2">{machine.machine_code}</Text>
        </View>
        <Text className="text-xs font-bold text-gray-600">{machine.today_produced}/{machine.today_target}</Text>
      </View>
      <ProgressBar
        value={pct}
        color={pct >= 90 ? 'green' : pct >= 50 ? 'yellow' : 'red'}
        height="sm"
      />
      <Text className="text-xs text-gray-400 mt-1 text-right">{pct}% of target</Text>
    </View>
  );
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: fetchDashboard,
    refetchInterval: 10_000,
  });

  if (isLoading && !data) {
    return <Loading message="Loading dashboard..." />;
  }

  if (error && !data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Alert variant="error" message={error instanceof Error ? error.message : 'Failed to load dashboard'} />
        <Pressable onPress={() => refetch()} className="bg-emerald-500 px-6 py-3 rounded-lg mt-4">
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
        <PulseDot color={d.rejectionRate > 5 ? '#f87171' : '#4ade80'} />
        {d.rejectionRate > 5
          ? <><AlertTriangle size={14} color="#dc2626" /><Text className="text-sm font-medium text-red-700 ml-1">High rejection rate: {d.rejectionRate}%</Text></>
          : <><CheckCircle size={14} color="#16a34a" /><Text className="text-sm font-medium text-green-700 ml-1">Production running normally</Text></>}
        <Text className="text-xs text-gray-400 ml-auto">Live</Text>
      </View>

      {/* Key Metrics */}
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
          <ProgressBar value={Math.min(d.efficiency, 100)} color="green" height="lg" />
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
                <ProgressBar value={Math.min(shiftPct, 100)} color="emerald" height="sm" />
                {shift.rejected > 0 && (
                  <View className="flex-row items-center mt-0.5">
                    <AlertTriangle size={10} color="#f87171" />
                    <Text className="text-xs text-red-400 ml-1">{shift.rejected} rejected</Text>
                  </View>
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
                <ClipboardList size={12} color="#059669" />
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
