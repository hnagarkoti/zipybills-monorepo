import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { fetchProductionReport, fetchMachineWiseReport, fetchShiftWiseReport, fetchRejectionReport } from '../services/api';

type ReportTab = 'production' | 'machine' | 'shift' | 'rejection';
interface ReportRow { [key: string]: any; }

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (<View className={`flex-1 ${color} rounded-xl p-3`}><Text className="text-xs text-gray-500">{label}</Text><Text className="text-lg font-bold text-gray-900">{value}</Text>{sub && <Text className="text-xs text-gray-400">{sub}</Text>}</View>);
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('production');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] ?? ''; })(),
    end: new Date().toISOString().split('T')[0] ?? '',
  });

  const tabs: { key: ReportTab; label: string; emoji: string }[] = [
    { key: 'production', label: 'Production', emoji: '📊' },
    { key: 'machine', label: 'Machine', emoji: '🏭' },
    { key: 'shift', label: 'Shift', emoji: '⏰' },
    { key: 'rejection', label: 'Rejections', emoji: '⚠️' },
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
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [tab, dateRange]);

  const totalProduced = data.reduce((s, r) => s + (Number(r.total_produced) || Number(r.quantity_produced) || 0), 0);
  const totalOk = data.reduce((s, r) => s + (Number(r.total_ok) || Number(r.quantity_ok) || 0), 0);
  const totalRejected = data.reduce((s, r) => s + (Number(r.total_rejected) || Number(r.quantity_rejected) || 0), 0);

  return (
    <ScrollView className="flex-1 p-4">
      <View className="mb-4"><Text className="text-xl font-bold text-gray-900">Reports & Analytics</Text><Text className="text-sm text-gray-500">View production insights and trends</Text></View>

      <View className="flex-row gap-2 mb-4 items-center">
        <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">From</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={dateRange.start} onChangeText={(t) => setDateRange({ ...dateRange, start: t })} placeholder="YYYY-MM-DD" /></View>
        <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">To</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={dateRange.end} onChangeText={(t) => setDateRange({ ...dateRange, end: t })} placeholder="YYYY-MM-DD" /></View>
        <Pressable onPress={fetchReport} className="bg-emerald-500 px-4 py-2.5 rounded-lg mt-4"><Text className="text-white font-medium text-sm">Generate</Text></Pressable>
      </View>

      <View className="flex-row gap-2 mb-4">
        {[{ label: 'Today', days: 0 }, { label: '7 Days', days: 7 }, { label: '30 Days', days: 30 }].map((r) => (
          <Pressable key={r.label} onPress={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - r.days); setDateRange({ start: start.toISOString().split('T')[0] ?? '', end: end.toISOString().split('T')[0] ?? '' }); }} className="bg-gray-100 px-3 py-1.5 rounded-lg"><Text className="text-xs text-gray-600">{r.label}</Text></Pressable>
        ))}
      </View>

      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map((t) => (<Pressable key={t.key} onPress={() => { setTab(t.key); setData([]); }} className={`flex-1 py-2 rounded-lg items-center ${tab === t.key ? 'bg-white shadow-sm' : ''}`}><Text className="text-sm">{t.emoji}</Text><Text className={`text-xs ${tab === t.key ? 'text-emerald-600 font-medium' : 'text-gray-500'}`}>{t.label}</Text></Pressable>))}
      </View>

      {error && (<View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-sm text-red-700">{error}</Text></View>)}
      {data.length > 0 && (<View className="flex-row gap-2 mb-4"><StatBox label="Produced" value={String(totalProduced)} color="bg-blue-50" /><StatBox label="OK" value={String(totalOk)} color="bg-green-50" /><StatBox label="Rejected" value={String(totalRejected)} sub={totalProduced > 0 ? `${((totalRejected / totalProduced) * 100).toFixed(1)}%` : ''} color="bg-red-50" /></View>)}

      {loading ? (<Text className="text-center text-gray-400 py-8">Generating report...</Text>) : data.length === 0 ? (
        <View className="items-center py-12"><Text className="text-4xl mb-3">📊</Text><Text className="text-lg text-gray-500">No data to display</Text><Text className="text-sm text-gray-400 mt-1">Set a date range and click Generate</Text></View>
      ) : (
        <View>
          {tab === 'production' && data.map((row, idx) => (
            <View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900">{row.plan_date?.split('T')[0]}</Text><View className="bg-blue-50 px-2 py-0.5 rounded-full"><Text className="text-xs text-blue-600">{row.product_name}</Text></View></View>
              <Text className="text-xs text-gray-500 mb-1">🏭 {row.machine_name} · ⏰ {row.shift_name}</Text>
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
              <View className="flex-row items-center justify-between mb-2"><View className="flex-row items-center"><Text className="text-base mr-2">⏰</Text><Text className="font-semibold text-gray-900">{row.shift_name}</Text></View><Text className={`text-sm font-bold ${eff >= 90 ? 'text-green-600' : eff >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{eff.toFixed(1)}%</Text></View>
              <View className="flex-row gap-3"><Text className="text-xs text-gray-500">Target: {row.target_quantity}</Text><Text className="text-xs text-green-600">OK: {row.total_ok || 0}</Text><Text className="text-xs text-red-600">Rejected: {row.total_rejected || 0}</Text><Text className="text-xs text-gray-500">Plans: {row.plan_count}</Text></View>
            </View>);
          })}
          {tab === 'rejection' && data.map((row, idx) => (
            <View key={idx} className="bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900">{row.plan_date?.split('T')[0]}</Text><View className="bg-red-50 px-2 py-0.5 rounded-full"><Text className="text-xs text-red-600">{row.quantity_rejected} rejected</Text></View></View>
              <Text className="text-xs text-gray-500 mb-1">{row.product_name} · 🏭 {row.machine_name}</Text>
              <Text className="text-sm text-gray-700">Produced: {row.quantity_produced} · OK: {row.quantity_ok}</Text>
              {row.rejection_reason && (<View className="bg-red-50 rounded-lg px-2 py-1 mt-1"><Text className="text-xs text-red-600">📝 {row.rejection_reason}</Text></View>)}
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
