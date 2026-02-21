import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { BarChart3, Factory, Clock, AlertTriangle, FileText, Download } from 'lucide-react-native';
import { fetchProductionReport, fetchMachineWiseReport, fetchShiftWiseReport, fetchRejectionReport } from '../services/api';
import { StatCard, Alert, EmptyState, ProgressBar, PageHeader } from '@zipybills/ui-components';
import { colors, statusColors, useSemanticColors } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';

type ReportTab = 'production' | 'machine' | 'shift' | 'rejection';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportRow = Record<string, any>;


export function ReportsPage() {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const [tab, setTab] = useState<ReportTab>('production');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] ?? ''; })(),
    end: new Date().toISOString().split('T')[0] ?? '',
  });

  const tabs: { key: ReportTab; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { key: 'production', label: t('reports.production'), icon: BarChart3 },
    { key: 'machine', label: t('reports.machine'), icon: Factory },
    { key: 'shift', label: t('reports.shift'), icon: Clock },
    { key: 'rejection', label: t('reports.rejections'), icon: AlertTriangle },
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t('reports.failedToGenerate')); } finally { setLoading(false); }
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
      <PageHeader title={t('reports.reportsAnalytics')} subtitle={t('reports.subtitle')} actions={
        data.length > 0 ? (
          <Pressable onPress={exportCSV} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Download size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1.5">{t('reports.exportCSV')}</Text>
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
              className={`px-3 py-1.5 rounded-full border ${isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
              <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2 mb-4 items-center">
        <View className="flex-1"><Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.from')}</Text><TextInput className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100" value={dateRange.start} onChangeText={(v) => setDateRange({ ...dateRange, start: v })} placeholder="YYYY-MM-DD" /></View>
        <View className="flex-1"><Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.to')}</Text><TextInput className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100" value={dateRange.end} onChangeText={(v) => setDateRange({ ...dateRange, end: v })} placeholder="YYYY-MM-DD" /></View>
        <Pressable onPress={fetchReport} className="bg-emerald-500 px-4 py-2.5 rounded-lg mt-4"><Text className="text-white font-medium text-sm">{t('reports.generate')}</Text></Pressable>
      </View>

      <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          return (<Pressable key={t.key} onPress={() => { setTab(t.key); setData([]); }} className={`flex-1 py-2 rounded-lg items-center ${tab === t.key ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}><TabIcon size={16} color={tab === t.key ? colors.emerald[600] : sc.iconDefault} /><Text className={`text-xs mt-0.5 ${tab === t.key ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{t.label}</Text></Pressable>);
        })}
      </View>

      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}
      {data.length > 0 && (<View className="flex-row gap-2 mb-4"><View className="flex-1"><StatCard label={t('common.produced')} value={totalProduced} color="blue" /></View><View className="flex-1"><StatCard label={t('reports.ok')} value={totalOk} color="green" /></View><View className="flex-1"><StatCard label={t('common.rejected')} value={totalRejected} subtitle={totalProduced > 0 ? `${((totalRejected / totalProduced) * 100).toFixed(1)}%` : ''} color="red" /></View></View>)}

      {loading ? (<Text className="text-center text-gray-400 py-8">{t('reports.generatingReport')}</Text>) : data.length === 0 ? (
        <EmptyState icon={<BarChart3 size={40} color={sc.iconMuted} />} title={t('reports.noDataToDisplay')} description={t('reports.noDataDesc')} />
      ) : (
        <View>
          {tab === 'production' && data.map((row, idx) => (
            <View key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900 dark:text-gray-100">{row.plan_date?.split('T')[0]}</Text><View className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full"><Text className="text-xs text-blue-600 dark:text-blue-400">{row.product_name}</Text></View></View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{row.machine_name as string} · {row.shift_name as string}</Text>
              <View className="flex-row gap-3"><Text className="text-sm text-gray-700 dark:text-gray-300">{t('reports.target')}: <Text className="font-medium">{row.target_quantity}</Text></Text><Text className="text-sm text-green-600 dark:text-green-400">{t('reports.ok')}: <Text className="font-medium">{row.total_ok || 0}</Text></Text><Text className="text-sm text-red-600 dark:text-red-400">{t('reports.rejected')}: <Text className="font-medium">{row.total_rejected || 0}</Text></Text></View>
            </View>
          ))}
          {tab === 'machine' && data.map((row, idx) => {
            const eff = row.target_quantity > 0 ? ((Number(row.total_ok) || 0) / Number(row.target_quantity)) * 100 : 0;
            return (<View key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-2"><Text className="font-semibold text-gray-900 dark:text-gray-100">{row.machine_name}</Text><Text className={`text-sm font-bold ${eff >= 90 ? 'text-green-600' : eff >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{eff.toFixed(1)}% {t('reports.eff')}</Text></View>
              <View className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1"><View className={`h-full rounded-full ${eff >= 90 ? 'bg-green-400' : eff >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${Math.min(eff, 100)}%` }} /></View>
              <View className="flex-row gap-3"><Text className="text-xs text-gray-500 dark:text-gray-400">Target: {row.target_quantity}</Text><Text className="text-xs text-green-600 dark:text-green-400">OK: {row.total_ok || 0}</Text><Text className="text-xs text-red-600 dark:text-red-400">Rejected: {row.total_rejected || 0}</Text><Text className="text-xs text-gray-500 dark:text-gray-400">Plans: {row.plan_count}</Text></View>
            </View>);
          })}
          {tab === 'shift' && data.map((row, idx) => {
            const eff = row.target_quantity > 0 ? ((Number(row.total_ok) || 0) / Number(row.target_quantity)) * 100 : 0;
            return (<View key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-2"><View className="flex-row items-center"><Clock size={14} color={sc.iconDefault} /><Text className="font-semibold text-gray-900 dark:text-gray-100 ml-1">{row.shift_name as string}</Text></View><Text className={`text-sm font-bold ${eff >= 90 ? 'text-green-600' : eff >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{eff.toFixed(1)}%</Text></View>
              <View className="flex-row gap-3"><Text className="text-xs text-gray-500 dark:text-gray-400">Target: {row.target_quantity}</Text><Text className="text-xs text-green-600 dark:text-green-400">OK: {row.total_ok || 0}</Text><Text className="text-xs text-red-600 dark:text-red-400">Rejected: {row.total_rejected || 0}</Text><Text className="text-xs text-gray-500 dark:text-gray-400">Plans: {row.plan_count}</Text></View>
            </View>);
          })}
          {tab === 'rejection' && data.map((row, idx) => (
            <View key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-3 mb-2">
              <View className="flex-row items-center justify-between mb-1"><Text className="font-semibold text-gray-900 dark:text-gray-100">{row.plan_date?.split('T')[0]}</Text><View className="bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full"><Text className="text-xs text-red-600 dark:text-red-400">{row.quantity_rejected} rejected</Text></View></View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{row.product_name as string} · {row.machine_name as string}</Text>
              <Text className="text-sm text-gray-700 dark:text-gray-300">Produced: {row.quantity_produced} · OK: {row.quantity_ok}</Text>
              {row.rejection_reason && (<View className="bg-red-50 rounded-lg px-2 py-1 mt-1 flex-row items-center"><FileText size={10} color={statusColors.error} /><Text className="text-xs text-red-600 ml-1">{row.rejection_reason as string}</Text></View>)}
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
