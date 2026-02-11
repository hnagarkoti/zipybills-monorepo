import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { BarChart3, Factory, Clock, AlertTriangle, FileText, Download } from 'lucide-react-native';
import { fetchProductionReport, fetchMachineWiseReport, fetchShiftWiseReport, fetchRejectionReport } from '../services/api';
import { StatCard, Alert, EmptyState, ProgressBar, PageHeader } from '@zipybills/ui-components';

type ReportTab = 'production' | 'machine' | 'shift' | 'rejection';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportRow = Record<string, any>;


export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('production');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] ?? ''; })(),
    end: new Date().toISOString().split('T')[0] ?? '',
  });

  const tabs: { key: ReportTab; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { key: 'production', label: 'Production', icon: BarChart3 },
    { key: 'machine', label: 'Machine', icon: Factory },
    { key: 'shift', label: 'Shift', icon: Clock },
    { key: 'rejection', label: 'Rejections', icon: AlertTriangle },
  ];

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params = { start_date: dateRange.start, end_date: dateRange.end };
      let result: ReportRow[];
      switch (tab) {
        case 'production': result = await fetchProductionReport(params); break;
        case 'machine': result = await fetchMachineWiseReport(params); break;
        case 'shift': result = await fetchShiftWiseReport(params); break;
        case 'rejection': result = await fetchRejectionReport(params); break;
        default: result = [];
      }
      setData(result);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to generate report'); } finally { setLoading(false); }
  }, [tab, dateRange]);

  const totalProduced = data.reduce((s, r) => s + (Number(r.total_produced) || Number(r.quantity_produced) || 0), 0);
  const totalOk = data.reduce((s, r) => s + (Number(r.total_ok) || Number(r.quantity_ok) || 0), 0);
  const totalRejected = data.reduce((s, r) => s + (Number(r.total_rejected) || Number(r.quantity_rejected) || 0), 0);

  // Auto-fetch when tab or date range changes
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCSV = () => {
    if (data.length === 0 || Platform.OS !== 'web') return;
    const keys = Object.keys(data[0] ?? {});
    const csv = [keys.join(','), ...data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${tab}-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader title="Reports & Analytics" subtitle="View production insights and trends" actions={
        data.length > 0 ? (
          <Pressable onPress={exportCSV} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Download size={14} color="#fff" />
            <Text className="text-white font-medium text-sm ml-1.5">Export CSV</Text>
          </Pressable>
        ) : undefined
      } />

      {/* Quick Date Ranges */}
      <View className="flex-row gap-2 mb-3">
        {[{ label: 'Today', days: 0 }, { label: 'Last 7 Days', days: 7 }, { label: 'Last 30 Days', days: 30 }, { label: 'Last 90 Days', days: 90 }].map((r) => {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - r.days);
          const isActive = dateRange.start === (start.toISOString().split('T')[0] ?? '') && dateRange.end === (end.toISOString().split('T')[0] ?? '');
          return (
            <Pressable key={r.label} onPress={() => { setDateRange({ start: start.toISOString().split('T')[0] ?? '', end: end.toISOString().split('T')[0] ?? '' }); }}
              className={`px-3 py-1.5 rounded-full border ${isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-200'}`}>
              <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2 mb-4 items-center">
        <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">From</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={dateRange.start} onChangeText={(t) => setDateRange({ ...dateRange, start: t })} placeholder="YYYY-MM-DD" /></View>
        <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">To</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={dateRange.end} onChangeText={(t) => setDateRange({ ...dateRange, end: t })} placeholder="YYYY-MM-DD" /></View>
        <Pressable onPress={fetchReport} className="bg-emerald-500 px-4 py-2.5 rounded-lg mt-4"><Text className="text-white font-medium text-sm">Generate</Text></Pressable>
      </View>

      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          return (<Pressable key={t.key} onPress={() => { setTab(t.key); setData([]); }} className={`flex-1 py-2 rounded-lg items-center ${tab === t.key ? 'bg-white shadow-sm' : ''}`}><TabIcon size={16} color={tab === t.key ? '#059669' : '#6b7280'} /><Text className={`text-xs mt-0.5 ${tab === t.key ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>{t.label}</Text></Pressable>);
        })}
      </View>

      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}
      {data.length > 0 && (<View className="flex-row gap-2 mb-4"><View className="flex-1"><StatCard label="Produced" value={totalProduced} color="blue" /></View><View className="flex-1"><StatCard label="OK" value={totalOk} color="green" /></View><View className="flex-1"><StatCard label="Rejected" value={totalRejected} subtitle={totalProduced > 0 ? `${((totalRejected / totalProduced) * 100).toFixed(1)}%` : ''} color="red" /></View></View>)}

      {loading ? (<Text className="text-center text-gray-400 py-8">Generating report...</Text>) : data.length === 0 ? (
        <EmptyState icon={<BarChart3 size={40} color="#9ca3af" />} title="No data to display" description="Set a date range and click Generate" />
      ) : (
        <View>
          {tab === 'production' && data.map((row, idx) => (
            <View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900">{row.plan_date?.split('T')[0]}</Text><View className="bg-blue-50 px-2 py-0.5 rounded-full"><Text className="text-xs text-blue-600">{row.product_name}</Text></View></View>
              <Text className="text-xs text-gray-500 mb-1">{row.machine_name as string} · {row.shift_name as string}</Text>
              <View className="flex-row gap-3"><Text className="text-sm text-gray-700">Target: <Text className="font-medium">{row.target_quantity}</Text></Text><Text className="text-sm text-green-600">OK: <Text className="font-medium">{row.total_ok || 0}</Text></Text><Text className="text-sm text-red-600">Rej: <Text className="font-medium">{row.total_rejected || 0}</Text></Text></View>
            </View>
          ))}
          {tab === 'machine' && data.map((row, idx) => {
            const eff = row.target_quantity > 0 ? ((Number(row.total_ok) || 0) / Number(row.target_quantity)) * 100 : 0;
            return (<View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-2"><Text className="font-semibold text-gray-900">{row.machine_name}</Text><Text className={`text-sm font-bold ${eff >= 90 ? 'text-green-600' : eff >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{eff.toFixed(1)}% eff</Text></View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1"><View className={`h-full rounded-full ${eff >= 90 ? 'bg-green-400' : eff >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${Math.min(eff, 100)}%` }} /></View>
              <View className="flex-row gap-3"><Text className="text-xs text-gray-500">Target: {row.target_quantity}</Text><Text className="text-xs text-green-600">OK: {row.total_ok || 0}</Text><Text className="text-xs text-red-600">Rejected: {row.total_rejected || 0}</Text><Text className="text-xs text-gray-500">Plans: {row.plan_count}</Text></View>
            </View>);
          })}
          {tab === 'shift' && data.map((row, idx) => {
            const eff = row.target_quantity > 0 ? ((Number(row.total_ok) || 0) / Number(row.target_quantity)) * 100 : 0;
            return (<View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-2"><View className="flex-row items-center"><Clock size={14} color="#6b7280" /><Text className="font-semibold text-gray-900 ml-1">{row.shift_name as string}</Text></View><Text className={`text-sm font-bold ${eff >= 90 ? 'text-green-600' : eff >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{eff.toFixed(1)}%</Text></View>
              <View className="flex-row gap-3"><Text className="text-xs text-gray-500">Target: {row.target_quantity}</Text><Text className="text-xs text-green-600">OK: {row.total_ok || 0}</Text><Text className="text-xs text-red-600">Rejected: {row.total_rejected || 0}</Text><Text className="text-xs text-gray-500">Plans: {row.plan_count}</Text></View>
            </View>);
          })}
          {tab === 'rejection' && data.map((row, idx) => (
            <View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900">{row.plan_date?.split('T')[0]}</Text><View className="bg-red-50 px-2 py-0.5 rounded-full"><Text className="text-xs text-red-600">{row.quantity_rejected} rejected</Text></View></View>
              <Text className="text-xs text-gray-500 mb-1">{row.product_name as string} · {row.machine_name as string}</Text>
              <Text className="text-sm text-gray-700">Produced: {row.quantity_produced} · OK: {row.quantity_ok}</Text>
              {row.rejection_reason && (<View className="bg-red-50 rounded-lg px-2 py-1 mt-1 flex-row items-center"><FileText size={10} color="#dc2626" /><Text className="text-xs text-red-600 ml-1">{row.rejection_reason as string}</Text></View>)}
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
