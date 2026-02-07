import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import {
  fetchReportSummary,
  fetchMachineActivity,
  fetchCompletionStats,
  fetchFailedScans,
  fetchHourlyActivity,
  fetchDailyActivity,
  fetchBarcodeJourney,
  fetchActivityLog,
  type ReportPeriod,
  type ReportSummary,
  type MachineActivityItem,
  type CompletionItem,
  type FailedScanItem,
  type HourlyActivity,
  type DailyActivity,
  type BarcodeJourney,
  type ActivityLogEntry,
} from '../../services/api';

// ─── Sub-tabs within Reports ─────────────────────────────────────────────────
type ReportTab = 'overview' | 'machines' | 'completion' | 'failures' | 'activity' | 'journey';

const REPORT_TABS: { id: ReportTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'machines', label: 'Machines', icon: '🏭' },
  { id: 'completion', label: 'Completion', icon: '✅' },
  { id: 'failures', label: 'Failures', icon: '❌' },
  { id: 'activity', label: 'Activity Log', icon: '📋' },
  { id: 'journey', label: 'Barcode Journey', icon: '🔍' },
];

const PERIOD_OPTIONS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All Time' },
];

// ─── Small reusable components ───────────────────────────────────────────────

function SummaryCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    indigo: 'bg-indigo-50',
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    indigo: 'text-indigo-700',
  };
  const subtitleColors: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    indigo: 'text-indigo-500',
  };

  return (
    <View className={`${bgColors[color] || 'bg-gray-50'} rounded-xl p-4 flex-1 mx-1`}>
      <Text className={`text-xs ${subtitleColors[color] || 'text-gray-500'} mb-1`}>{title}</Text>
      <Text className={`text-xl font-bold ${textColors[color] || 'text-gray-900'}`}>{value}</Text>
      {subtitle && <Text className={`text-xs ${subtitleColors[color] || 'text-gray-400'} mt-1`}>{subtitle}</Text>}
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="bg-gray-50 rounded-xl p-8 items-center">
      <Text className="text-gray-400 text-sm">{message}</Text>
    </View>
  );
}

function BarChart({ data, labelKey, valueKey, maxBars = 24 }: { data: Array<Record<string, unknown>>; labelKey: string; valueKey: string; maxBars?: number }) {
  const sliced = data.slice(0, maxBars);
  if (sliced.length === 0) return <EmptyState message="No data for this period" />;

  const maxVal = Math.max(...sliced.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <View className="bg-white rounded-xl border border-gray-100 p-4">
      <View className="h-40 flex-row items-end justify-around">
        {sliced.map((item, i) => {
          const val = Number(item[valueKey]) || 0;
          const heightPct = Math.max((val / maxVal) * 100, 2);
          return (
            <View key={i} className="items-center flex-1 mx-0.5">
              <Text className="text-xs text-gray-600 mb-1">{val}</Text>
              <View
                className="w-full bg-blue-500 rounded-t-sm"
                style={{ height: `${heightPct}%` as unknown as number }}
              />
              <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
                {String(item[labelKey])}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Tab Content Components ──────────────────────────────────────────────────

function OverviewTab({ period, startDate, endDate }: { period: ReportPeriod; startDate?: string; endDate?: string }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyActivity[]>([]);
  const [daily, setDaily] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h, d] = await Promise.all([
        fetchReportSummary(period, startDate, endDate),
        fetchHourlyActivity(period, startDate, endDate),
        fetchDailyActivity(period, startDate, endDate),
      ]);
      setSummary(s);
      setHourly(h);
      setDaily(d);
    } catch { /* ignore */ }
    setLoading(false);
  }, [period, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator size="large" className="mt-8" />;
  if (!summary) return <EmptyState message="Failed to load summary" />;

  return (
    <View>
      {/* Key Metrics */}
      <SectionHeader title="Key Metrics" subtitle={`Period: ${period}`} />
      <View className="flex-row flex-wrap mb-4 -mx-1">
        <View className="w-1/2 mb-2">
          <SummaryCard title="Barcodes Generated" value={summary.barcodesGenerated} color="blue" />
        </View>
        <View className="w-1/2 mb-2">
          <SummaryCard title="Total Scans" value={summary.totalScans} color="green" />
        </View>
        <View className="w-1/2 mb-2">
          <SummaryCard title="Completed" value={summary.completed} color="purple" />
        </View>
        <View className="w-1/2 mb-2">
          <SummaryCard title="Success Rate" value={`${summary.successRate}%`} subtitle={`${summary.failedAttempts} failures`} color={summary.successRate >= 95 ? 'green' : 'red'} />
        </View>
      </View>

      {/* Failures */}
      {summary.failedAttempts > 0 && (
        <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
          <Text className="text-sm text-red-700">
            ⚠️ {summary.failedAttempts} failed attempt{summary.failedAttempts > 1 ? 's' : ''} this period — check the Failures tab for details
          </Text>
        </View>
      )}

      {/* Hourly Activity */}
      <SectionHeader title="Hourly Activity" subtitle="Scans per hour" />
      <View className="mb-4">
        <BarChart
          data={hourly.map((h) => ({ ...h, label: `${h.hour}:00` }))}
          labelKey="label"
          valueKey="scan_count"
        />
      </View>

      {/* Daily Trend */}
      {daily.length > 1 && (
        <>
          <SectionHeader title="Daily Trend" subtitle="Last days" />
          <View className="mb-4">
            <BarChart
              data={daily.slice(0, 14).reverse().map((d) => ({
                ...d,
                label: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
              }))}
              labelKey="label"
              valueKey="scan_count"
              maxBars={14}
            />
          </View>
        </>
      )}
    </View>
  );
}

function MachinesTab({ period, startDate, endDate }: { period: ReportPeriod; startDate?: string; endDate?: string }) {
  const [machines, setMachines] = useState<MachineActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMachineActivity(period, startDate, endDate)
      .then(setMachines)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, startDate, endDate]);

  if (loading) return <ActivityIndicator size="large" className="mt-8" />;
  if (machines.length === 0) return <EmptyState message="No machines configured yet" />;

  const maxScans = Math.max(...machines.map((m) => m.scan_count), 1);

  return (
    <View>
      <SectionHeader title="Machine Activity Breakdown" subtitle="Performance per machine this period" />
      {machines.map((m) => {
        const pct = Math.round((m.scan_count / maxScans) * 100);
        return (
          <View key={m.machine_id} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-gray-900">
                  {m.can_generate_barcode ? '🔧' : '📱'} {m.machine_name}
                </Text>
                <View className="bg-gray-100 rounded px-2 py-0.5 ml-2">
                  <Text className="text-xs text-gray-500">{m.machine_code}</Text>
                </View>
              </View>
              <Text className="text-lg font-bold text-blue-600">{m.scan_count}</Text>
            </View>

            {/* Progress bar */}
            <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <View className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </View>

            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-400">
                {m.first_scan ? `First: ${new Date(m.first_scan).toLocaleDateString()}` : 'No scans yet'}
              </Text>
              <Text className="text-xs text-gray-400">
                {m.last_scan ? `Last: ${new Date(m.last_scan).toLocaleString()}` : ''}
              </Text>
            </View>

            {m.failed_count > 0 && (
              <View className="mt-2 bg-red-50 rounded-lg px-3 py-1.5">
                <Text className="text-xs text-red-600">❌ {m.failed_count} failed attempt{m.failed_count > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function CompletionTab({ period, startDate, endDate }: { period: ReportPeriod; startDate?: string; endDate?: string }) {
  const [items, setItems] = useState<CompletionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'>('all');

  useEffect(() => {
    setLoading(true);
    fetchCompletionStats(period, startDate, endDate)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, startDate, endDate]);

  if (loading) return <ActivityIndicator size="large" className="mt-8" />;

  const completed = items.filter((i) => i.completion_status === 'COMPLETED').length;
  const inProgress = items.filter((i) => i.completion_status === 'IN_PROGRESS').length;
  const pending = items.filter((i) => i.completion_status === 'PENDING').length;

  const filtered = filter === 'all' ? items : items.filter((i) => i.completion_status === filter);

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    PENDING: 'bg-gray-100 text-gray-600',
  };

  return (
    <View>
      <SectionHeader title="Barcode Completion" subtitle="Track each barcode through all machines" />

      {/* Counts */}
      <View className="flex-row mb-4 -mx-1">
        <SummaryCard title="Completed" value={completed} color="green" />
        <SummaryCard title="In Progress" value={inProgress} color="orange" />
        <SummaryCard title="Pending" value={pending} color="purple" />
      </View>

      {/* Filter tabs */}
      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {([['all', 'All'], ['COMPLETED', '✅ Done'], ['IN_PROGRESS', '🔄 Active'], ['PENDING', '⏳ Waiting']] as const).map(([id, label]) => (
          <Pressable
            key={id}
            className={`flex-1 py-2 rounded-lg items-center ${filter === id ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setFilter(id)}
          >
            <Text className={`text-xs font-medium ${filter === id ? 'text-blue-600' : 'text-gray-500'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState message="No barcodes match this filter" />
      ) : (
        <View className="bg-white rounded-xl border border-gray-100">
          {filtered.slice(0, 50).map((item, i) => (
            <View
              key={item.barcode}
              className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-mono font-medium text-gray-800" numberOfLines={1}>
                  {item.barcode}
                </Text>
                <View className={`rounded-full px-2 py-0.5 ${statusColors[item.completion_status]}`}>
                  <Text className="text-xs font-medium">{item.completion_status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">
                  {item.machines_processed}/{item.total_machines} machines
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item.generated_at).toLocaleString()}
                </Text>
              </View>
              {/* Progress dots */}
              <View className="flex-row mt-2">
                {Array.from({ length: item.total_machines }, (_, idx) => {
                  const processedIds = (item.processed_by_machines || '').split(',').filter(Boolean);
                  const isDone = idx < processedIds.length;
                  return (
                    <View
                      key={idx}
                      className={`h-2 flex-1 mx-0.5 rounded-full ${isDone ? 'bg-green-400' : 'bg-gray-200'}`}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FailuresTab({ period, startDate, endDate }: { period: ReportPeriod; startDate?: string; endDate?: string }) {
  const [failures, setFailures] = useState<FailedScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFailedScans(period, startDate, endDate)
      .then(setFailures)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, startDate, endDate]);

  if (loading) return <ActivityIndicator size="large" className="mt-8" />;
  if (failures.length === 0) return (
    <View className="bg-green-50 rounded-xl p-8 items-center">
      <Text className="text-2xl mb-2">🎉</Text>
      <Text className="text-green-700 font-semibold">No failures this period!</Text>
      <Text className="text-green-600 text-xs mt-1">Everything is running smoothly.</Text>
    </View>
  );

  return (
    <View>
      <SectionHeader title="Failed Scan Attempts" subtitle={`${failures.length} failure${failures.length > 1 ? 's' : ''} this period`} />
      <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
        <Text className="text-xs text-red-700">
          These entries are logged when a machine tries to scan but is rejected — e.g., out-of-sequence scans, duplicate scans, or missing barcodes.
        </Text>
      </View>

      <View className="bg-white rounded-xl border border-gray-100">
        {failures.map((f, i) => (
          <View key={f.log_id} className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Text className="text-sm font-medium text-red-700">❌ {f.action}</Text>
                {f.machine_name && (
                  <View className="bg-gray-100 rounded px-1.5 py-0.5 ml-2">
                    <Text className="text-xs text-gray-600">{f.machine_code || f.machine_name}</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-gray-400">
                {new Date(f.created_at).toLocaleString()}
              </Text>
            </View>
            <Text className="text-sm text-gray-700 mb-1">{f.error_message}</Text>
            {f.barcode && (
              <Text className="text-xs text-gray-400 font-mono">Barcode: {f.barcode}</Text>
            )}
            {f.user_id && (
              <Text className="text-xs text-gray-400">User: {f.user_id}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function ActivityLogTab({ period, startDate, endDate }: { period: ReportPeriod; startDate?: string; endDate?: string }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchActivityLog(page, 30, {
        period,
        startDate,
        endDate,
        status: statusFilter || undefined,
      });
      setLogs(result.logs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, period, startDate, endDate, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <View>
      <SectionHeader title="Activity Log" subtitle={`${total} entries total`} />

      {/* Filter */}
      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
        {[['', 'All'], ['SUCCESS', '✅ Success'], ['FAILED', '❌ Failed']].map(([val, label]) => (
          <Pressable
            key={val}
            className={`flex-1 py-2 rounded-lg items-center ${statusFilter === val ? 'bg-white shadow-sm' : ''}`}
            onPress={() => { setStatusFilter(val); setPage(1); }}
          >
            <Text className={`text-xs font-medium ${statusFilter === val ? 'text-blue-600' : 'text-gray-500'}`}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" className="mt-8" />
      ) : logs.length === 0 ? (
        <EmptyState message="No activity logged yet" />
      ) : (
        <>
          <View className="bg-white rounded-xl border border-gray-100">
            {logs.map((log, i) => (
              <View key={log.log_id} className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <Text className={`text-xs font-bold px-1.5 py-0.5 rounded ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status}
                    </Text>
                    <Text className="text-sm font-medium text-gray-800 ml-2">{log.action}</Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {log.barcode && <Text className="text-xs text-gray-500 mr-3">📦 {log.barcode}</Text>}
                  {log.machine_name && <Text className="text-xs text-gray-500 mr-3">🏭 {log.machine_code || log.machine_name}</Text>}
                  {log.user_id && <Text className="text-xs text-gray-500">👤 {log.user_id}</Text>}
                </View>
                {log.error_message && (
                  <Text className="text-xs text-red-500 mt-1">⚠️ {log.error_message}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Pagination */}
          {totalPages > 1 && (
            <View className="flex-row items-center justify-center mt-4 mb-2">
              <Pressable
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`px-3 py-1.5 rounded-lg mr-2 ${page === 1 ? 'bg-gray-100' : 'bg-blue-50'}`}
              >
                <Text className={`text-sm ${page === 1 ? 'text-gray-400' : 'text-blue-600'}`}>← Prev</Text>
              </Pressable>
              <Text className="text-sm text-gray-500 mx-3">
                Page {page} of {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1.5 rounded-lg ml-2 ${page === totalPages ? 'bg-gray-100' : 'bg-blue-50'}`}
              >
                <Text className={`text-sm ${page === totalPages ? 'text-gray-400' : 'text-blue-600'}`}>Next →</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function JourneyTab() {
  const [searchValue, setSearchValue] = useState('');
  const [journey, setJourney] = useState<BarcodeJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    setError('');
    setJourney(null);
    try {
      const result = await fetchBarcodeJourney(searchValue.trim());
      setJourney(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode not found');
    }
    setLoading(false);
  }, [searchValue]);

  return (
    <View>
      <SectionHeader title="Barcode Journey Tracker" subtitle="See the complete lifecycle of any barcode" />

      {/* Search */}
      <View className="flex-row mb-4">
        <TextInput
          className="flex-1 bg-white border border-gray-200 rounded-l-xl px-4 py-3 text-sm"
          placeholder="Enter barcode value (e.g. BC1234...)"
          value={searchValue}
          onChangeText={setSearchValue}
          onSubmitEditing={search}
          autoCapitalize="characters"
        />
        <Pressable
          onPress={search}
          className="bg-blue-600 px-5 rounded-r-xl items-center justify-center"
        >
          <Text className="text-white font-medium text-sm">🔍 Track</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator size="large" className="mt-8" />}
      {error !== '' && (
        <View className="bg-red-50 rounded-xl p-4 items-center">
          <Text className="text-red-700">❌ {error}</Text>
        </View>
      )}

      {journey && (
        <View>
          {/* Summary */}
          <View className={`rounded-xl p-4 mb-4 ${journey.isComplete ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-gray-900">
                {journey.isComplete ? '✅ COMPLETED' : '🔄 IN PROGRESS'}
              </Text>
              <Text className="text-sm text-gray-500">
                {journey.machinesProcessed}/{journey.totalMachines} machines
              </Text>
            </View>
            <Text className="text-xs text-gray-500 font-mono">{journey.barcode.barcode}</Text>
            <Text className="text-xs text-gray-400 mt-1">
              Generated: {new Date(journey.barcode.generated_at).toLocaleString()}
            </Text>
          </View>

          {/* Timeline */}
          <SectionHeader title="Processing Timeline" />
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            {journey.allMachines.map((machine, idx) => {
              const step = journey.steps.find((s) => s.machine_id === machine.machine_id);
              const isDone = !!step;
              return (
                <View key={machine.machine_id} className="flex-row mb-4 last:mb-0">
                  {/* Timeline dot + line */}
                  <View className="items-center mr-3" style={{ width: 24 }}>
                    <View className={`w-6 h-6 rounded-full items-center justify-center ${isDone ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <Text className="text-xs text-white">{isDone ? '✓' : idx + 1}</Text>
                    </View>
                    {idx < journey.allMachines.length - 1 && (
                      <View className={`w-0.5 flex-1 mt-1 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </View>
                  {/* Content */}
                  <View className="flex-1 pb-3">
                    <Text className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                      {machine.machine_name} ({machine.machine_code})
                    </Text>
                    {step ? (
                      <>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          ✅ Processed at {new Date(step.processed_at).toLocaleString()}
                        </Text>
                        {step.notes && <Text className="text-xs text-gray-400 mt-0.5">{step.notes}</Text>}
                      </>
                    ) : (
                      <Text className="text-xs text-gray-400 mt-0.5">⏳ Waiting...</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Activity log for this barcode */}
          {journey.activityLog.length > 0 && (
            <View className="mt-4">
              <SectionHeader title="Activity History" subtitle="All actions for this barcode" />
              <View className="bg-white rounded-xl border border-gray-100">
                {journey.activityLog.map((log, i) => (
                  <View key={log.log_id} className={`px-4 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status === 'SUCCESS' ? '✅' : '❌'}
                        </Text>
                        <Text className="text-sm text-gray-700">{log.action}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</Text>
                    </View>
                    {log.error_message && <Text className="text-xs text-red-500 mt-0.5">{log.error_message}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main ReportsPage ────────────────────────────────────────────────────────

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [period, setPeriod] = useState<ReportPeriod>('month');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Reports & Analytics</Text>
        <Text className="text-sm text-gray-500 mb-4">
          Deep insights into your barcode tracking operations
        </Text>

        {/* Period Selector */}
        <View className="flex-row bg-white rounded-xl p-1 mb-4 border border-gray-200">
          {PERIOD_OPTIONS.map((p) => (
            <Pressable
              key={p.id}
              className={`flex-1 py-2.5 rounded-lg items-center ${period === p.id ? 'bg-blue-600' : ''}`}
              onPress={() => setPeriod(p.id)}
            >
              <Text className={`text-sm font-medium ${period === p.id ? 'text-white' : 'text-gray-500'}`}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Report Tab Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row">
            {REPORT_TABS.map((tab) => (
              <Pressable
                key={tab.id}
                className={`px-4 py-2.5 rounded-xl mr-2 ${activeTab === tab.id ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`}>
                  {tab.icon} {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab period={period} />}
        {activeTab === 'machines' && <MachinesTab period={period} />}
        {activeTab === 'completion' && <CompletionTab period={period} />}
        {activeTab === 'failures' && <FailuresTab period={period} />}
        {activeTab === 'activity' && <ActivityLogTab period={period} />}
        {activeTab === 'journey' && <JourneyTab />}

        {/* Bottom padding */}
        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
