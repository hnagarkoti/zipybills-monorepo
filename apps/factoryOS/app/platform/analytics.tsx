import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Cog,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface GrowthRow {
  month: string;
  new_tenants: string;
  new_users: string;
  new_machines: string;
}

function StatCard({
  label,
  value,
  icon,
  delta,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  delta?: { value: string; positive: boolean };
}) {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-5 flex-1 min-w-[200px]">
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-10 h-10 bg-indigo-50 rounded-lg items-center justify-center">
          {icon}
        </View>
        {delta && (
          <View className="flex-row items-center gap-1">
            {delta.positive ? (
              <ArrowUpRight size={14} color="#16a34a" />
            ) : (
              <ArrowDownRight size={14} color="#dc2626" />
            )}
            <Text
              className={`text-xs font-medium ${delta.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {delta.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-500 mt-1">{label}</Text>
    </View>
  );
}

export default function AnalyticsPage() {
  const growthQuery = useQuery({
    queryKey: ['platform-growth'],
    queryFn: () => apiFetch('/api/saas-dashboard/growth?months=12'),
  });

  const overviewQuery = useQuery({
    queryKey: ['platform-analytics-overview'],
    queryFn: () => apiFetch('/api/saas-dashboard/overview'),
  });

  const planDistQuery = useQuery({
    queryKey: ['platform-plan-dist'],
    queryFn: () => apiFetch('/api/saas-dashboard/plan-distribution'),
  });

  const isLoading = growthQuery.isLoading || overviewQuery.isLoading;

  const growth: GrowthRow[] = growthQuery.data?.growth ?? [];
  const overview = overviewQuery.data ?? {};
  const planDist = planDistQuery.data?.distribution ?? [];

  // Compute totals from growth data
  const totalNewTenants = growth.reduce((s, g) => s + parseInt(g.new_tenants, 10), 0);
  const totalNewUsers = growth.reduce((s, g) => s + parseInt(g.new_users, 10), 0);
  const totalNewMachines = growth.reduce((s, g) => s + parseInt(g.new_machines, 10), 0);

  // Month-over-month delta for tenants
  const lastMonth = growth.length > 0 ? parseInt(growth[growth.length - 1]!.new_tenants, 10) : 0;
  const prevMonth =
    growth.length > 1 ? parseInt(growth[growth.length - 2]!.new_tenants, 10) : 0;
  const tenantDelta =
    prevMonth > 0 ? (((lastMonth - prevMonth) / prevMonth) * 100).toFixed(0) : '0';

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-3">Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Analytics</Text>
        <Text className="text-sm text-gray-500">Platform growth and engagement metrics</Text>
      </View>

      <View className="p-6">
        {/* KPI Cards */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <StatCard
            label="Total Tenants"
            value={overview.total_tenants ?? 0}
            icon={<Building2 size={20} color="#4f46e5" />}
          />
          <StatCard
            label="Total Users"
            value={overview.total_users ?? 0}
            icon={<Users size={20} color="#4f46e5" />}
          />
          <StatCard
            label="Total Machines"
            value={overview.total_machines ?? 0}
            icon={<Cog size={20} color="#4f46e5" />}
          />
          <StatCard
            label="New Tenants (12mo)"
            value={totalNewTenants}
            icon={<TrendingUp size={20} color="#4f46e5" />}
            delta={{
              value: `${tenantDelta}% MoM`,
              positive: parseInt(tenantDelta, 10) >= 0,
            }}
          />
        </View>

        {/* Growth Table */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <BarChart3 size={18} color="#4f46e5" />
            <Text className="text-base font-semibold text-gray-900">Monthly Growth</Text>
          </View>

          {growth.length > 0 ? (
            <View>
              {/* Header */}
              <View className="flex-row py-2 border-b border-gray-200">
                <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Month</Text>
                <Text className="w-28 text-xs font-semibold text-gray-500 uppercase text-right">
                  Tenants
                </Text>
                <Text className="w-28 text-xs font-semibold text-gray-500 uppercase text-right">
                  Users
                </Text>
                <Text className="w-28 text-xs font-semibold text-gray-500 uppercase text-right">
                  Machines
                </Text>
              </View>

              {growth
                .slice()
                .reverse()
                .map((g, i) => (
                  <View key={i} className="flex-row items-center py-3 border-b border-gray-50">
                    <View className="flex-1 flex-row items-center gap-2">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-700">
                        {new Date(g.month).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text className="w-28 text-sm font-semibold text-gray-900 text-right">
                      +{g.new_tenants}
                    </Text>
                    <Text className="w-28 text-sm text-gray-600 text-right">+{g.new_users}</Text>
                    <Text className="w-28 text-sm text-gray-600 text-right">
                      +{g.new_machines}
                    </Text>
                  </View>
                ))}

              {/* Totals */}
              <View className="flex-row items-center py-3 bg-gray-50 mt-1 rounded-lg px-2">
                <Text className="flex-1 text-sm font-bold text-gray-900">Total</Text>
                <Text className="w-28 text-sm font-bold text-indigo-600 text-right">
                  +{totalNewTenants}
                </Text>
                <Text className="w-28 text-sm font-bold text-indigo-600 text-right">
                  +{totalNewUsers}
                </Text>
                <Text className="w-28 text-sm font-bold text-indigo-600 text-right">
                  +{totalNewMachines}
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <BarChart3 size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No growth data yet</Text>
            </View>
          )}
        </View>

        {/* Plan Distribution Breakdown */}
        {planDist.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Tenant Distribution by Plan
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {planDist.map((p: any) => {
                const colors: Record<string, string> = {
                  FREE: 'bg-gray-100 border-gray-200',
                  STARTER: 'bg-blue-50 border-blue-200',
                  PROFESSIONAL: 'bg-purple-50 border-purple-200',
                  ENTERPRISE: 'bg-amber-50 border-amber-200',
                };
                const textColors: Record<string, string> = {
                  FREE: 'text-gray-700',
                  STARTER: 'text-blue-700',
                  PROFESSIONAL: 'text-purple-700',
                  ENTERPRISE: 'text-amber-800',
                };
                return (
                  <View
                    key={p.plan}
                    className={`flex-1 min-w-[140px] p-4 rounded-xl border ${
                      colors[p.plan] ?? 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-2xl font-bold ${textColors[p.plan] ?? 'text-gray-700'}`}>
                      {p.count}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">{p.plan}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <Text className="text-base font-semibold text-gray-900 mb-3">Platform Summary</Text>
          <View className="gap-2">
            {[
              { label: 'Active Tenants', value: overview.active_tenants ?? 0 },
              { label: 'Trial Tenants', value: overview.trial_tenants ?? 0 },
              { label: 'Suspended Tenants', value: overview.suspended_tenants ?? 0 },
              {
                label: 'Avg Users per Tenant',
                value:
                  overview.total_tenants > 0
                    ? (overview.total_users / overview.total_tenants).toFixed(1)
                    : '0',
              },
              {
                label: 'Avg Machines per Tenant',
                value:
                  overview.total_tenants > 0
                    ? (overview.total_machines / overview.total_tenants).toFixed(1)
                    : '0',
              },
            ].map((item) => (
              <View key={item.label} className="flex-row justify-between py-2 border-b border-gray-50">
                <Text className="text-sm text-gray-600">{item.label}</Text>
                <Text className="text-sm font-semibold text-gray-900">{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
