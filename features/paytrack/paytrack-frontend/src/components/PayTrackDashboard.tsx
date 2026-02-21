/**
 * PayTrack Dashboard – Role-Aware Summary View
 *
 * ADMIN:      Full financial dashboard — all stats, amounts, vendor/project breakdown, payments
 * SUPERVISOR: Operational view — material counts, status breakdown, recent entries (no amounts)
 * OPERATOR:   My recent entries only (simplified)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import {
  LayoutDashboard, TrendingUp, TrendingDown, Package, CreditCard,
  Clock, CheckCircle2, AlertTriangle, Building2, FolderOpen,
  ArrowRight, IndianRupee, Receipt, Users, BarChart3, Shield, RefreshCw,
} from 'lucide-react-native';
import { Badge, PageHeader, StatCard } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';
import { useAuthStore } from '@zipybills/ui-store';
import { fetchDashboard, type DashboardStats } from '../services/api';
import { formatCurrency, formatDate, materialStatusConfig, useToast } from '../hooks/usePayTrack';

/* ─── Roles ───────────────────────────────────── */

const canViewFinancials = (role: string) => role === 'ADMIN';
const canViewFullDashboard = (role: string) => ['ADMIN', 'SUPERVISOR'].includes(role);

/* ─── Dashboard Page ─────────────────────────── */

interface PayTrackDashboardProps {
  onNavigate?: (tab: string, params?: Record<string, any>) => void;
  userRole?: string;
}

export function PayTrackDashboard({ onNavigate, userRole: propRole }: PayTrackDashboardProps) {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { show: showToast, ToastView } = useToast();
  const { user } = useAuthStore();
  const userRole = propRole ?? user?.role ?? 'OPERATOR';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await fetchDashboard();
      setStats(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(msg);
      if (isRefresh) showToast(msg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(true); };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={colors.blue[500]} />
        <Text className="text-sm text-gray-400 mt-3">Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
          <AlertTriangle size={32} color={colors.red[400]} />
        </View>
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load dashboard</Text>
        {error && <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1 px-8">{error}</Text>}
        <Text className="text-xs text-gray-400 text-center mb-5 px-8">Check your connection and try again</Text>
        <Pressable
          onPress={() => loadData()}
          className="flex-row items-center bg-blue-500 px-5 py-2.5 rounded-lg shadow-sm"
        >
          <RefreshCw size={14} color="#fff" />
          <Text className="text-white font-semibold ml-2">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { summary, projects, vendors, recent, monthly } = stats;

  return (
    <View className="flex-1">
      <ToastView />
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <PageHeader
          title={userRole === 'OPERATOR' ? 'My Entries' : 'PayTrack Dashboard'}
          subtitle={userRole === 'OPERATOR' ? 'Your recent material entries' : 'Material & payment overview'}
        />

        {/* Role notice for operators */}
        {userRole === 'OPERATOR' && (
          <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-5 border border-blue-200 dark:border-blue-800 flex-row items-center">
            <Shield size={16} color={colors.blue[500]} />
            <Text className="text-sm text-blue-700 dark:text-blue-300 ml-2 flex-1">
              You can view your material entries here. Contact your supervisor for approvals.
            </Text>
          </View>
        )}

        {/* Key Metrics — ADMIN sees financial, SUPERVISOR sees counts only */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          <View className="flex-1 min-w-[140px]">
            <StatCard
              label="Total Materials"
              value={summary.total_materials}
              color="blue"
              icon={<Package size={16} color={colors.blue[500]} />}
            />
          </View>
          {canViewFinancials(userRole) && (
            <View className="flex-1 min-w-[140px]">
              <StatCard
                label="Total Amount"
                value={formatCurrency(summary.total_amount)}
                color="purple"
                icon={<IndianRupee size={16} color={colors.purple[500]} />}
              />
            </View>
          )}
          {canViewFinancials(userRole) && (
            <View className="flex-1 min-w-[140px]">
              <StatCard
                label="Paid"
                value={formatCurrency(summary.paid_amount)}
                color="emerald"
                icon={<CheckCircle2 size={16} color={colors.emerald[500]} />}
              />
            </View>
          )}
          {canViewFullDashboard(userRole) && (
            <View className="flex-1 min-w-[140px]">
              <StatCard
                label={canViewFinancials(userRole) ? 'Pending Amount' : 'Pending Items'}
                value={canViewFinancials(userRole) ? formatCurrency(summary.pending_amount) : summary.pending_count}
                color="red"
                icon={<Clock size={16} color={colors.red[500]} />}
              />
            </View>
          )}
        </View>

        {/* Status Breakdown */}
        <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
          <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Status Breakdown</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => onNavigate?.('materials', { status: 'pending' })}
              className="flex-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800"
            >
              <Text className="text-xs text-amber-600 dark:text-amber-400">Pending</Text>
              <Text className="text-xl font-bold text-amber-700 dark:text-amber-300">{summary.pending_count}</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigate?.('materials', { status: 'approved' })}
              className="flex-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
            >
              <Text className="text-xs text-blue-600 dark:text-blue-400">Approved</Text>
              <Text className="text-xl font-bold text-blue-700 dark:text-blue-300">{summary.approved_count}</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigate?.('materials', { status: 'payment_requested' })}
              className="flex-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800"
            >
              <Text className="text-xs text-purple-600 dark:text-purple-400">Requested</Text>
              <Text className="text-xl font-bold text-purple-700 dark:text-purple-300">{summary.requested_count}</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigate?.('materials', { status: 'paid' })}
              className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800"
            >
              <Text className="text-xs text-emerald-600 dark:text-emerald-400">Paid</Text>
              <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{summary.paid_count}</Text>
            </Pressable>
          </View>
        </View>

        {/* Project Summaries — ADMIN and SUPERVISOR */}
        {canViewFullDashboard(userRole) && projects.length > 0 && (
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <FolderOpen size={16} color={sc.iconDefault} />
                <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">Project Summary</Text>
              </View>
              <Pressable onPress={() => onNavigate?.('projects')} className="flex-row items-center">
                <Text className="text-xs text-blue-500 font-medium mr-1">View All</Text>
                <ArrowRight size={12} color={colors.blue[500]} />
              </Pressable>
            </View>
            {projects.slice(0, 5).map((p) => {
              const paidPct = Number(p.total_requested) > 0
                ? Math.round((Number(p.total_paid) / Number(p.total_requested)) * 100)
                : 0;
              return (
                <View key={p.id} className="border-b border-gray-50 dark:border-gray-700 py-3 last:border-b-0">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.name}</Text>
                      {p.client_name && <Text className="text-xs text-gray-400">{p.client_name}</Text>}
                    </View>
                    <Text className="text-xs text-gray-400">{p.material_count} items</Text>
                  </View>
                  {canViewFinancials(userRole) && (
                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-row items-center">
                        <Text className="text-xs text-gray-500">Requested: </Text>
                        <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(p.total_requested)}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-xs text-emerald-600">Paid: </Text>
                        <Text className="text-xs font-semibold text-emerald-700">{formatCurrency(p.total_paid)}</Text>
                      </View>
                      {Number(p.pending_amount) > 0 && (
                        <View className="flex-row items-center">
                          <Text className="text-xs text-red-600">Due: </Text>
                          <Text className="text-xs font-semibold text-red-700">{formatCurrency(p.pending_amount)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {/* Progress bar */}
                  <View className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, paidPct)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Vendor Breakdown — ADMIN only (financial data) */}
        {canViewFinancials(userRole) && vendors.length > 0 && (
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Building2 size={16} color={sc.iconDefault} />
                <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">Top Vendors</Text>
              </View>
              <Pressable onPress={() => onNavigate?.('vendors')} className="flex-row items-center">
                <Text className="text-xs text-blue-500 font-medium mr-1">View All</Text>
                <ArrowRight size={12} color={colors.blue[500]} />
              </Pressable>
            </View>
            {vendors.slice(0, 5).map((v) => (
              <View key={v.id} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                    <Building2 size={14} color={colors.blue[500]} />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</Text>
                    <Text className="text-xs text-gray-400">{v.material_count} materials</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(v.total_billed)}</Text>
                  <Text className="text-xs text-emerald-600">{formatCurrency(v.total_paid)} paid</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Expenses — ADMIN only */}
        {canViewFinancials(userRole) && monthly.length > 0 && (
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
            <View className="flex-row items-center mb-3">
              <BarChart3 size={16} color={sc.iconDefault} />
              <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">Monthly Expenses</Text>
            </View>
            {monthly.map((m) => {
              const paidPct = Number(m.total) > 0 ? Math.round((Number(m.paid) / Number(m.total)) * 100) : 0;
              const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              return (
                <View key={m.month} className="mb-3 last:mb-0">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">{monthLabel}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs text-gray-500">{m.entries} entries</Text>
                      <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(m.total)}</Text>
                    </View>
                  </View>
                  <View className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, paidPct)}%` }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-0.5">
                    <Text className="text-[10px] text-emerald-600">{formatCurrency(m.paid)} paid</Text>
                    <Text className="text-[10px] text-gray-400">{paidPct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Activity */}
        {recent.length > 0 && (
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Receipt size={16} color={sc.iconDefault} />
                <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 ml-2">Recent Entries</Text>
              </View>
              <Pressable onPress={() => onNavigate?.('materials')} className="flex-row items-center">
                <Text className="text-xs text-blue-500 font-medium mr-1">View All</Text>
                <ArrowRight size={12} color={colors.blue[500]} />
              </Pressable>
            </View>
            {recent.slice(0, 5).map((r) => {
              const cfg = materialStatusConfig[r.status] ?? { label: 'Pending', variant: 'warning' as const, color: '#d97706', bgClass: '' };
              return (
                <View key={r.id} className="flex-row items-center py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.material_name}</Text>
                    <Text className="text-xs text-gray-400">{r.project_name} · {r.vendor_name}</Text>
                  </View>
                  <View className="items-end ml-3">
                    <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(r.total_amount)}</Text>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state */}
        {summary.total_materials === 0 && (
          <View className="items-center py-12">
            <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
              <Package size={40} color={colors.blue[500]} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No entries yet</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs mb-4">
              Start by adding a project and vendor, then record your first material entry.
            </Text>
            <Pressable onPress={() => onNavigate?.('materials')} className="bg-blue-500 px-5 py-2.5 rounded-lg flex-row items-center">
              <Package size={14} color={colors.white} />
              <Text className="text-white font-semibold text-sm ml-2">Add First Entry</Text>
            </Pressable>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
