/**
 * Machine detail route – /machines/:id
 *
 * Shows machine info, today's production stats, recent downtime,
 * and quick actions for status management.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Factory, ArrowLeft, Settings, FolderOpen, AlertTriangle,
  CheckCircle, Clock, Wrench,
} from 'lucide-react-native';
import { fetchMachines, updateMachine, type Machine } from '@zipybills/factory-machines-frontend';
import { fetchDowntimeLogs, type DowntimeLog } from '@zipybills/factory-downtime-frontend';
import { fetchPlans, type ProductionPlan } from '@zipybills/factory-planning-frontend';
import { Badge, Alert, StatCard, ProgressBar } from '@zipybills/ui-components';
import { colors, machineStatusColors, useSemanticColors } from '@zipybills/theme-engine';

export default function MachineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sc = useSemanticColors();
  const router = useRouter();
  const machineId = parseInt(id ?? '0', 10);

  const [machine, setMachine] = useState<Machine | null>(null);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [todayPlans, setTodayPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0] ?? '';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [machines, logs, plans] = await Promise.all([
        fetchMachines(),
        fetchDowntimeLogs(),
        fetchPlans({ date: today }),
      ]);
      setMachine(machines.find((m) => m.machine_id === machineId) ?? null);
      setDowntimeLogs(logs.filter((l) => Number(l.machine_id) === machineId).slice(0, 10));
      setTodayPlans(plans.filter((p) => p.machine_id === machineId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [machineId, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (status: string) => {
    try {
      await updateMachine(machineId, { status });
      setSuccess(`Status changed to ${status}`);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const statusVariant = (s: string) =>
    s === 'ACTIVE' ? 'success' as const : s === 'MAINTENANCE' ? 'warning' as const : 'error' as const;

  const totalTarget = todayPlans.reduce((s, p) => s + p.target_quantity, 0);
  const totalProduced = todayPlans.reduce((s, p) => s + (Number(p.actual_quantity) || 0), 0);
  const totalRejected = todayPlans.reduce((s, p) => s + (Number(p.actual_rejected) || 0), 0);
  const efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

  const activeDowntime = downtimeLogs.filter((l) => !l.ended_at);
  const recentResolved = downtimeLogs.filter((l) => l.ended_at).slice(0, 5);
  const totalDowntimeMin = downtimeLogs.reduce((s, l) => s + (l.duration_min || 0), 0);

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-400">Loading machine details...</Text>
      </View>
    );
  }

  if (!machine) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950 p-4">
        <Pressable onPress={() => router.back()} className="flex-row items-center mb-4">
          <ArrowLeft size={18} color={sc.iconDefault} />
          <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">Back to Machines</Text>
        </Pressable>
        <Alert variant="error" message="Machine not found" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950 p-4">
      {/* Back button */}
      <Pressable onPress={() => router.back()} className="flex-row items-center mb-4">
        <ArrowLeft size={18} color={sc.iconDefault} />
        <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">Back to Machines</Text>
      </Pressable>

      {/* Machine Header Card */}
      <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4 shadow-sm">
        <View className="flex-row items-start">
          <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${machine.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20' : machine.status === 'MAINTENANCE' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <Factory size={28} color={machine.status === 'ACTIVE' ? machineStatusColors.ACTIVE.icon : machine.status === 'MAINTENANCE' ? machineStatusColors.MAINTENANCE.icon : machineStatusColors.INACTIVE.icon} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mr-2">{machine.machine_name}</Text>
              <Badge variant={statusVariant(machine.status)}>{machine.status}</Badge>
            </View>
            <Text className="text-sm text-gray-400 font-mono mb-2">{machine.machine_code}</Text>
            <View className="flex-row items-center">
              {machine.department && (
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1 mr-2">
                  <FolderOpen size={11} color={sc.iconDefault} />
                  <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{machine.department}</Text>
                </View>
              )}
              {machine.machine_type && (
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1">
                  <Settings size={11} color={sc.iconDefault} />
                  <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{machine.machine_type}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Status Actions */}
        <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          {['ACTIVE', 'MAINTENANCE', 'INACTIVE'].filter((s) => s !== machine.status).map((s) => (
            <Pressable
              key={s}
              onPress={() => handleStatusChange(s)}
              className={`flex-1 py-2 rounded-lg items-center border ${
                s === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : s === 'MAINTENANCE' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <Text className={`text-xs font-medium ${
                s === 'ACTIVE' ? 'text-green-700' : s === 'MAINTENANCE' ? 'text-yellow-700' : 'text-red-700'
              }`}>Set {s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {success && (<View className="mb-4"><Alert variant="success" message={success} /></View>)}
      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}

      {/* Today's Production Stats */}
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Today's Production</Text>
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1"><StatCard label="Target" value={totalTarget} color="blue" /></View>
        <View className="flex-1"><StatCard label="Produced" value={totalProduced} subtitle={`${efficiency}% eff`} color="green" /></View>
        <View className="flex-1"><StatCard label="Rejected" value={totalRejected} color="red" /></View>
      </View>

      {/* Production Progress */}
      {totalTarget > 0 && (
        <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Production Progress</Text>
            <Text className="text-sm font-bold text-emerald-600">{efficiency}%</Text>
          </View>
          <ProgressBar value={Math.min(efficiency, 100)} color="green" height="lg" />
          <View className="flex-row justify-between mt-2">
            <Text className="text-xs text-gray-400">{totalProduced} produced</Text>
            <Text className="text-xs text-gray-400">{totalTarget} target</Text>
          </View>
        </View>
      )}

      {/* Today's Plans */}
      {todayPlans.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Today's Plans ({todayPlans.length})</Text>
          {todayPlans.map((p) => {
            const pct = p.target_quantity > 0 ? Math.round(((Number(p.actual_quantity) || 0) / p.target_quantity) * 100) : 0;
            return (
              <View key={p.plan_id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-3 mb-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-medium text-gray-800 dark:text-gray-200">{p.product_name}</Text>
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'IN_PROGRESS' ? 'warning' : 'info'}>{p.status.replace('_', ' ')}</Badge>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mr-2">{p.actual_quantity || 0}/{p.target_quantity}</Text>
                  <View className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <View className={`h-full rounded-full ${pct >= 90 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </View>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Downtime Overview */}
      <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Downtime</Text>
      <View className="flex-row gap-2 mb-3">
        <View className={`flex-1 rounded-xl p-3 border ${activeDowntime.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
          <Text className={`text-xs ${activeDowntime.length > 0 ? 'text-red-500' : 'text-green-500'}`}>Active Issues</Text>
          <Text className={`text-xl font-bold ${activeDowntime.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{activeDowntime.length}</Text>
        </View>
        <View className="flex-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
          <Text className="text-xs text-orange-500">Total Downtime</Text>
          <Text className="text-xl font-bold text-orange-700">{formatDuration(totalDowntimeMin)}</Text>
        </View>
      </View>

      {/* Active Downtime Events */}
      {activeDowntime.map((log) => {
        const elapsedMin = Math.round((Date.now() - new Date(log.started_at).getTime()) / 60000);
        return (
          <View key={log.downtime_id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-medium text-red-800">{log.category}</Text>
              <View className="bg-red-100 rounded-md px-2 py-0.5">
                <Text className="text-xs font-bold text-red-700">⏱ {formatDuration(elapsedMin)}</Text>
              </View>
            </View>
            {log.reason && <Text className="text-xs text-gray-600 dark:text-gray-400">{log.reason}</Text>}
            <Text className="text-xs text-gray-400 mt-1">Started: {formatTime(log.started_at)}</Text>
          </View>
        );
      })}

      {/* Recent Resolved Downtime */}
      {recentResolved.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Recent Resolved</Text>
          {recentResolved.map((log) => (
            <View key={log.downtime_id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-2.5 mb-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">{log.category}</Text>
                <Text className="text-xs text-orange-600 font-medium">{formatDuration(log.duration_min || 0)}</Text>
              </View>
              <Text className="text-xs text-gray-400">
                {formatTime(log.started_at)} → {formatTime(log.ended_at!)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {downtimeLogs.length === 0 && (
        <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 items-center mb-4">
          <CheckCircle size={20} color={colors.emerald[500]} />
          <Text className="text-sm text-green-700 mt-1">No downtime recorded</Text>
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
