import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Cog,
  Shield,
  Ban,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  X,
  RefreshCw,
  Clock,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Edit3,
  Save,
  Download,
  FileSpreadsheet,
  Timer,
  Phone,
  Mail,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────────── */
interface Tenant {
  tenant_id: number;
  company_name: string;
  subdomain: string;
  plan: string;
  status: string;
  is_active: boolean;
  is_platform_admin: boolean;
  max_users: number;
  max_machines: number;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  user_count: string;
  machine_count: string;
  last_activity: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface TenantDetail {
  tenant: Tenant;
  users: Array<{
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
  }>;
  usage: Array<{ metric_type: string; total_value: string }>;
  limits: {
    max_users: number;
    max_machines: number;
    max_storage_mb: number;
    max_api_calls_day: number;
  } | null;
  login_activity: Array<{
    activity_id: number;
    action: string;
    details: string;
    created_at: string;
    ip_address: string | null;
    username: string;
    full_name: string;
  }>;
  recent_errors: Array<{
    activity_id: number;
    action: string;
    details: string;
    entity_type: string;
    entity_id: number;
    created_at: string;
    username: string;
  }>;
  feature_flags: Array<{
    flag_name: string;
    is_enabled: boolean;
    value?: string;
  }>;
}

const PLANS = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as const;
const STATUS_FILTERS = ['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const;

const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-800',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  TRIAL: 'bg-blue-100 text-blue-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle size={14} color="#15803d" />,
  TRIAL: <RefreshCw size={14} color="#1d4ed8" />,
  SUSPENDED: <Ban size={14} color="#b91c1c" />,
  CANCELLED: <X size={14} color="#6b7280" />,
};

/* ─── Badges ────────────────────────────── */
function PlanBadge({ plan }: { plan: string }) {
  const cls = planColors[plan] ?? 'bg-gray-100 text-gray-600';
  return (
    <View className={`px-2 py-0.5 rounded-full ${cls.split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${cls.split(' ')[1]}`}>{plan}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] ?? 'bg-gray-100 text-gray-500';
  return (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${cls.split(' ')[0]}`}>
      {statusIcons[status]}
      <Text className={`text-xs font-semibold ${cls.split(' ')[1]}`}>{status}</Text>
    </View>
  );
}

/* ─── Main Component ─────────────────────── */
export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTarget, setPlanTarget] = useState<{ id: number; name: string; current: string } | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Trial extension state
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialTarget, setTrialTarget] = useState<{ id: number; name: string; currentEnd: string | null } | null>(null);
  const [trialDays, setTrialDays] = useState('30');
  const TRIAL_PRESETS = [
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
    { label: '6 months', value: 180 },
    { label: '1 year', value: 365 },
  ];

  // Limits editing state
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [limitsTarget, setLimitsTarget] = useState<{ id: number; name: string } | null>(null);
  const [limitsForm, setLimitsForm] = useState({ max_users: '', max_machines: '' });

  /* ─── Queries ─────── */
  const tenantsQuery = useQuery({
    queryKey: ['platform-tenants', page, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      return apiFetch(`/api/super-admin/tenants?${params}`);
    },
  });

  const detailQuery = useQuery({
    queryKey: ['platform-tenant-detail', selectedTenant],
    queryFn: () => apiFetch(`/api/super-admin/tenants/${selectedTenant}`),
    enabled: !!selectedTenant,
  });

  /* ─── Mutations ─────── */
  const suspendMutation = useMutation({
    mutationFn: (tenantId: number) =>
      apiFetch(`/api/super-admin/tenants/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspended by platform admin' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail'] });
      Alert.alert('Success', 'Tenant has been suspended.');
    },
    onError: () => Alert.alert('Error', 'Failed to suspend tenant.'),
  });

  const activateMutation = useMutation({
    mutationFn: (tenantId: number) =>
      apiFetch(`/api/super-admin/tenants/${tenantId}/activate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail'] });
      Alert.alert('Success', 'Tenant has been activated.');
    },
    onError: () => Alert.alert('Error', 'Failed to activate tenant.'),
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: number; plan: string }) =>
      apiFetch(`/api/super-admin/tenants/${tenantId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail'] });
      setShowPlanModal(false);
      Alert.alert('Success', data.message || 'Plan changed successfully.');
    },
    onError: () => Alert.alert('Error', 'Failed to change plan.'),
  });

  const extendTrialMutation = useMutation({
    mutationFn: ({ tenantId, days }: { tenantId: number; days: number }) =>
      apiFetch(`/api/super-admin/tenants/${tenantId}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail'] });
      setShowTrialModal(false);
      Alert.alert('Success', data.message || 'Trial extended successfully.');
    },
    onError: () => Alert.alert('Error', 'Failed to extend trial.'),
  });

  const updateLimitsMutation = useMutation({
    mutationFn: ({ tenantId, limits }: { tenantId: number; limits: Record<string, number> }) =>
      apiFetch(`/api/super-admin/tenants/${tenantId}/limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-tenant-detail'] });
      setShowLimitsModal(false);
      Alert.alert('Success', 'Limits updated and synced.');
    },
    onError: () => Alert.alert('Error', 'Failed to update limits.'),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
    setRefreshing(false);
  }, [queryClient]);

  const tenants: Tenant[] = tenantsQuery.data?.tenants ?? [];
  const pagination = tenantsQuery.data?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const detail: TenantDetail | null = detailQuery.data ?? null;

  /* ─── Handlers ─────── */
  const handleSuspend = (tenant: Tenant) => {
    Alert.alert(
      'Suspend Tenant',
      `Are you sure you want to suspend "${tenant.company_name}"? All users will lose access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => suspendMutation.mutate(tenant.tenant_id) },
      ],
    );
  };

  const handleActivate = (tenant: Tenant) => {
    Alert.alert(
      'Activate Tenant',
      `Activate "${tenant.company_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: () => activateMutation.mutate(tenant.tenant_id) },
      ],
    );
  };

  const openPlanModal = (tenant: Tenant) => {
    setPlanTarget({ id: tenant.tenant_id, name: tenant.company_name, current: tenant.plan });
    setNewPlan(tenant.plan);
    setShowPlanModal(true);
  };

  const daysUntilTrialEnd = (trialEnds: string | null) => {
    if (!trialEnds) return null;
    const diff = new Date(trialEnds).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const openTrialModal = (tenant: Tenant) => {
    setTrialTarget({ id: tenant.tenant_id, name: tenant.company_name, currentEnd: tenant.trial_ends_at });
    setTrialDays('30');
    setShowTrialModal(true);
  };

  const openLimitsModal = (tenant: Tenant) => {
    setLimitsTarget({ id: tenant.tenant_id, name: tenant.company_name });
    setLimitsForm({
      max_users: String(tenant.max_users),
      max_machines: String(tenant.max_machines),
    });
    setShowLimitsModal(true);
  };

  const handleExportCsv = async (tenantId: number, type: 'users' | 'machines' | 'activity') => {
    try {
      const response = await apiFetch<string>(`/api/super-admin/tenants/${tenantId}/export-csv?type=${type}`, {
        headers: { Accept: 'text/csv' },
      });
      // On web, trigger download; on native, show alert with info
      Alert.alert('Export Ready', `The ${type} data has been exported as CSV.`);
    } catch {
      Alert.alert('Error', `Failed to export ${type} data.`);
    }
  };

  /* ─── Render ──────── */

  // Detail drawer overlay
  if (selectedTenant && detail) {
    return (
      <ScrollView className="flex-1 bg-gray-50 p-6" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => setSelectedTenant(null)} className="flex-row items-center gap-2">
            <ChevronDown size={20} color="#6b7280" style={{ transform: [{ rotate: '90deg' }] }} />
            <Text className="text-gray-500 text-sm">Back to Tenants</Text>
          </Pressable>
        </View>

        {/* Tenant header card */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 bg-indigo-100 rounded-xl items-center justify-center">
                <Building2 size={24} color="#4f46e5" />
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-900">{detail.tenant.company_name}</Text>
                <Text className="text-sm text-gray-500">{detail.tenant.subdomain}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <PlanBadge plan={detail.tenant.plan} />
              <StatusBadge status={detail.tenant.status} />
            </View>
          </View>

          {detail.tenant.trial_ends_at && (
            <View className="bg-blue-50 rounded-lg p-3 mb-4">
              <Text className="text-blue-800 text-sm font-medium">
                Trial ends in {daysUntilTrialEnd(detail.tenant.trial_ends_at)} days
                ({new Date(detail.tenant.trial_ends_at).toLocaleDateString()})
              </Text>
            </View>
          )}

          {/* Contact Info */}
          {(detail.tenant.contact_email || detail.tenant.contact_phone) && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4 gap-2">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact</Text>
              {detail.tenant.contact_phone && (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${detail.tenant.contact_phone}`)}
                  className="flex-row items-center gap-2"
                >
                  <Phone size={15} color="#4f46e5" />
                  <Text className="text-sm text-indigo-600 font-medium">{detail.tenant.contact_phone}</Text>
                  <Text className="text-xs text-gray-400 ml-1">Tap to call</Text>
                </Pressable>
              )}
              {detail.tenant.contact_email && (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${detail.tenant.contact_email}`)}
                  className="flex-row items-center gap-2"
                >
                  <Mail size={15} color="#4f46e5" />
                  <Text className="text-sm text-indigo-600 font-medium">{detail.tenant.contact_email}</Text>
                  <Text className="text-xs text-gray-400 ml-1">Tap to email</Text>
                </Pressable>
              )}
            </View>
          )}

          <View className="flex-row gap-4">
            <View className="flex-1 bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-500 text-xs mb-1">Max Users</Text>
              <Text className="text-lg font-bold text-gray-900">
                {detail.tenant.max_users === -1 ? '∞' : detail.tenant.max_users}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-500 text-xs mb-1">Max Machines</Text>
              <Text className="text-lg font-bold text-gray-900">
                {detail.tenant.max_machines === -1 ? '∞' : detail.tenant.max_machines}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-500 text-xs mb-1">Joined</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {new Date(detail.tenant.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            {detail.tenant.status === 'SUSPENDED' ? (
              <Pressable
                onPress={() => handleActivate(detail.tenant)}
                className="flex-row items-center gap-2 bg-green-600 px-4 py-2.5 rounded-lg"
              >
                <CheckCircle size={16} color="#fff" />
                <Text className="text-white font-medium text-sm">Activate</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleSuspend(detail.tenant)}
                className="flex-row items-center gap-2 bg-red-600 px-4 py-2.5 rounded-lg"
              >
                <Ban size={16} color="#fff" />
                <Text className="text-white font-medium text-sm">Suspend</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => openPlanModal(detail.tenant)}
              className="flex-row items-center gap-2 bg-indigo-600 px-4 py-2.5 rounded-lg"
            >
              <ArrowUpCircle size={16} color="#fff" />
              <Text className="text-white font-medium text-sm">Change Plan</Text>
            </Pressable>
            <Pressable
              onPress={() => openTrialModal(detail.tenant)}
              className="flex-row items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-lg"
            >
              <Timer size={16} color="#fff" />
              <Text className="text-white font-medium text-sm">Extend Trial</Text>
            </Pressable>
            <Pressable
              onPress={() => openLimitsModal(detail.tenant)}
              className="flex-row items-center gap-2 bg-amber-600 px-4 py-2.5 rounded-lg"
            >
              <Edit3 size={16} color="#fff" />
              <Text className="text-white font-medium text-sm">Edit Limits</Text>
            </Pressable>
          </View>
        </View>

        {/* Export Data */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <View className="flex-row items-center gap-2 mb-4">
            <FileSpreadsheet size={18} color="#4f46e5" />
            <Text className="text-base font-semibold text-gray-900">Export Data (CSV)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {(['users', 'machines', 'activity'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => handleExportCsv(detail.tenant.tenant_id, type)}
                className="flex-row items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"
              >
                <Download size={14} color="#4f46e5" />
                <Text className="text-sm text-indigo-600 font-medium capitalize">{type}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Users list */}
        <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            Users ({detail.users.length})
          </Text>
          {detail.users.map((u) => (
            <View
              key={u.user_id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                  <Text className="text-xs font-bold text-gray-600">
                    {u.full_name?.charAt(0) || u.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-900">{u.full_name || u.username}</Text>
                  <Text className="text-xs text-gray-500">{u.role}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                {u.last_login && (
                  <Text className="text-xs text-gray-400">
                    Last login: {new Date(u.last_login).toLocaleDateString()}
                  </Text>
                )}
                <View
                  className={`px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <Text
                    className={`text-xs font-medium ${u.is_active ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Login Activity */}
        {detail.login_activity && detail.login_activity.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Clock size={18} color="#4f46e5" />
              <Text className="text-base font-semibold text-gray-900">Login Activity (Last 30 Days)</Text>
            </View>
            {detail.login_activity.slice(0, 20).map((log) => (
              <View key={log.activity_id} className="flex-row items-center gap-3 py-2 border-b border-gray-50">
                <View className={`w-2 h-2 rounded-full ${
                  log.action === 'LOGIN' ? 'bg-green-500' :
                  log.action === 'LOGOUT' ? 'bg-gray-400' :
                  'bg-red-500'
                }`} />
                <View className="flex-1">
                  <Text className="text-sm text-gray-800">
                    <Text className="font-medium">{log.full_name || log.username}</Text>
                    {' — '}
                    <Text className={log.action.includes('FAIL') ? 'text-red-600' : 'text-gray-600'}>
                      {log.action.replace(/_/g, ' ')}
                    </Text>
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                    {log.ip_address ? ` · ${log.ip_address}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Errors */}
        {detail.recent_errors && detail.recent_errors.length > 0 && (
          <View className="bg-white rounded-xl border border-red-100 p-6 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <AlertTriangle size={18} color="#dc2626" />
              <Text className="text-base font-semibold text-gray-900">Recent Errors</Text>
              <View className="bg-red-100 px-2 py-0.5 rounded-full ml-auto">
                <Text className="text-xs font-semibold text-red-700">{detail.recent_errors.length}</Text>
              </View>
            </View>
            {detail.recent_errors.slice(0, 15).map((err) => (
              <View key={err.activity_id} className="py-2 border-b border-red-50">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-semibold text-red-600">{err.action}</Text>
                  <Text className="text-xs text-gray-400">{err.username}</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-0.5">{err.details}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  {new Date(err.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Feature Flags */}
        {detail.feature_flags && detail.feature_flags.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <ToggleLeft size={18} color="#4f46e5" />
              <Text className="text-base font-semibold text-gray-900">Feature Flags</Text>
            </View>
            {detail.feature_flags.map((flag, idx) => (
              <View key={idx} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                <Text className="text-sm text-gray-700 capitalize">{flag.flag_name?.replace(/_/g, ' ')}</Text>
                <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                  flag.is_enabled ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {flag.is_enabled
                    ? <ToggleRight size={14} color="#16a34a" />
                    : <ToggleLeft size={14} color="#6b7280" />}
                  <Text className={`text-xs font-medium ${flag.is_enabled ? 'text-green-700' : 'text-gray-500'}`}>
                    {flag.is_enabled ? 'ON' : 'OFF'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Usage metrics */}
        {detail.usage.length > 0 && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-4">Usage (Last 30 Days)</Text>
            {detail.usage.map((m, i) => (
              <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-sm text-gray-600 capitalize">
                  {m.metric_type.replace(/_/g, ' ')}
                </Text>
                <Text className="text-sm font-semibold text-gray-900">{m.total_value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Limits */}
        {detail.limits && (
          <View className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">Resource Limits</Text>
            <View className="flex-row flex-wrap gap-4">
              {[
                { label: 'Users', value: detail.limits.max_users },
                { label: 'Machines', value: detail.limits.max_machines },
                { label: 'Storage (MB)', value: detail.limits.max_storage_mb },
                { label: 'API Calls/Day', value: detail.limits.max_api_calls_day },
              ].map((item) => (
                <View key={item.label} className="bg-gray-50 rounded-lg p-3 min-w-[120px]">
                  <Text className="text-xs text-gray-500 mb-1">{item.label}</Text>
                  <Text className="text-lg font-bold text-gray-900">
                    {item.value === -1 ? '∞' : item.value?.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  /* ─── List view ──────── */
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Tenant Management</Text>
        <Text className="text-sm text-gray-500">
          {pagination.total} tenants total
        </Text>
      </View>

      {/* Search & Filters */}
      <View className="bg-white border-b border-gray-200 px-6 py-3">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={16} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900"
              placeholder="Search by company name or subdomain..."
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                setPage(1);
              }}
              placeholderTextColor="#9ca3af"
            />
            {search !== '' && (
              <Pressable onPress={() => setSearch('')}>
                <X size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                statusFilter === s ? 'bg-indigo-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  statusFilter === s ? 'text-white' : 'text-gray-600'
                }`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tenant List */}
      {tenantsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-500 mt-3">Loading tenants...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
        >
          {tenants
            .filter((t) => !t.is_platform_admin)
            .map((tenant) => (
              <View
                key={tenant.tenant_id}
                className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden"
              >
                {/* Row */}
                <Pressable
                  onPress={() =>
                    setExpandedRow(expandedRow === tenant.tenant_id ? null : tenant.tenant_id)
                  }
                  className="p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-10 h-10 bg-indigo-50 rounded-lg items-center justify-center">
                        <Building2 size={20} color="#4f46e5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {tenant.company_name}
                        </Text>
                        <Text className="text-xs text-gray-500">{tenant.subdomain}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <PlanBadge plan={tenant.plan} />
                      <StatusBadge status={tenant.status} />
                      {expandedRow === tenant.tenant_id ? (
                        <ChevronUp size={16} color="#9ca3af" />
                      ) : (
                        <ChevronDown size={16} color="#9ca3af" />
                      )}
                    </View>
                  </View>

                  {/* Quick stats row */}
                  <View className="flex-row gap-4 mt-3">
                    <View className="flex-row items-center gap-1">
                      <Users size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-500">
                        {tenant.user_count} users
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Cog size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-500">
                        {tenant.machine_count} machines
                      </Text>
                    </View>
                    {tenant.trial_ends_at && (
                      <Text className="text-xs text-blue-600">
                        Trial: {daysUntilTrialEnd(tenant.trial_ends_at)}d left
                      </Text>
                    )}
                    <Text className="text-xs text-gray-400 ml-auto">
                      Joined {new Date(tenant.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>

                {/* Expanded actions */}
                {expandedRow === tenant.tenant_id && (
                  <View className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setSelectedTenant(tenant.tenant_id)}
                      className="flex-row items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      <Eye size={14} color="#4f46e5" />
                      <Text className="text-sm text-indigo-600 font-medium">View Details</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openPlanModal(tenant)}
                      className="flex-row items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      <ArrowUpCircle size={14} color="#4f46e5" />
                      <Text className="text-sm text-indigo-600 font-medium">Change Plan</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openTrialModal(tenant)}
                      className="flex-row items-center gap-1.5 bg-white border border-blue-200 px-3 py-2 rounded-lg"
                    >
                      <Timer size={14} color="#2563eb" />
                      <Text className="text-sm text-blue-600 font-medium">Extend Trial</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openLimitsModal(tenant)}
                      className="flex-row items-center gap-1.5 bg-white border border-amber-200 px-3 py-2 rounded-lg"
                    >
                      <Edit3 size={14} color="#d97706" />
                      <Text className="text-sm text-amber-600 font-medium">Edit Limits</Text>
                    </Pressable>
                    {tenant.status === 'SUSPENDED' ? (
                      <Pressable
                        onPress={() => handleActivate(tenant)}
                        className="flex-row items-center gap-1.5 bg-green-600 px-3 py-2 rounded-lg"
                      >
                        <CheckCircle size={14} color="#fff" />
                        <Text className="text-sm text-white font-medium">Activate</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleSuspend(tenant)}
                        className="flex-row items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
                      >
                        <Ban size={14} color="#dc2626" />
                        <Text className="text-sm text-red-600 font-medium">Suspend</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}

          {tenants.filter((t) => !t.is_platform_admin).length === 0 && (
            <View className="items-center justify-center py-16">
              <Building2 size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-base">No tenants found</Text>
            </View>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <View className="flex-row items-center justify-center gap-4 py-4">
              <Pressable
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={`px-4 py-2 rounded-lg ${page <= 1 ? 'bg-gray-100' : 'bg-indigo-600'}`}
              >
                <Text className={`text-sm font-medium ${page <= 1 ? 'text-gray-400' : 'text-white'}`}>
                  Previous
                </Text>
              </Pressable>
              <Text className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </Text>
              <Pressable
                onPress={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className={`px-4 py-2 rounded-lg ${
                  page >= pagination.totalPages ? 'bg-gray-100' : 'bg-indigo-600'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    page >= pagination.totalPages ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Plan Change Modal */}
      <Modal visible={showPlanModal} transparent animationType="fade">
        <Pressable
          onPress={() => setShowPlanModal(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Pressable onPress={() => {}} className="bg-white rounded-2xl w-96 p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Change Plan</Text>
              <Pressable onPress={() => setShowPlanModal(false)}>
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            <Text className="text-sm text-gray-500 mb-4">
              {planTarget?.name} — Currently on{' '}
              <Text className="font-semibold">{planTarget?.current}</Text>
            </Text>

            <View className="gap-2 mb-6">
              {PLANS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setNewPlan(p)}
                  className={`flex-row items-center justify-between p-3 rounded-lg border ${
                    newPlan === p ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    {newPlan === p ? (
                      <View className="w-5 h-5 rounded-full border-2 border-indigo-600 items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-indigo-600" />
                      </View>
                    ) : (
                      <View className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        newPlan === p ? 'text-indigo-900' : 'text-gray-700'
                      }`}
                    >
                      {p}
                    </Text>
                  </View>
                  {p === planTarget?.current && (
                    <Text className="text-xs text-gray-400">Current</Text>
                  )}
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowPlanModal(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (planTarget && newPlan !== planTarget.current) {
                    changePlanMutation.mutate({ tenantId: planTarget.id, plan: newPlan });
                  }
                }}
                disabled={newPlan === planTarget?.current || changePlanMutation.isPending}
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  newPlan === planTarget?.current ? 'bg-gray-200' : 'bg-indigo-600'
                }`}
              >
                {changePlanMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    className={`text-sm font-medium ${
                      newPlan === planTarget?.current ? 'text-gray-400' : 'text-white'
                    }`}
                  >
                    {newPlan === planTarget?.current ? 'No Change' : 'Apply'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Trial Extension Modal */}
      <Modal
        visible={showTrialModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrialModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setShowTrialModal(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Timer size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Extend Trial</Text>
                <Text className="text-sm text-gray-500">{trialTarget?.name}</Text>
              </View>
            </View>

            {trialTarget?.currentEnd && (
              <View className="bg-gray-50 rounded-lg p-3 mb-4">
                <Text className="text-xs text-gray-500 mb-1">Current Trial Ends</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {new Date(trialTarget.currentEnd).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Text>
              </View>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-2">Quick Presets</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {TRIAL_PRESETS.map((preset) => (
                <Pressable
                  key={preset.days}
                  onPress={() => setTrialDays(String(preset.days))}
                  className={`px-4 py-2 rounded-lg border ${
                    trialDays === String(preset.days)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      trialDays === String(preset.days) ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">Custom Days</Text>
            <TextInput
              value={trialDays}
              onChangeText={setTrialDays}
              keyboardType="number-pad"
              placeholder="Enter number of days"
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-3"
            />

            <View className="bg-blue-50 rounded-lg p-3 mb-5">
              <Text className="text-xs text-blue-600 mb-1">New Trial End Date (approx.)</Text>
              <Text className="text-sm font-semibold text-blue-800">
                {(() => {
                  const base = trialTarget?.currentEnd
                    ? new Date(trialTarget.currentEnd)
                    : new Date();
                  const d = parseInt(trialDays) || 0;
                  const end = new Date(base.getTime() + d * 86400000);
                  return end.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  });
                })()}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowTrialModal(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (trialTarget) {
                    extendTrialMutation.mutate({
                      tenantId: trialTarget.id,
                      days: parseInt(trialDays) || 30,
                    });
                  }
                }}
                disabled={extendTrialMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 rounded-lg items-center"
              >
                {extendTrialMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-medium text-white">Extend Trial</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Limits Editing Modal */}
      <Modal
        visible={showLimitsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setShowLimitsModal(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                <Edit3 size={20} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Edit Resource Limits</Text>
                <Text className="text-sm text-gray-500">{limitsTarget?.name}</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Max Users</Text>
              <TextInput
                value={limitsForm.max_users}
                onChangeText={(v) => setLimitsForm((f) => ({ ...f, max_users: v }))}
                keyboardType="number-pad"
                placeholder="e.g. 50"
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Max Machines</Text>
              <TextInput
                value={limitsForm.max_machines}
                onChangeText={(v) => setLimitsForm((f) => ({ ...f, max_machines: v }))}
                keyboardType="number-pad"
                placeholder="e.g. 30"
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900"
              />
            </View>

            <View className="bg-amber-50 rounded-lg p-3 mb-5">
              <Text className="text-xs text-amber-700">
                Use -1 for unlimited. Changes apply immediately and override plan defaults.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowLimitsModal(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (limitsTarget) {
                    updateLimitsMutation.mutate({
                      tenantId: limitsTarget.id,
                      limits: {
                        max_users: parseInt(limitsForm.max_users) || 0,
                        max_machines: parseInt(limitsForm.max_machines) || 0,
                      },
                    });
                  }
                }}
                disabled={updateLimitsMutation.isPending}
                className="flex-1 py-2.5 bg-amber-500 rounded-lg items-center"
              >
                {updateLimitsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-medium text-white">Save Limits</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
