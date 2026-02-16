import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Animated, useWindowDimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle, ClipboardList,
  Target, Package, XCircle, Clock, Activity, Factory, Timer,
  Radio, BarChart3, TrendingUp, TrendingDown, Minus, Calendar,
  ArrowUpRight, ArrowDownRight, AlertOctagon,
} from 'lucide-react-native';
import { fetchDashboard, type DashboardData, type MachineStatus, type PeriodStats, type TopRejectionReason, type ShiftHistoryDay } from '../services/api';
import { Alert, Loading } from '@zipybills/ui-components';
import { queryKeys } from '@zipybills/ui-query';
import { colors, useSemanticColors } from '@zipybills/theme-engine';

/* ─── Helpers ──────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return n.toLocaleString();
  return String(n);
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Animated Components ──────────────────── */

function PulseDot({ color, size = 10 }: { color: string; size?: number }) {
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

  const inner = Math.round(size * 0.6);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Animated.View
        style={{ opacity, position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
        className="opacity-30"
      />
      <Animated.View
        style={{ opacity, width: inner, height: inner, borderRadius: inner / 2, backgroundColor: color }}
      />
    </View>
  );
}

/* ─── Efficiency Ring (SVG-free circular gauge) */

function EfficiencyRing({ value, size = 100 }: { value: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const ringColor = clamped >= 80 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444';
  const bgColor = clamped >= 80 ? '#d1fae5' : clamped >= 50 ? '#fef3c7' : '#fee2e2';
  const strokeWidth = Math.max(6, size * 0.07);
  // Format: show decimals only when needed, keep text short to fit inside ring
  const displayValue = clamped % 1 === 0 ? `${clamped}` : clamped.toFixed(1);
  // Scale font based on text length to prevent overflow
  const fontScale = displayValue.length > 3 ? 0.2 : 0.26;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: bgColor,
          position: 'absolute',
        }}
      />
      {/* Colored arc approximation — filled progress ring using conic-like border trick */}
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: ringColor,
          borderTopColor: clamped >= 25 ? ringColor : bgColor,
          borderRightColor: clamped >= 50 ? ringColor : bgColor,
          borderBottomColor: clamped >= 75 ? ringColor : bgColor,
          borderLeftColor: clamped >= 100 ? ringColor : bgColor,
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      {/* Center content — absolutely positioned + contained to prevent overflow */}
      <View
        style={{
          position: 'absolute',
          width: size - strokeWidth * 2 - 8,
          height: size - strokeWidth * 2 - 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ fontSize: size * fontScale, fontWeight: '800', color: ringColor }}
        >
          {displayValue}%
        </Text>
        <Text style={{ fontSize: size * 0.1, color: '#9ca3af', fontWeight: '500', marginTop: -2 }}>efficiency</Text>
      </View>
    </View>
  );
}

/* ─── Mini KPI Card ────────────────────────── */

interface MiniKpiProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
  bgClass: string;
}

function MiniKpi({ icon, label, value, subtitle, accentColor, bgClass }: MiniKpiProps) {
  return (
    <View className={`${bgClass} rounded-2xl p-4 flex-1 min-w-[47%] border border-gray-100 dark:border-gray-800`}>
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
          {icon}
        </View>
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</Text>
      </View>
      <Text className="text-2xl font-extrabold text-gray-900 dark:text-gray-50" style={{ letterSpacing: -0.5 }}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </Text>
      {subtitle && (
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>
  );
}

/* ─── Trend Card (replaces duplicate Quick Stats) ── */

interface TrendCardProps {
  title: string;
  icon: React.ReactNode;
  period: PeriodStats;
  accentColor: string;
  periodLabel: string;
}

function TrendCard({ title, icon, period, accentColor, periodLabel }: TrendCardProps) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex-1 min-w-[47%] border border-gray-100 dark:border-gray-800">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: accentColor + '18' }}>
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</Text>
          <Text className="text-[10px] text-gray-400">{periodLabel}</Text>
        </View>
      </View>

      {/* Produced / Target */}
      <View className="flex-row items-baseline gap-1 mb-1.5">
        <Text className="text-xl font-extrabold text-gray-900 dark:text-gray-50" style={{ letterSpacing: -0.5 }}>
          {formatNumber(period.produced)}
        </Text>
        <Text className="text-xs text-gray-400">/ {formatNumber(period.target)}</Text>
      </View>

      {/* Efficiency bar */}
      <View className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, period.efficiency)}%`,
            backgroundColor: period.efficiency >= 80 ? '#10b981' : period.efficiency >= 50 ? '#f59e0b' : '#ef4444',
          }}
        />
      </View>

      {/* Bottom stats row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs font-bold" style={{ color: period.efficiency >= 80 ? '#10b981' : period.efficiency >= 50 ? '#f59e0b' : '#ef4444' }}>
            {period.efficiency}%
          </Text>
          <Text className="text-[10px] text-gray-400">efficiency</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-[10px] text-gray-400">{period.plans} plans</Text>
        </View>
      </View>

      {/* Rejected & Downtime mini-stats */}
      <View className="flex-row items-center gap-3 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
        <View className="flex-row items-center gap-1">
          <XCircle size={10} color="#ef4444" />
          <Text className="text-[10px] text-gray-500">{formatNumber(period.rejected)} rejected</Text>
          {period.rejection_rate > 0 && (
            <Text className="text-[10px] text-red-400">({period.rejection_rate}%)</Text>
          )}
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={10} color="#f59e0b" />
          <Text className="text-[10px] text-gray-500">{period.downtime_min}m downtime</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Day-over-Day Comparison Row ──────────── */

function ComparisonStat({ label, today, yesterday, icon, accentColor }: {
  label: string; today: number; yesterday: number; icon: React.ReactNode; accentColor: string;
}) {
  const diff = yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : (today > 0 ? 100 : 0);
  const isUp = diff > 0;
  const isNeutral = diff === 0;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: accentColor + '15' }}>
          {icon}
        </View>
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</Text>
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-xl font-extrabold text-gray-900 dark:text-gray-50">
          {formatNumber(today)}
        </Text>
        {!isNeutral && (
          <View className={`flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            {isUp ? <ArrowUpRight size={10} color="#10b981" /> : <ArrowDownRight size={10} color="#ef4444" />}
            <Text className={`text-[10px] font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {Math.abs(diff)}%
            </Text>
          </View>
        )}
        {isNeutral && (
          <View className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800">
            <Minus size={10} color="#9ca3af" />
            <Text className="text-[10px] font-bold text-gray-400">0%</Text>
          </View>
        )}
      </View>
      <Text className="text-[10px] text-gray-400 mt-1">vs yesterday: {formatNumber(yesterday)}</Text>
    </View>
  );
}

/* ─── Machine Card (Grid) ──────────────────── */

function MachineCard({ machine }: { machine: MachineStatus }) {
  const pct = machine.today_target > 0
    ? Math.min(100, Math.round((machine.today_produced / machine.today_target) * 100))
    : 0;
  const isActive = machine.status === 'ACTIVE';
  const isMaintenance = machine.status === 'MAINTENANCE';

  const statusColor = isActive ? '#10b981' : isMaintenance ? '#f59e0b' : '#ef4444';
  const statusLabel = isActive ? 'Running' : isMaintenance ? 'Maintenance' : 'Offline';
  const barColor = pct >= 90 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex-1 min-w-[47%]">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 items-center justify-center">
            <Factory size={16} color="#6b7280" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-800 dark:text-gray-200" numberOfLines={1}>
              {machine.machine_name}
            </Text>
            <Text className="text-[10px] text-gray-400 font-medium">{machine.machine_code}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: statusColor + '15' }}>
          <PulseDot color={statusColor} size={6} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      {/* Progress */}
      <View className="mb-2">
        <View className="flex-row items-end justify-between mb-1.5">
          <Text className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{pct}%</Text>
          <Text className="text-xs text-gray-400 font-medium">
            {formatNumber(machine.today_produced)}/{formatNumber(machine.today_target)}
          </Text>
        </View>
        <View className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </View>
      </View>
    </View>
  );
}

/* ─── Shift Row (Today's summary) ──────────── */

function ShiftRow({ shift, maxTarget }: { shift: { shift_name: string; produced: number; target: number; rejected: number }; maxTarget: number }) {
  const pct = shift.target > 0 ? Math.round((shift.produced / shift.target) * 100) : 0;
  const barWidth = maxTarget > 0 ? Math.round((shift.target / maxTarget) * 100) : 0;
  const filledWidth = shift.target > 0 ? Math.round((shift.produced / shift.target) * barWidth) : 0;
  const shiftIcon = shift.shift_name.toLowerCase().includes('morning') ? '🌅' :
    shift.shift_name.toLowerCase().includes('afternoon') ? '☀️' :
    shift.shift_name.toLowerCase().includes('night') ? '🌙' : '⏱️';
  const pctColor = pct >= 90 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <View className="flex-row items-center py-3 border-b border-gray-50 dark:border-gray-800/50">
      <View className="w-[100px] flex-row items-center gap-2">
        <Text style={{ fontSize: 16 }}>{shiftIcon}</Text>
        <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{shift.shift_name}</Text>
      </View>
      <View className="flex-1 mx-3">
        <View className="h-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden flex-row items-center">
          <View
            className="h-full rounded-lg items-center justify-center"
            style={{ width: `${Math.max(filledWidth, 2)}%`, backgroundColor: pctColor + '30' }}
          >
            {pct > 20 && (
              <Text style={{ fontSize: 10, fontWeight: '700', color: pctColor }}>{formatNumber(shift.produced)}</Text>
            )}
          </View>
        </View>
      </View>
      <View className="items-end w-[60px]">
        <Text style={{ fontSize: 14, fontWeight: '800', color: pctColor }}>{pct}%</Text>
        {shift.rejected > 0 && (
          <Text className="text-[10px] text-red-400">{shift.rejected} rej</Text>
        )}
      </View>
    </View>
  );
}

/* ─── Shift History Bar Chart (Interactive) ── */

const SHIFT_PALETTE: Record<string, { bg: string; fill: string; label: string }> = {
  morning:   { bg: '#d1fae5', fill: '#10b981', label: 'Morning' },
  afternoon: { bg: '#dbeafe', fill: '#3b82f6', label: 'Afternoon' },
  night:     { bg: '#fef3c7', fill: '#f59e0b', label: 'Night' },
  default:   { bg: '#e5e7eb', fill: '#6b7280', label: 'Shift' },
};

function getShiftStyle(name: string) {
  const key = Object.keys(SHIFT_PALETTE).find((k) => k !== 'default' && name.toLowerCase().includes(k));
  return SHIFT_PALETTE[key ?? 'default']!;
}

/** Tooltip popup shown above a pressed bar */
function BarTooltip({ shifts, dayTotal, dayTarget, dayEff }: {
  shifts: ShiftHistoryDay[];
  dayTotal: number;
  dayTarget: number;
  dayEff: number;
}) {
  return (
    <View className="bg-gray-900 dark:bg-gray-100 rounded-xl p-3 min-w-[180px]" style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-bold text-white dark:text-gray-900">
          {formatNumber(dayTotal)} / {formatNumber(dayTarget)}
        </Text>
        <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: dayEff >= 80 ? '#10b981' : dayEff >= 50 ? '#f59e0b' : '#ef4444' }}>
          <Text className="text-[10px] font-bold text-white">{dayEff}%</Text>
        </View>
      </View>
      {shifts.map((sh) => {
        const style = getShiftStyle(sh.shift_name);
        const eff = sh.target > 0 ? Math.round((sh.produced / sh.target) * 100) : 0;
        return (
          <View key={sh.shift_name} className="flex-row items-center justify-between py-1">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.fill }} />
              <Text className="text-[11px] text-gray-300 dark:text-gray-600">{sh.shift_name}</Text>
            </View>
            <Text className="text-[11px] font-semibold text-gray-200 dark:text-gray-700">
              {formatNumber(sh.produced)}{sh.target > 0 ? ` / ${formatNumber(sh.target)}` : ''} <Text style={{ color: eff >= 80 ? '#6ee7b7' : eff >= 50 ? '#fcd34d' : '#fca5a5' }}>({eff}%)</Text>
            </Text>
          </View>
        );
      })}
      {shifts.some((s) => s.rejected > 0) && (
        <View className="flex-row items-center mt-1.5 pt-1.5 border-t border-gray-700 dark:border-gray-300">
          <Text className="text-[10px] text-red-400">
            {formatNumber(shifts.reduce((s, sh) => s + sh.rejected, 0))} rejected
          </Text>
        </View>
      )}
    </View>
  );
}

function ShiftHistoryChart({ history, isDesktop }: { history: ShiftHistoryDay[]; isDesktop: boolean }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group by date
  const byDate = useMemo(() => {
    const map = new Map<string, ShiftHistoryDay[]>();
    for (const entry of history) {
      const dateStr = typeof entry.date === 'string' && entry.date.includes('T')
        ? entry.date.split('T')[0]!
        : String(entry.date);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(entry);
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    return sorted;
  }, [history]);

  // Unique shift names for legend
  const shiftNames = useMemo(() => {
    const names = new Set<string>();
    history.forEach((h) => names.add(h.shift_name));
    return [...names];
  }, [history]);

  // Find max produced + target for Y-axis scaling
  const { maxValue, yTicks } = useMemo(() => {
    let max = 0;
    for (const [, shifts] of byDate) {
      const dayTotal = shifts.reduce((s, sh) => s + sh.produced, 0);
      const dayTarget = shifts.reduce((s, sh) => s + sh.target, 0);
      if (dayTotal > max) max = dayTotal;
      if (dayTarget > max) max = dayTarget;
    }
    if (max === 0) max = 100; // default scale when no data
    // Round up to nice number and create tick marks
    const step = max <= 10 ? 2 : max <= 50 ? 10 : max <= 200 ? 50 : max <= 1000 ? 200 : Math.ceil(max / 5 / 100) * 100;
    const roundedMax = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let i = 0; i <= roundedMax; i += step) ticks.push(i);
    return { maxValue: roundedMax || 1, yTicks: ticks };
  }, [byDate]);

  const hasData = byDate.some(([, shifts]) => shifts.some((s) => s.produced > 0 || s.target > 0));

  const handleBarPress = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const barGroupWidth = isDesktop ? 90 : 64;
  const chartHeight = isDesktop ? 180 : 140;
  const yAxisWidth = 36;

  // ─── Empty State ─────────────────────────────
  if (byDate.length === 0 || !hasData) {
    return (
      <View className="items-center justify-center py-8">
        <View className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 items-center justify-center mb-3">
          <BarChart3 size={24} color="#9ca3af" />
        </View>
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">No shift data yet</Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500 text-center px-8">
          Production data will appear here once shifts start recording output
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Legend */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mb-4 px-1">
        {shiftNames.map((name) => {
          const style = getShiftStyle(name);
          return (
            <View key={name} className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded" style={{ backgroundColor: style.fill }} />
              <Text className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{name}</Text>
            </View>
          );
        })}
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-0.5 rounded" style={{ backgroundColor: '#9ca3af' }} />
          <Text className="text-[11px] font-medium text-gray-400">Target</Text>
        </View>
      </View>

      {/* Chart */}
      <View className="flex-row">
        {/* Y-axis labels */}
        <View style={{ width: yAxisWidth, height: chartHeight }} className="justify-between items-end pr-2">
          {[...yTicks].reverse().map((tick) => (
            <Text key={tick} className="text-[9px] text-gray-400" style={{ lineHeight: 12 }}>
              {tick >= 1000 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k` : tick}
            </Text>
          ))}
        </View>

        {/* Bars area */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View>
            {/* Grid lines */}
            <View style={{ height: chartHeight, position: 'relative' }}>
              {yTicks.map((tick) => {
                const bottom = (tick / maxValue) * chartHeight;
                return (
                  <View
                    key={tick}
                    style={{
                      position: 'absolute',
                      bottom,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: tick === 0 ? '#d1d5db' : '#f3f4f6',
                    }}
                  />
                );
              })}

              {/* Bar groups */}
              <View className="flex-row items-end h-full px-1" style={{ gap: isDesktop ? 8 : 4 }}>
                {byDate.map(([date, shifts]) => {
                  const dayTotal = shifts.reduce((s, sh) => s + sh.produced, 0);
                  const dayTarget = shifts.reduce((s, sh) => s + sh.target, 0);
                  const dayEff = dayTarget > 0 ? Math.round((dayTotal / dayTarget) * 100) : 0;
                  const isSelected = selectedDate === date;
                  const targetHeight = Math.round((dayTarget / maxValue) * chartHeight);

                  return (
                    <Pressable
                      key={date}
                      onPress={() => handleBarPress(date)}
                      className="items-center"
                      style={{ width: barGroupWidth }}
                    >
                      {/* Tooltip (shown when selected) */}
                      {isSelected && (
                        <View style={{ position: 'absolute', bottom: chartHeight + 4, zIndex: 50 }}>
                          <BarTooltip shifts={shifts} dayTotal={dayTotal} dayTarget={dayTarget} dayEff={dayEff} />
                          {/* Arrow */}
                          <View style={{ width: 0, height: 0, alignSelf: 'center', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#111827' }} />
                        </View>
                      )}

                      {/* Efficiency badge (above bar) */}
                      <View style={{ position: 'absolute', bottom: chartHeight + 2, zIndex: 10 }}>
                        {!isSelected && dayTotal > 0 && (
                          <View
                            className="px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: (dayEff >= 80 ? '#10b981' : dayEff >= 50 ? '#f59e0b' : '#ef4444') + '18' }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '700', color: dayEff >= 80 ? '#10b981' : dayEff >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {dayEff}%
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Bar container */}
                      <View className="items-center justify-end w-full" style={{ height: chartHeight }}>
                        {/* Target marker line */}
                        {dayTarget > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: targetHeight,
                              left: 4,
                              right: 4,
                              height: 2,
                              backgroundColor: '#9ca3af',
                              borderRadius: 1,
                              zIndex: 5,
                            }}
                          />
                        )}

                        {/* Stacked bars */}
                        <View
                          className="w-full rounded-t-lg overflow-hidden"
                          style={{
                            width: isDesktop ? 40 : 28,
                            opacity: isSelected ? 1 : 0.85,
                            transform: [{ scaleX: isSelected ? 1.08 : 1 }],
                          }}
                        >
                          {[...shifts].reverse().map((sh) => {
                            const barH = Math.max(
                              Math.round((sh.produced / maxValue) * chartHeight),
                              sh.produced > 0 ? 3 : 0,
                            );
                            const style = getShiftStyle(sh.shift_name);
                            return (
                              <View
                                key={sh.shift_name}
                                style={{ height: barH, backgroundColor: style.fill }}
                                className="w-full"
                              />
                            );
                          })}
                        </View>

                        {/* Zero state indicator */}
                        {dayTotal === 0 && (
                          <View className="absolute bottom-0 w-full items-center pb-1">
                            <View style={{ width: isDesktop ? 40 : 28, height: 3, borderRadius: 2, backgroundColor: '#e5e7eb' }} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* X-axis date labels */}
            <View className="flex-row px-1 mt-2" style={{ gap: isDesktop ? 8 : 4 }}>
              {byDate.map(([date]) => {
                const d = new Date(date + 'T00:00:00');
                const dayName = d.toLocaleDateString('en', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = selectedDate === date;
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <View key={date} className="items-center" style={{ width: barGroupWidth }}>
                    <Text
                      className={`text-[10px] font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {dayName}
                    </Text>
                    <Text
                      className={`text-[9px] ${isSelected ? 'text-blue-500' : isToday ? 'text-emerald-500' : 'text-gray-400'}`}
                    >
                      {dayNum}
                    </Text>
                    {isToday && (
                      <View className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Summary row beneath chart */}
      <View className="flex-row mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 gap-4">
        {(() => {
          const weekTotal = byDate.reduce((s, [, shifts]) => s + shifts.reduce((ss, sh) => ss + sh.produced, 0), 0);
          const weekTarget = byDate.reduce((s, [, shifts]) => s + shifts.reduce((ss, sh) => ss + sh.target, 0), 0);
          const weekEff = weekTarget > 0 ? Math.round((weekTotal / weekTarget) * 100) : 0;
          const weekRejected = byDate.reduce((s, [, shifts]) => s + shifts.reduce((ss, sh) => ss + sh.rejected, 0), 0);
          return (
            <>
              <View className="flex-1 items-center">
                <Text className="text-[10px] text-gray-400 mb-0.5">Total Produced</Text>
                <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatNumber(weekTotal)}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-[10px] text-gray-400 mb-0.5">Total Target</Text>
                <Text className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatNumber(weekTarget)}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-[10px] text-gray-400 mb-0.5">Avg Efficiency</Text>
                <Text className="text-sm font-bold" style={{ color: weekEff >= 80 ? '#10b981' : weekEff >= 50 ? '#f59e0b' : '#ef4444' }}>{weekEff}%</Text>
              </View>
              {weekRejected > 0 && (
                <View className="flex-1 items-center">
                  <Text className="text-[10px] text-gray-400 mb-0.5">Rejected</Text>
                  <Text className="text-sm font-bold text-red-500">{formatNumber(weekRejected)}</Text>
                </View>
              )}
            </>
          );
        })()}
      </View>
    </View>
  );
}

/* ─── Top Rejection Reasons ────────────────── */

function RejectionReasonRow({ reason, index, isLast }: { reason: TopRejectionReason; index: number; isLast: boolean }) {
  const barColor = index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#f59e0b';
  const bgColor = index === 0 ? '#fef2f2' : index === 1 ? '#fff7ed' : '#fffbeb';
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

  return (
    <View className={`py-3 px-1 ${!isLast ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}>
      <View className="flex-row items-center mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          {medal ? (
            <Text style={{ fontSize: 14 }}>{medal}</Text>
          ) : (
            <View className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Text className="text-[10px] font-bold text-gray-400">#{index + 1}</Text>
            </View>
          )}
          <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1" numberOfLines={1}>
            {reason.reason}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-bold" style={{ color: barColor }}>
            {reason.percentage}%
          </Text>
          <View className="bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-medium text-gray-500">
              {formatNumber(reason.total_rejected)} units · {reason.count} logs
            </Text>
          </View>
        </View>
      </View>
      {/* Percentage bar */}
      <View className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, reason.percentage)}%`, backgroundColor: barColor }}
        />
      </View>
    </View>
  );
}

/* ─── Activity Item ────────────────────────── */

function ActivityRow({ item, isLast }: { item: { activity_id: number; action: string; details: string; created_at: string; full_name: string }; isLast: boolean }) {
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(item.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [item.created_at]);

  const actionLabel = item.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());

  return (
    <View className={`flex-row items-center py-3 ${!isLast ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}>
      <View className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 items-center justify-center mr-3">
        <Activity size={14} color={colors.violet[500]} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-800 dark:text-gray-200" numberOfLines={1}>{actionLabel}</Text>
        {item.details ? (
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" numberOfLines={1}>{item.details}</Text>
        ) : null}
      </View>
      <View className="items-end ml-2">
        <Text className="text-[10px] text-gray-400 font-medium">{timeAgo}</Text>
        <Text className="text-[10px] text-gray-300 dark:text-gray-600">{item.full_name}</Text>
      </View>
    </View>
  );
}

/* ─── Section Header ───────────────────────── */

function SectionHeader({ title, icon, count }: { title: string; icon: React.ReactNode; count?: number }) {
  return (
    <View className="flex-row items-center justify-between mb-3 mt-5">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</Text>
        {count !== undefined && (
          <View className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-gray-500">{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */

export function DashboardPage() {
  const sc = useSemanticColors();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth > 768;
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
        <Pressable onPress={() => refetch()} className="bg-indigo-600 px-6 py-3 rounded-xl mt-4">
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const d = data!;
  const hasData = d.todayTarget > 0 || d.totalMachines > 0;
  const maxShiftTarget = Math.max(...d.shiftSummary.map((s) => s.target), 1);

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-black" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="p-4">

        {/* ── Hero Section: Live Status + Efficiency ── */}
        <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
          {/* Live status strip */}
          <View className={`px-4 py-2.5 flex-row items-center gap-2 ${d.rejectionRate > 5 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
            <PulseDot color={d.rejectionRate > 5 ? '#ef4444' : '#10b981'} size={8} />
            {d.rejectionRate > 5 ? (
              <>
                <AlertTriangle size={13} color="#ef4444" />
                <Text className="text-xs font-semibold text-red-600 flex-1">High rejection rate: {d.rejectionRate}%</Text>
              </>
            ) : (
              <>
                <CheckCircle size={13} color="#10b981" />
                <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-1">Production running normally</Text>
              </>
            )}
            <View className="flex-row items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full">
              <Radio size={10} color="#6b7280" />
              <Text className="text-[10px] font-bold text-gray-500">LIVE</Text>
            </View>
          </View>

          {/* Main hero content — desktop: 3-column, mobile: 2-column */}
          <View className={`p-5 ${isDesktop ? 'p-6' : 'p-5'}`}>
            <View className={`${isDesktop ? 'flex-row items-center' : 'flex-row items-center'}`}>
              {/* Left: Efficiency ring — bigger on desktop */}
              <EfficiencyRing value={d.efficiency} size={isDesktop ? 160 : 110} />

              {/* Center: Key numbers */}
              <View className={`flex-1 ${isDesktop ? 'ml-8' : 'ml-5'} gap-3`}>
                <View>
                  <Text className="text-xs text-gray-400 font-medium">Today's Target</Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className={`${isDesktop ? 'text-4xl' : 'text-2xl'} font-extrabold text-gray-900 dark:text-gray-50`}>
                      {formatNumber(d.todayTarget)}
                    </Text>
                    <Text className="text-xs text-gray-400">units</Text>
                  </View>
                </View>
                <View className="h-px bg-gray-100 dark:bg-gray-800" />
                <View className="flex-row gap-4">
                  <View>
                    <Text className="text-xs text-gray-400 font-medium">Produced</Text>
                    <Text className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold text-emerald-600`}>{formatNumber(d.todayProduced)}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400 font-medium">OK</Text>
                    <Text className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold text-blue-600`}>{formatNumber(d.todayOk)}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400 font-medium">Rejected</Text>
                    <Text className={`${isDesktop ? 'text-xl' : 'text-lg'} font-bold ${d.todayRejected > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formatNumber(d.todayRejected)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: Day-over-day quick comparison (desktop only) */}
              {isDesktop && d.yesterday && (
                <View className="ml-8 gap-2 min-w-[200px]">
                  <Text className="text-xs font-semibold text-gray-500 mb-1">vs Yesterday</Text>
                  {(() => {
                    const todayVal = d.todayProduced;
                    const yestVal = d.yesterday.produced;
                    const diff = yestVal > 0 ? Math.round(((todayVal - yestVal) / yestVal) * 100) : (todayVal > 0 ? 100 : 0);
                    const isUp = diff > 0;
                    return (
                      <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                        <Package size={14} color={isUp ? '#10b981' : diff < 0 ? '#ef4444' : '#9ca3af'} />
                        <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1">Production</Text>
                        <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 dark:bg-emerald-950/30' : diff < 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {isUp ? <ArrowUpRight size={10} color="#10b981" /> : diff < 0 ? <ArrowDownRight size={10} color="#ef4444" /> : <Minus size={10} color="#9ca3af" />}
                          <Text className={`text-xs font-bold ${isUp ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>{Math.abs(diff)}%</Text>
                        </View>
                      </View>
                    );
                  })()}
                  {(() => {
                    const todayRej = d.rejectionRate;
                    const yestRej = d.yesterday.rejection_rate;
                    const diff = yestRej > 0 ? Math.round(((todayRej - yestRej) / yestRej) * 100) : (todayRej > 0 ? 100 : 0);
                    const isDown = diff < 0; // lower rejection is good
                    return (
                      <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                        <XCircle size={14} color={isDown ? '#10b981' : diff > 0 ? '#ef4444' : '#9ca3af'} />
                        <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1">Rejection</Text>
                        <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${isDown ? 'bg-emerald-50 dark:bg-emerald-950/30' : diff > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {isDown ? <ArrowDownRight size={10} color="#10b981" /> : diff > 0 ? <ArrowUpRight size={10} color="#ef4444" /> : <Minus size={10} color="#9ca3af" />}
                          <Text className={`text-xs font-bold ${isDown ? 'text-emerald-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>{Math.abs(diff)}%</Text>
                        </View>
                      </View>
                    );
                  })()}
                  {(() => {
                    const todayDt = d.todayDowntimeMin;
                    const yestDt = d.yesterday.downtime_min;
                    const diff = yestDt > 0 ? Math.round(((todayDt - yestDt) / yestDt) * 100) : (todayDt > 0 ? 100 : 0);
                    const isDown = diff < 0; // lower downtime is good
                    return (
                      <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2">
                        <Timer size={14} color={isDown ? '#10b981' : diff > 0 ? '#ef4444' : '#9ca3af'} />
                        <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1">Downtime</Text>
                        <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${isDown ? 'bg-emerald-50 dark:bg-emerald-950/30' : diff > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {isDown ? <ArrowDownRight size={10} color="#10b981" /> : diff > 0 ? <ArrowUpRight size={10} color="#ef4444" /> : <Minus size={10} color="#9ca3af" />}
                          <Text className={`text-xs font-bold ${isDown ? 'text-emerald-600' : diff > 0 ? 'text-red-500' : 'text-gray-400'}`}>{Math.abs(diff)}%</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          </View>

          {/* Bottom stat strip */}
          <View className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <ClipboardList size={13} color="#6b7280" />
              <Text className="text-xs text-gray-500 font-medium">{d.todayPlans} plans today</Text>
            </View>
            <View className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <View className="flex-row items-center gap-1.5">
              <Factory size={13} color="#6b7280" />
              <Text className="text-xs text-gray-500 font-medium">{d.activeMachines}/{d.totalMachines} machines active</Text>
            </View>
            <View className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
            <View className="flex-row items-center gap-1.5">
              <Timer size={13} color="#6b7280" />
              <Text className="text-xs text-gray-500 font-medium">{d.todayDowntimeMin}m downtime</Text>
            </View>
          </View>
        </View>

        {/* ── Day-over-Day Comparison (mobile only) ── */}
        {!isDesktop && d.yesterday && (
          <View className="flex-row flex-wrap gap-3 mb-4">
            <ComparisonStat
              label="Produced"
              today={d.todayProduced}
              yesterday={d.yesterday.produced}
              icon={<Package size={14} color="#10b981" />}
              accentColor="#10b981"
            />
            <ComparisonStat
              label="Target"
              today={d.todayTarget}
              yesterday={d.yesterday.target}
              icon={<Target size={14} color="#3b82f6" />}
              accentColor="#3b82f6"
            />
          </View>
        )}

        {/* ── Performance Trends (Weekly & Monthly) ── */}
        {(d.lastWeek || d.lastMonth) && (
          <>
            <SectionHeader
              title="Performance Trends"
              icon={<TrendingUp size={18} color={colors.blue[500]} />}
            />
            <View className={`${isDesktop ? 'flex-row' : 'flex-row flex-wrap'} gap-3 mb-1`}>
              {d.lastWeek && (
                <TrendCard
                  title="Last 7 Days"
                  icon={<Calendar size={16} color="#6366f1" />}
                  period={d.lastWeek}
                  accentColor="#6366f1"
                  periodLabel="Weekly summary"
                />
              )}
              {d.lastMonth && (
                <TrendCard
                  title="Last 30 Days"
                  icon={<BarChart3 size={16} color="#8b5cf6" />}
                  period={d.lastMonth}
                  accentColor="#8b5cf6"
                  periodLabel="Monthly summary"
                />
              )}
            </View>
          </>
        )}

        {/* ── Shift Performance ── */}
        {d.shiftSummary.length > 0 && (
          <>
            <SectionHeader
              title="Shift Performance"
              icon={<BarChart3 size={18} color={colors.violet[500]} />}
              count={d.shiftSummary.length}
            />
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Today's summary */}
              <View className="px-4 py-1">
                <View className="flex-row items-center gap-1.5 pt-3 pb-1 mb-1 border-b border-gray-100 dark:border-gray-800">
                  <Text className="text-xs font-semibold text-gray-500">Today</Text>
                </View>
                {d.shiftSummary.map((shift, i) => (
                  <ShiftRow key={i} shift={shift} maxTarget={maxShiftTarget} />
                ))}
              </View>

              {/* Weekly chart */}
              {d.shiftHistory && d.shiftHistory.length > 0 && (
                <View className="px-4 pt-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <Calendar size={14} color="#6366f1" />
                      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">Last 7 Days — Daily Production by Shift</Text>
                    </View>
                    <Text className="text-[10px] text-gray-400">Tap bar for details</Text>
                  </View>
                  <ShiftHistoryChart history={d.shiftHistory} isDesktop={isDesktop} />
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Top Rejection Reasons ── */}
        {d.topRejectionReasons && d.topRejectionReasons.length > 0 && (
          <>
            <SectionHeader
              title="Top Rejection Reasons"
              icon={<AlertOctagon size={18} color="#ef4444" />}
              count={d.topRejectionReasons.length}
            />
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <View className="px-3 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-[10px] font-medium text-gray-500">
                  Based on production logs from the last 30 days
                </Text>
              </View>
              <View className="px-3 py-1">
                {d.topRejectionReasons.map((reason, i) => (
                  <RejectionReasonRow
                    key={reason.reason}
                    reason={reason}
                    index={i}
                    isLast={i === d.topRejectionReasons.length - 1}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Machine Utilization Grid ── */}
        {d.machineStatus.length > 0 && (
          <>
            <SectionHeader
              title="Machine Utilization"
              icon={<Factory size={18} color={colors.blue[500]} />}
              count={d.machineStatus.length}
            />
            <View className="flex-row flex-wrap gap-3">
              {d.machineStatus.map((m) => (
                <MachineCard key={m.machine_id} machine={m} />
              ))}
            </View>
          </>
        )}

        {/* ── Recent Activity ── */}
        {d.recentActivity.length > 0 && (
          <>
            <SectionHeader
              title="Recent Activity"
              icon={<Activity size={18} color={colors.violet[500]} />}
              count={d.recentActivity.length}
            />
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-1">
              {d.recentActivity.slice(0, 8).map((a, i) => (
                <ActivityRow key={a.activity_id} item={a} isLast={i === Math.min(d.recentActivity.length - 1, 7)} />
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
