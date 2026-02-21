/**
 * PayTrack Payments Page – Payment history with filters and export-ready view
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import {
  CreditCard, Search, X, IndianRupee, Building2, FolderOpen, FileText, Calendar,
  AlertTriangle, RefreshCw,
} from 'lucide-react-native';
import { Badge, PageHeader } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';
import { fetchPayments, type Payment } from '../services/api';
import { formatCurrency, formatDate, formatDateTime, paymentModeConfig, useToast } from '../hooks/usePayTrack';

/* ─── Main Payments Page ──────────────────────── */

export function PaymentsPage() {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { show: showToast, ToastView } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const result = await fetchPayments();
      setPayments(result.payments);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load payments';
      setError(msg);
      if (isRefresh) showToast(msg, 'error');
    } finally { setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (modeFilter !== 'ALL' && p.payment_mode !== modeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          p.material_name?.toLowerCase().includes(s) ||
          p.project_name?.toLowerCase().includes(s) ||
          p.vendor_name?.toLowerCase().includes(s) ||
          p.transaction_id?.toLowerCase().includes(s) ||
          p.invoice_number?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [payments, search, modeFilter]);

  const totalPaid = useMemo(() =>
    filteredPayments.reduce((sum, p) => sum + Number(p.paid_amount), 0),
  [filteredPayments]);

  const modeBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; amount: number }> = {};
    payments.forEach((p) => {
      if (!breakdown[p.payment_mode]) breakdown[p.payment_mode] = { count: 0, amount: 0 };
      const entry = breakdown[p.payment_mode];
      if (entry) { entry.count++; entry.amount += Number(p.paid_amount); }
    });
    return breakdown;
  }, [payments]);

  const MODES = Object.entries(paymentModeConfig);

  return (
    <View className="flex-1">
      <ToastView />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <PageHeader title="Payments" subtitle={`${payments.length} transactions`} />

        {/* Summary Cards */}
        {payments.length > 0 && (
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
              <Text className="text-xs text-emerald-600 dark:text-emerald-400">Total Paid</Text>
              <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</Text>
              <Text className="text-[10px] text-emerald-500">{filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}</Text>
            </View>
            {Object.entries(modeBreakdown).slice(0, 3).map(([mode, data]) => {
              const cfg = paymentModeConfig[mode] ?? { label: mode, icon: '💰' };
              return (
                <View key={mode} className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                  <Text className="text-xs text-gray-400">{cfg.icon} {cfg.label}</Text>
                  <Text className="text-lg font-bold text-gray-700 dark:text-gray-300">{formatCurrency(data.amount)}</Text>
                  <Text className="text-[10px] text-gray-400">{data.count} txn{data.count !== 1 ? 's' : ''}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Mode Filter */}
        {payments.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setModeFilter('ALL')}
                className={`px-3 py-2 rounded-lg border flex-row items-center ${
                  modeFilter === 'ALL' ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <Text className={`text-xs font-semibold ${modeFilter === 'ALL' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>All</Text>
              </Pressable>
              {MODES.map(([key, cfg]) => (
                <Pressable
                  key={key}
                  onPress={() => setModeFilter(key)}
                  className={`px-3 py-2 rounded-lg border flex-row items-center ${
                    modeFilter === key ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text className="text-sm mr-1">{cfg.icon}</Text>
                  <Text className={`text-xs font-semibold ${modeFilter === key ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{cfg.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Search */}
        {payments.length > 0 && (
          <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
            <Search size={14} color={sc.iconMuted} />
            <TextInput
              className="flex-1 text-sm ml-2 text-gray-900 dark:text-gray-100"
              value={search} onChangeText={setSearch}
              placeholder="Search by material, vendor, txn ID..." placeholderTextColor="#9ca3af"
            />
            {search.length > 0 && <Pressable onPress={() => setSearch('')}><X size={14} color={sc.iconMuted} /></Pressable>}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View className="items-center py-12"><ActivityIndicator size="large" color={colors.blue[500]} /></View>
        ) : error && payments.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
              <AlertTriangle size={32} color={colors.red[400]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to fetch payments</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1 px-8">{error}</Text>
            <Text className="text-xs text-gray-400 text-center mb-5 px-8">Check your connection and try again</Text>
            <Pressable
              onPress={() => loadData()}
              className="flex-row items-center bg-blue-500 px-5 py-2.5 rounded-lg shadow-sm"
            >
              <RefreshCw size={14} color="#fff" />
              <Text className="text-white font-semibold ml-2">Retry</Text>
            </Pressable>
          </View>
        ) : payments.length === 0 ? (
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mb-4">
              <CreditCard size={32} color={colors.emerald[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No payments yet</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Payments will appear here once materials are marked as paid
            </Text>
          </View>
        ) : (
          <View>
            {filteredPayments.map((p) => {
              const cfg = paymentModeConfig[p.payment_mode] ?? { label: p.payment_mode, icon: '💰' };
              return (
                <View key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-400 p-4 mb-3 shadow-sm">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{p.material_name}</Text>
                      <View className="flex-row items-center mt-0.5">
                        <FolderOpen size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1">{p.project_name}</Text>
                        <Text className="text-xs text-gray-300 mx-1">·</Text>
                        <Building2 size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1">{p.vendor_name}</Text>
                      </View>
                    </View>
                    <Text className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.paid_amount)}</Text>
                  </View>

                  <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                    <View className="flex-row items-center">
                      <Text className="text-sm mr-1">{cfg.icon}</Text>
                      <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">{cfg.label}</Text>
                    </View>
                    {p.transaction_id && (
                      <View className="flex-row items-center">
                        <FileText size={11} color={sc.iconMuted} />
                        <Text className="text-xs text-gray-400 ml-1 font-mono">{p.transaction_id}</Text>
                      </View>
                    )}
                    {p.invoice_number && (
                      <View className="flex-row items-center">
                        <Text className="text-xs text-gray-400">Inv: {p.invoice_number}</Text>
                      </View>
                    )}
                    <View className="flex-row items-center">
                      <Calendar size={11} color={sc.iconMuted} />
                      <Text className="text-xs text-gray-400 ml-1">{formatDate(p.payment_date)}</Text>
                    </View>
                  </View>

                  {p.paid_by_name && (
                    <Text className="text-[10px] text-gray-400">Paid by {p.paid_by_name}</Text>
                  )}

                  {p.notes && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{p.notes}"</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
