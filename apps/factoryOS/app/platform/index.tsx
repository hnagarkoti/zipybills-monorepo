/**
 * Platform Admin Overview Dashboard
 *
 * Shows:
 * - Total tenants, active, trial, suspended counts
 * - Total users and machines across platform
 * - Plan distribution
 * - Recent signups & activity
 * - Growth metrics
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Building2, Users, Factory, TrendingUp,
  AlertTriangle, Clock, CheckCircle, XCircle,
} from 'lucide-react-native';
import { apiFetch } from '@zipybills/factory-api-client';
import { colors } from '@zipybills/theme-engine';

interface PlatformOverview {
  tenants: { total: number; active: number; trial: number; suspended: number; cancelled: number };
  users: { total: number; active: number };
  machines: { total: number; active: number };
  revenue: { mrr: number; arr: number };
}

interface TenantSummary {
  tenant_id: number;
  tenant_slug: string;
  company_name: string;
  status: string;
  plan: string;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  user_count: string;
  machine_count: string;
  last_activity: string | null;
}

interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
}

interface GrowthMetric {
  month: string;
  new_tenants: number;
  churned_tenants: number;
  new_users: number;
}

function StatCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex-1 min-w-[160px]">
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: color + '20' }}>
          {icon}
        </View>
        <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{value}</Text>
      {subtitle && <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text>}
    </View>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const planColors: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    STARTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    PROFESSIONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    ENTERPRISE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  };
  return (
    <View className={`px-2 py-0.5 rounded-full ${planColors[plan] || planColors.FREE}`}>
      <Text className="text-xs font-medium">{plan}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; bg: string }> = {
    ACTIVE: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900' },
    TRIAL: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900' },
    SUSPENDED: { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900' },
    CANCELLED: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
  };
  const cfg = statusConfig[status] || statusConfig.ACTIVE;
  return (
    <View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
      <Text className={`text-xs font-medium ${cfg.color}`}>{status}</Text>
    </View>
  );
}

export default function PlatformOverviewPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [planDist, setPlanDist] = useState<PlanDistribution[]>([]);
  const [growth, setGrowth] = useState<GrowthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, tenantsData, planData, growthData] = await Promise.all([
        apiFetch<{ overview?: PlatformOverview }>('/api/saas-dashboard/overview'),
        apiFetch<{ tenants?: TenantSummary[] }>('/api/super-admin/tenants?limit=10'),
        apiFetch<{ distribution?: PlanDistribution[] }>('/api/saas-dashboard/plan-distribution'),
        apiFetch<{ growth?: GrowthMetric[] }>('/api/saas-dashboard/growth?months=6'),
      ]);

      if (overviewData.overview) setOverview(overviewData.overview);
      if (tenantsData.tenants) setTenants(tenantsData.tenants.filter((t: TenantSummary) => !t.company_name.includes('Platform') && t.tenant_slug !== 'default'));
      if (planData.distribution) setPlanDist(planData.distribution);
      if (growthData.growth) setGrowth(growthData.growth);
    } catch (err) {
      console.error('Platform overview error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.emerald[500]} />
        <Text className="text-slate-400 mt-3">Loading platform data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4 md:p-6 max-w-[1400px]">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Platform Overview</Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor all tenants, usage, and platform health
          </Text>
        </View>

        {/* KPI Cards */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard
            icon={<Building2 size={16} color={colors.blue[500]} />}
            label="Total Tenants"
            value={overview?.tenants.total ?? 0}
            subtitle={`${overview?.tenants.trial ?? 0} in trial`}
            color={colors.blue[500]}
          />
          <StatCard
            icon={<Users size={16} color={colors.emerald[500]} />}
            label="Total Users"
            value={overview?.users.total ?? 0}
            subtitle={`${overview?.users.active ?? 0} active`}
            color={colors.emerald[500]}
          />
          <StatCard
            icon={<Factory size={16} color={colors.purple[500]} />}
            label="Total Machines"
            value={overview?.machines.total ?? 0}
            subtitle={`${overview?.machines.active ?? 0} active`}
            color={colors.purple[500]}
          />
          <StatCard
            icon={<TrendingUp size={16} color={colors.amber[500]} />}
            label="MRR"
            value={`$${overview?.revenue.mrr ?? 0}`}
            subtitle={`ARR: $${overview?.revenue.arr ?? 0}`}
            color={colors.amber[500]}
          />
        </View>

        {/* Tenant Status Summary */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-4 py-3 flex-row items-center">
            <CheckCircle size={14} color={colors.emerald[500]} />
            <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-300 ml-2">
              {overview?.tenants.active ?? 0} Active
            </Text>
          </View>
          <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-3 flex-row items-center">
            <Clock size={14} color={colors.blue[500]} />
            <Text className="text-sm font-medium text-blue-700 dark:text-blue-300 ml-2">
              {overview?.tenants.trial ?? 0} Trial
            </Text>
          </View>
          <View className="bg-red-50 dark:bg-red-900/30 rounded-lg px-4 py-3 flex-row items-center">
            <AlertTriangle size={14} color={colors.red[500]} />
            <Text className="text-sm font-medium text-red-700 dark:text-red-300 ml-2">
              {overview?.tenants.suspended ?? 0} Suspended
            </Text>
          </View>
          <View className="bg-gray-50 dark:bg-gray-900/30 rounded-lg px-4 py-3 flex-row items-center">
            <XCircle size={14} color={colors.gray[500]} />
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
              {overview?.tenants.cancelled ?? 0} Cancelled
            </Text>
          </View>
        </View>

        {/* Plan Distribution */}
        <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6">
          <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">Plan Distribution</Text>
          {planDist.map((p) => (
            <View key={p.plan} className="flex-row items-center mb-2">
              <PlanBadge plan={p.plan} />
              <View className="flex-1 mx-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${p.percentage}%` }}
                />
              </View>
              <Text className="text-sm text-slate-600 dark:text-slate-400 w-16 text-right">
                {p.count} ({p.percentage}%)
              </Text>
            </View>
          ))}
        </View>

        {/* Growth Metrics */}
        {growth.length > 0 && (
          <View className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6">
            <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">Growth (Last 6 Months)</Text>
            {growth.map((g) => (
              <View key={g.month} className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <Text className="text-sm text-slate-600 dark:text-slate-400 w-24">{g.month}</Text>
                <View className="flex-row items-center gap-4">
                  <Text className="text-sm text-emerald-600 dark:text-emerald-400">+{g.new_tenants} tenants</Text>
                  <Text className="text-sm text-blue-600 dark:text-blue-400">+{g.new_users} users</Text>
                  {g.churned_tenants > 0 && (
                    <Text className="text-sm text-red-600 dark:text-red-400">-{g.churned_tenants} churned</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Tenants Table */}
        <View className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <View className="p-4 border-b border-slate-200 dark:border-slate-700">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">Recent Tenants</Text>
          </View>

          {/* Table Header */}
          <View className="flex-row px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <Text className="flex-1 text-xs font-medium text-slate-500 uppercase">Company</Text>
            <Text className="w-20 text-xs font-medium text-slate-500 uppercase text-center">Status</Text>
            <Text className="w-24 text-xs font-medium text-slate-500 uppercase text-center">Plan</Text>
            <Text className="w-16 text-xs font-medium text-slate-500 uppercase text-center">Users</Text>
            <Text className="w-20 text-xs font-medium text-slate-500 uppercase text-center">Machines</Text>
            <Text className="w-28 text-xs font-medium text-slate-500 uppercase text-center">Joined</Text>
          </View>

          {/* Table Rows */}
          {tenants.map((t) => (
            <View key={t.tenant_id} className="flex-row px-4 py-3 items-center border-b border-slate-100 dark:border-slate-700/50">
              <View className="flex-1">
                <Text className="text-sm font-medium text-slate-900 dark:text-white">{t.company_name}</Text>
                <Text className="text-xs text-slate-400">{t.tenant_slug}</Text>
              </View>
              <View className="w-20 items-center">
                <StatusBadge status={t.status} />
              </View>
              <View className="w-24 items-center">
                <PlanBadge plan={t.plan} />
              </View>
              <Text className="w-16 text-sm text-slate-600 dark:text-slate-400 text-center">{t.user_count}</Text>
              <Text className="w-20 text-sm text-slate-600 dark:text-slate-400 text-center">{t.machine_count}</Text>
              <Text className="w-28 text-xs text-slate-400 text-center">
                {new Date(t.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}

          {tenants.length === 0 && (
            <View className="p-8 items-center">
              <Text className="text-slate-400">No tenants onboarded yet</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
