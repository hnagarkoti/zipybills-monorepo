/**
 * Platform Admin – Plans & Features Management
 *
 * Two sections:
 *   1. Plan Configuration – view & edit plan features, limits, pricing
 *   2. Revenue Analytics – MRR, distribution, churn (existing)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Check,
  X,
  Edit3,
  Save,
  Building2,
  Cpu,
  Shield,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface SubscriptionPlan {
  plan_id: number;
  plan_code: string;
  plan_name: string;
  tenant_plan: string;
  base_price_monthly: number;
  price_per_machine: number;
  price_per_user: number;
  max_machines: number;
  max_users: number;
  features: string[];
  is_active: boolean;
  trial_days: number;
  description: string;
  tenant_count: number;
}

interface KnownFeature {
  id: string;
  label: string;
  core: boolean;
}

interface RevenueData {
  mrr: Array<{ month: string; revenue: string; paying_tenants: string }>;
  planDistribution: Array<{ plan: string; count: string }>;
  churn: Array<{ month: string; churned: string }>;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#9ca3af',
  STARTER: '#3b82f6',
  PROFESSIONAL: '#8b5cf6',
  ENTERPRISE: '#f59e0b',
};

type ActiveSection = 'config' | 'analytics';

/* ─── Main Page ──────────────────────── */
export default function PlansPage() {
  const [section, setSection] = useState<ActiveSection>('config');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Plans & Billing</Text>
        <Text className="text-sm text-gray-500">Manage plan features, limits, and view revenue analytics</Text>

        {/* Section tabs */}
        <View className="flex-row mt-4 gap-2">
          <Pressable
            onPress={() => setSection('config')}
            className={`px-4 py-2 rounded-lg ${section === 'config' ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${section === 'config' ? 'text-white' : 'text-gray-600'}`}>
              Plan Configuration
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSection('analytics')}
            className={`px-4 py-2 rounded-lg ${section === 'analytics' ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${section === 'analytics' ? 'text-white' : 'text-gray-600'}`}>
              Revenue Analytics
            </Text>
          </Pressable>
        </View>
      </View>

      {section === 'config' ? <PlanConfigSection /> : <RevenueSection />}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════
   SECTION 1: Plan Configuration
   ═══════════════════════════════════════════════ */

function PlanConfigSection() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () =>
      apiFetch<{ success: boolean; plans: SubscriptionPlan[]; allFeatures: KnownFeature[] }>(
        '/api/billing/admin/plans',
      ),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ code, body }: { code: string; body: Record<string, any> }) =>
      apiFetch(`/api/billing/admin/plans/${code}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setEditingPlan(null);
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Failed to update plan');
    },
  });

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-3">Loading plans...</Text>
      </View>
    );
  }

  if (error || !data?.plans) {
    return (
      <View className="items-center justify-center py-20">
        <X size={40} color="#ef4444" />
        <Text className="text-red-500 mt-3">Failed to load plans</Text>
        <Text className="text-gray-400 text-xs mt-1">Make sure the API server is running</Text>
      </View>
    );
  }

  const { plans, allFeatures } = data;

  return (
    <View className="p-6 gap-4">
      {/* Summary cards */}
      <View className="flex-row flex-wrap gap-3 mb-2">
        {plans.map((plan) => (
          <View
            key={plan.plan_id}
            className="bg-white rounded-xl border border-gray-200 p-4 min-w-[160px] flex-1"
          >
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PLAN_COLORS[plan.tenant_plan] ?? '#6b7280' }}
              />
              <Text className="text-sm font-semibold text-gray-900">{plan.plan_name}</Text>
            </View>
            <Text className="text-xs text-gray-500">
              {plan.tenant_count} tenant{plan.tenant_count !== 1 ? 's' : ''} ·{' '}
              {plan.features?.length ?? 0} features
            </Text>
            <Text className="text-xs text-gray-400 mt-1">
              {plan.max_users === -1 ? '∞' : plan.max_users} users · {plan.max_machines === -1 ? '∞' : plan.max_machines} machines
            </Text>
          </View>
        ))}
      </View>

      {/* Plan detail cards */}
      {plans.map((plan) => (
        <PlanCard
          key={plan.plan_id}
          plan={plan}
          allFeatures={allFeatures}
          isEditing={editingPlan === plan.plan_code}
          onEdit={() => setEditingPlan(plan.plan_code)}
          onCancel={() => setEditingPlan(null)}
          onSave={(body) => updateMutation.mutate({ code: plan.plan_code, body })}
          isSaving={updateMutation.isPending && editingPlan === plan.plan_code}
        />
      ))}
    </View>
  );
}

/* ─── Plan Card ──────────────────────── */

function PlanCard({
  plan,
  allFeatures,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
}: {
  plan: SubscriptionPlan;
  allFeatures: KnownFeature[];
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (body: Record<string, any>) => void;
  isSaving: boolean;
}) {
  const [editFeatures, setEditFeatures] = useState<string[]>(plan.features ?? []);
  const [editMaxUsers, setEditMaxUsers] = useState(String(plan.max_users));
  const [editMaxMachines, setEditMaxMachines] = useState(String(plan.max_machines));
  const [editBasePrice, setEditBasePrice] = useState(String(plan.base_price_monthly));
  const [editDescription, setEditDescription] = useState(plan.description ?? '');
  const [editTrialDays, setEditTrialDays] = useState(String(plan.trial_days));

  const handleStartEdit = useCallback(() => {
    setEditFeatures([...(plan.features ?? [])]);
    setEditMaxUsers(String(plan.max_users));
    setEditMaxMachines(String(plan.max_machines));
    setEditBasePrice(String(plan.base_price_monthly));
    setEditDescription(plan.description ?? '');
    setEditTrialDays(String(plan.trial_days));
    onEdit();
  }, [plan, onEdit]);

  const handleSave = useCallback(() => {
    onSave({
      features: editFeatures,
      max_users: parseInt(editMaxUsers, 10) || plan.max_users,
      max_machines: parseInt(editMaxMachines, 10) || plan.max_machines,
      base_price_monthly: parseFloat(editBasePrice) || plan.base_price_monthly,
      description: editDescription,
      trial_days: parseInt(editTrialDays, 10) ?? plan.trial_days,
    });
  }, [editFeatures, editMaxUsers, editMaxMachines, editBasePrice, editDescription, editTrialDays, plan, onSave]);

  const toggleFeature = useCallback(
    (featureId: string) => {
      setEditFeatures((prev) =>
        prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId],
      );
    },
    [],
  );

  const planColor = PLAN_COLORS[plan.tenant_plan] ?? '#6b7280';

  return (
    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: planColor }} />
          <View>
            <Text className="text-base font-bold text-gray-900">
              {plan.plan_name}{' '}
              <Text className="text-xs font-normal text-gray-400">({plan.plan_code})</Text>
            </Text>
            <Text className="text-xs text-gray-500">
              Maps to tenant plan: {plan.tenant_plan} · {plan.tenant_count} active tenant{plan.tenant_count !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {isEditing ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={onCancel}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-gray-100"
            >
              <Text className="text-sm text-gray-600">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={14} color="#fff" />
              )}
              <Text className="text-sm text-white font-medium">Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleStartEdit}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100"
          >
            <Edit3 size={14} color="#6b7280" />
            <Text className="text-sm text-gray-600">Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View className="px-5 py-4">
        {/* Limits row */}
        <View className="flex-row flex-wrap gap-4 mb-4">
          <LimitField
            icon={<Users size={14} color="#6b7280" />}
            label="Max Users"
            value={isEditing ? editMaxUsers : String(plan.max_users)}
            isEditing={isEditing}
            onChange={setEditMaxUsers}
            hint={plan.max_users === -1 ? 'Unlimited' : undefined}
          />
          <LimitField
            icon={<Cpu size={14} color="#6b7280" />}
            label="Max Machines"
            value={isEditing ? editMaxMachines : String(plan.max_machines)}
            isEditing={isEditing}
            onChange={setEditMaxMachines}
            hint={plan.max_machines === -1 ? 'Unlimited' : undefined}
          />
          <LimitField
            icon={<DollarSign size={14} color="#6b7280" />}
            label="Base Price (₹/mo)"
            value={isEditing ? editBasePrice : String(plan.base_price_monthly)}
            isEditing={isEditing}
            onChange={setEditBasePrice}
          />
          <LimitField
            icon={<Building2 size={14} color="#6b7280" />}
            label="Trial Days"
            value={isEditing ? editTrialDays : String(plan.trial_days)}
            isEditing={isEditing}
            onChange={setEditTrialDays}
          />
        </View>

        {/* Description */}
        {isEditing ? (
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1">Description</Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
              multiline
            />
          </View>
        ) : plan.description ? (
          <Text className="text-sm text-gray-500 mb-4">{plan.description}</Text>
        ) : null}

        {/* Features grid */}
        <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Features ({isEditing ? editFeatures.length : (plan.features?.length ?? 0)})
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {allFeatures.map((feat) => {
            const isEnabled = isEditing
              ? editFeatures.includes(feat.id)
              : (plan.features ?? []).includes(feat.id);

            return (
              <Pressable
                key={feat.id}
                disabled={!isEditing}
                onPress={() => isEditing && toggleFeature(feat.id)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  isEnabled
                    ? 'bg-blue-50 border-blue-200'
                    : isEditing
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                }`}
              >
                {isEnabled ? (
                  <Check size={12} color="#2563eb" />
                ) : (
                  <X size={12} color="#9ca3af" />
                )}
                <Text
                  className={`text-xs ${
                    isEnabled ? 'text-blue-700 font-medium' : 'text-gray-400'
                  }`}
                >
                  {feat.label}
                  {feat.core ? ' ★' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sync notice */}
        {isEditing && plan.tenant_count > 0 && (
          <View className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Text className="text-xs text-amber-700">
              ⚠️ Saving will immediately update features and limits for {plan.tenant_count} tenant{plan.tenant_count !== 1 ? 's' : ''} on the {plan.tenant_plan} plan.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ─── Limit Field ────────────────────── */
function LimitField({
  icon,
  label,
  value,
  isEditing,
  onChange,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <View className="min-w-[120px]">
      <View className="flex-row items-center gap-1 mb-1">
        {icon}
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 w-24"
        />
      ) : (
        <Text className="text-sm font-semibold text-gray-900">{hint ?? value}</Text>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════
   SECTION 2: Revenue Analytics (existing)
   ═══════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'indigo',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: string;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-50',
    green: 'bg-green-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
  };
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-5 flex-1 min-w-[200px]">
      <View className="flex-row items-center justify-between mb-3">
        <View className={`w-10 h-10 ${bgMap[color]} rounded-lg items-center justify-center`}>
          {icon}
        </View>
        {trend && (
          <View className="flex-row items-center gap-1">
            {trend.positive ? (
              <ArrowUpRight size={14} color="#16a34a" />
            ) : (
              <ArrowDownRight size={14} color="#dc2626" />
            )}
            <Text
              className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-500 mt-1">{label}</Text>
    </View>
  );
}

function RevenueSection() {
  const revenueQuery = useQuery({
    queryKey: ['platform-revenue'],
    queryFn: () => apiFetch<any>('/api/super-admin/revenue?months=12'),
  });

  const overviewQuery = useQuery({
    queryKey: ['platform-overview-plans'],
    queryFn: () => apiFetch<any>('/api/saas-dashboard/overview'),
  });

  const isLoading = revenueQuery.isLoading || overviewQuery.isLoading;

  const revenue: RevenueData = revenueQuery.data?.revenue ?? {
    mrr: [],
    planDistribution: [],
    churn: [],
  };

  const overview = overviewQuery.data ?? {};

  const planDist = revenue.planDistribution || [];
  const totalPlanTenants = planDist.reduce((sum, p) => sum + parseInt(p.count, 10), 0);
  const latestMrr = revenue.mrr.length ? parseFloat(revenue.mrr[revenue.mrr.length - 1]!.revenue) : 0;
  const prevMrr = revenue.mrr.length > 1 ? parseFloat(revenue.mrr[revenue.mrr.length - 2]!.revenue) : 0;
  const mrrGrowth = prevMrr > 0 ? (((latestMrr - prevMrr) / prevMrr) * 100).toFixed(1) : '0';
  const totalRevenue = revenue.mrr.reduce((sum, r) => sum + parseFloat(r.revenue), 0);
  const totalChurn = revenue.churn.reduce((sum, c) => sum + parseInt(c.churned, 10), 0);

  if (isLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="text-gray-500 mt-3">Loading billing data...</Text>
      </View>
    );
  }

  return (
    <View className="p-6">
      {/* KPI Cards */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        <StatCard
          label="Monthly Recurring Revenue"
          value={`₹${latestMrr.toLocaleString()}`}
          icon={<DollarSign size={20} color="#4f46e5" />}
          color="indigo"
          trend={{ value: `${mrrGrowth}%`, positive: parseFloat(mrrGrowth) >= 0 }}
        />
        <StatCard
          label="Total Revenue (12mo)"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<TrendingUp size={20} color="#16a34a" />}
          color="green"
        />
        <StatCard
          label="Paying Tenants"
          value={String(revenue.mrr.length > 0 ? revenue.mrr[revenue.mrr.length - 1]!.paying_tenants : overview.total_tenants ?? '0')}
          icon={<Users size={20} color="#f59e0b" />}
          color="amber"
        />
        <StatCard
          label="Churned (12mo)"
          value={String(totalChurn)}
          icon={<ArrowDownRight size={20} color="#dc2626" />}
          color="red"
        />
      </View>

      {/* Plan Distribution */}
      <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <View className="flex-row items-center gap-2 mb-4">
          <PieChart size={18} color="#4f46e5" />
          <Text className="text-base font-semibold text-gray-900">Plan Distribution</Text>
        </View>
        {planDist.length > 0 ? (
          <View className="gap-3">
            {planDist.map((p) => {
              const count = parseInt(p.count, 10);
              const pct = totalPlanTenants > 0 ? ((count / totalPlanTenants) * 100).toFixed(0) : '0';
              const color = PLAN_COLORS[p.plan] ?? '#6b7280';
              return (
                <View key={p.plan}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">{p.plan}</Text>
                    <Text className="text-sm text-gray-500">{count} tenants ({pct}%)</Text>
                  </View>
                  <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text className="text-gray-400 text-sm">No plan data available yet</Text>
        )}
      </View>

      {/* MRR History */}
      <View className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <View className="flex-row items-center gap-2 mb-4">
          <BarChart3 size={18} color="#4f46e5" />
          <Text className="text-base font-semibold text-gray-900">Revenue History</Text>
        </View>
        {revenue.mrr.length > 0 ? (
          <View>
            <View className="flex-row py-2 border-b border-gray-200">
              <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase">Month</Text>
              <Text className="w-28 text-xs font-semibold text-gray-500 uppercase text-right">Revenue</Text>
              <Text className="w-28 text-xs font-semibold text-gray-500 uppercase text-right">Paying</Text>
            </View>
            {revenue.mrr.slice().reverse().map((r, i) => (
              <View key={i} className="flex-row py-3 border-b border-gray-50">
                <Text className="flex-1 text-sm text-gray-700">
                  {new Date(r.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
                <Text className="w-28 text-sm font-semibold text-gray-900 text-right">
                  ₹{parseFloat(r.revenue).toLocaleString()}
                </Text>
                <Text className="w-28 text-sm text-gray-600 text-right">{r.paying_tenants}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center py-8">
            <BarChart3 size={40} color="#d1d5db" />
            <Text className="text-gray-400 mt-2">No revenue data yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}
