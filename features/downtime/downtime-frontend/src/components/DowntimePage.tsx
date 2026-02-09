import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import {
  Wrench, Hammer, RefreshCw, Package, Zap, Search, Pin,
  AlertTriangle, CheckCircle, CircleOff, Plus,
} from 'lucide-react-native';
import { fetchDowntimeLogs, createDowntimeLog, endDowntimeLog, type DowntimeLog } from '../services/api';
import { fetchMachines, type Machine } from '@zipybills/factory-machines-frontend';
import { Alert, EmptyState, StatCard, PageHeader } from '@zipybills/ui-components';

const DOWNTIME_CATEGORIES = [
  { value: 'BREAKDOWN', label: 'Breakdown', icon: Wrench, color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: Hammer, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'CHANGEOVER', label: 'Changeover', icon: RefreshCw, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'MATERIAL', label: 'Material', icon: Package, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'POWER', label: 'Power', icon: Zap, color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'QUALITY', label: 'Quality', icon: Search, color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { value: 'OTHER', label: 'Other', icon: Pin, color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

function CategoryBadge({ category }: { category: string }) {
  const cat = DOWNTIME_CATEGORIES.find((c) => c.value === category) ?? DOWNTIME_CATEGORIES[6]!;
  const Icon = cat.icon;
  return (
    <View className={`flex-row items-center px-2 py-0.5 rounded-full border ${cat.color}`}>
      <Icon size={10} color="#6b7280" />
      <Text className="text-xs font-medium ml-1">{cat.label}</Text>
    </View>
  );
}

export function DowntimePage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [logs, setLogs] = useState<DowntimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ machine_id: '', category: '', reason: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [machData, logsData] = await Promise.all([fetchMachines(), fetchDowntimeLogs()]);
      setMachines(machData);
      setLogs(logsData);
      setError(null);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeLogs = logs.filter((l) => !l.ended_at);
  const resolvedLogs = logs.filter((l) => l.ended_at);

  const handleCreate = async () => {
    if (!form.machine_id || !form.category) { setError('Machine and category required'); return; }
    try {
      await createDowntimeLog({ machine_id: parseInt(form.machine_id, 10), category: form.category, reason: form.reason || '', started_at: new Date().toISOString() });
      setForm({ machine_id: '', category: '', reason: '' });
      setShowForm(false);
      setSuccess('Downtime event logged');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create'); }
  };

  const handleEnd = async (id: number) => {
    try { await endDowntimeLog(id); setSuccess('Downtime resolved'); loadData(); setTimeout(() => setSuccess(null), 3000); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to resolve'); }
  };

  const formatDuration = (mins: number | null | undefined) => {
    if (!mins) return '—';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const totalDowntimeToday = resolvedLogs.reduce((s, l) => s + (l.duration_min || 0), 0);

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title="Downtime Tracking"
        subtitle={`${activeLogs.length} active · ${resolvedLogs.length} resolved today`}
        actions={
          <Pressable onPress={() => setShowForm(!showForm)} className="bg-red-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <AlertTriangle size={14} color="#fff" />
            <Text className="text-white font-medium text-sm ml-1">Log Downtime</Text>
          </Pressable>
        }
      />

      <View className="flex-row gap-2 mb-4">
        <View className={`flex-1 rounded-xl p-3 ${activeLogs.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <Text className={`text-xs ${activeLogs.length > 0 ? 'text-red-500' : 'text-green-500'}`}>Active Issues</Text>
          <Text className={`text-2xl font-bold ${activeLogs.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{activeLogs.length}</Text>
        </View>
        <View className="flex-1 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <Text className="text-xs text-orange-500">Total Downtime</Text>
          <Text className="text-2xl font-bold text-orange-700">{formatDuration(totalDowntimeToday)}</Text>
        </View>
        <View className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Text className="text-xs text-blue-500">Events Today</Text>
          <Text className="text-2xl font-bold text-blue-700">{logs.length}</Text>
        </View>
      </View>

      {success && (<View className="mb-4"><Alert variant="success" message={success} /></View>)}
      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}

      {showForm && (
        <View className="bg-white rounded-xl border border-red-200 p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <AlertTriangle size={16} color="#b91c1c" />
            <Text className="text-lg font-semibold text-red-700 ml-2">Report Downtime</Text>
          </View>
          <Text className="text-xs text-gray-500 mb-1">Machine *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {machines.filter((m) => m.status === 'ACTIVE').map((m) => (
              <Pressable key={m.machine_id} onPress={() => setForm({ ...form, machine_id: String(m.machine_id) })} className={`px-3 py-2 rounded-lg border ${form.machine_id === String(m.machine_id) ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                <Text className={`text-sm ${form.machine_id === String(m.machine_id) ? 'text-red-700 font-medium' : 'text-gray-600'}`}>{m.machine_name}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mb-1">Category *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {DOWNTIME_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
              <Pressable key={cat.value} onPress={() => setForm({ ...form, category: cat.value })} className={`flex-row items-center px-3 py-2 rounded-lg border ${form.category === cat.value ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                <CatIcon size={14} color={form.category === cat.value ? '#b91c1c' : '#6b7280'} />
                <Text className={`text-sm ml-1.5 ${form.category === cat.value ? 'text-red-700 font-medium' : 'text-gray-600'}`}>{cat.label}</Text>
              </Pressable>
              );
            })}
          </View>
          <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Reason / Details</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.reason} onChangeText={(t) => setForm({ ...form, reason: t })} placeholder="Describe the issue..." multiline /></View>
          <View className="flex-row gap-2">
            <Pressable onPress={handleCreate} className="bg-red-500 px-6 py-2.5 rounded-lg flex-1 items-center"><Text className="text-white font-medium">Report Downtime</Text></Pressable>
            <Pressable onPress={() => setShowForm(false)} className="bg-gray-200 px-6 py-2.5 rounded-lg"><Text className="text-gray-700 font-medium">Cancel</Text></Pressable>
          </View>
        </View>
      )}

      {activeLogs.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <CircleOff size={14} color="#dc2626" />
            <Text className="text-sm font-semibold text-red-600 ml-1">Active Downtime</Text>
          </View>
          {activeLogs.map((log) => (
            <View key={log.downtime_id} className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-gray-900">{log.machine_name}</Text>
                <CategoryBadge category={log.category} />
              </View>
              <Text className="text-xs text-gray-500 mb-1">Started: {formatTime(log.started_at)}</Text>
              {log.reason && <Text className="text-sm text-gray-700 mb-2">{log.reason}</Text>}
              <Pressable onPress={() => handleEnd(log.downtime_id)} className="bg-green-500 px-4 py-2 rounded-lg items-center mt-1">
                <Text className="text-white font-medium text-sm">Mark Resolved</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {loading ? (<Text className="text-center text-gray-400 py-8">Loading...</Text>) : resolvedLogs.length > 0 ? (
        <View>
          <Text className="text-sm font-semibold text-gray-600 mb-2">Resolved Today</Text>
          {resolvedLogs.map((log) => (
            <View key={log.downtime_id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-medium text-gray-800">{log.machine_name}</Text>
                <CategoryBadge category={log.category} />
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500">{formatTime(log.started_at)} → {formatTime(log.ended_at!)}</Text>
                <Text className="text-xs text-orange-600 ml-2 font-medium">{formatDuration(log.duration_min)}</Text>
              </View>
              {log.reason && <Text className="text-xs text-gray-500 mt-1">{log.reason}</Text>}
            </View>
          ))}
        </View>
      ) : activeLogs.length === 0 ? (
        <EmptyState icon={<CheckCircle size={40} color="#22c55e" />} title="No downtime today" description="All machines running smoothly" />
      ) : null}
      <View className="h-8" />
    </ScrollView>
  );
}
