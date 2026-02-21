/**
 * Platform Users – Cross-tenant user management
 *
 * LAYER 1: Platform Admin can:
 * - View all users across every tenant
 * - Search by username / full name / company
 * - Filter by tenant, role, and status
 * - Reset password, disable/enable, force logout
 * - View user activity history
 */
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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  Search,
  Filter,
  Users,
  Shield,
  Ban,
  CheckCircle,
  Key,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  AlertTriangle,
  Building2,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────────── */
interface PlatformUser {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  tenant_id: number;
  company_name: string;
  tenant_plan: string;
  tenant_status: string;
  last_login: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserActivity {
  activity_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string | null;
  created_at: string;
}

/* ─── Constants ──────────────────────────── */
const ROLES = ['ALL', 'ADMIN', 'SUPERVISOR', 'OPERATOR'] as const;
const STATUS_OPTIONS = ['ALL', 'active', 'inactive'] as const;

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  SUPERVISOR: 'bg-blue-100 text-blue-700',
  OPERATOR: 'bg-gray-100 text-gray-700',
};

const planColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PROFESSIONAL: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-800',
};

/* ─── Badge Components ───────────────────── */
function RoleBadge({ role }: { role: string }) {
  const cls = roleColors[role] ?? 'bg-gray-100 text-gray-600';
  return (
    <View className={`self-start px-2 py-0.5 rounded-full ${cls.split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${cls.split(' ')[1]}`}>{role}</Text>
    </View>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cls = planColors[plan] ?? 'bg-gray-100 text-gray-600';
  return (
    <View className={`self-start px-2 py-0.5 rounded-full ${cls.split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${cls.split(' ')[1]}`}>{plan}</Text>
    </View>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <View className="flex-row items-center gap-1">
      <View className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-400'}`} />
      <Text className={`text-xs ${active ? 'text-green-700' : 'text-red-500'}`}>
        {active ? 'Active' : 'Disabled'}
      </Text>
    </View>
  );
}

/* ─── Stat Card ──────────────────────────── */
function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <View className={`flex-1 min-w-[140px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className={`w-8 h-8 rounded-lg items-center justify-center ${color}`}>{icon}</View>
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </View>
  );
}

/* ─── Action Icon Button (with tooltip) ──── */
function ActionIconButton({
  onPress,
  tooltip,
  bgColor,
  icon,
  disabled,
}: {
  onPress: () => void;
  tooltip: string;
  bgColor: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <View className="relative">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityLabel={tooltip}
        accessibilityRole="button"
        className={`p-2 rounded-lg ${bgColor} ${disabled ? 'opacity-40' : ''}`}
        {...(Platform.OS === 'web' ? { title: tooltip } : {})}
      >
        {icon}
      </Pressable>
      {/* Web hover tooltip */}
      {Platform.OS === 'web' && hovered && (
        <View className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded z-50" style={{ minWidth: 80 }}>
          <Text className="text-xs text-white text-center" numberOfLines={1}>{tooltip}</Text>
        </View>
      )}
    </View>
  );
}

/* ─── Confirm Modal (replaces Alert.alert for web) ── */
function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  isPending,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-5">{message}</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 items-center"
            >
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              className={`flex-1 py-2.5 rounded-lg items-center ${confirmColor ?? 'bg-red-600'}`}
            >
              <Text className="text-sm font-medium text-white">
                {isPending ? 'Processing…' : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main Component ─────────────────────── */
export default function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [resetModal, setResetModal] = useState<PlatformUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [activityModal, setActivityModal] = useState<number | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<PlatformUser | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState<PlatformUser | null>(null);

  /* ─── Data query ─────── */
  const usersQuery = useQuery({
    queryKey: ['platform-users', page, search, roleFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      return apiFetch(`/api/super-admin/users?${params}`);
    },
  });

  const activityQuery = useQuery({
    queryKey: ['platform-user-activity', activityModal],
    queryFn: () => apiFetch(`/api/super-admin/users/${activityModal}/activity`),
    enabled: !!activityModal,
  });

  /* ─── Mutations ─────── */
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, is_active }: { userId: number; is_active: boolean }) =>
      apiFetch(`/api/super-admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setToggleConfirm(null);
      Alert.alert('Success', `User ${vars.is_active ? 'enabled' : 'disabled'} successfully.`);
    },
    onError: () => { setToggleConfirm(null); Alert.alert('Error', 'Failed to update user status.'); },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, new_password }: { userId: number; new_password: string }) =>
      apiFetch(`/api/super-admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password }),
      }),
    onSuccess: () => {
      setResetModal(null);
      setNewPassword('');
      Alert.alert('Success', 'Password has been reset.');
    },
    onError: () => Alert.alert('Error', 'Failed to reset password.'),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/api/super-admin/users/${userId}/force-logout`, {
        method: 'POST',
      }),
    onSuccess: () => { setLogoutConfirm(null); Alert.alert('Success', 'Force logout has been recorded.'); },
    onError: () => { setLogoutConfirm(null); Alert.alert('Error', 'Failed to force logout.'); },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    setRefreshing(false);
  }, [queryClient]);

  const users: PlatformUser[] = usersQuery.data?.users ?? [];
  const pagination: Pagination = usersQuery.data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  // Summary stats
  const totalUsers = pagination.total;
  const activeUsers = users.filter((u) => u.is_active).length;
  const disabledUsers = users.filter((u) => !u.is_active).length;
  const uniqueTenants = new Set(users.map((u) => u.tenant_id)).size;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  /* ─── Render ─────────────────────────────── */
  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">User Management</Text>
          <Text className="text-sm text-gray-500 mt-1">
            View and manage all users across every tenant on the platform
          </Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={<Users size={16} color="#6366f1" />}
            color="bg-indigo-50"
          />
          <StatCard
            label="Active (this page)"
            value={activeUsers}
            icon={<UserCheck size={16} color="#16a34a" />}
            color="bg-green-50"
          />
          <StatCard
            label="Disabled (this page)"
            value={disabledUsers}
            icon={<UserX size={16} color="#dc2626" />}
            color="bg-red-50"
          />
          <StatCard
            label="Tenants (this page)"
            value={uniqueTenants}
            icon={<Building2 size={16} color="#0ea5e9" />}
            color="bg-sky-50"
          />
        </View>

        {/* Search & Filters */}
        <View className="flex-row flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <View className="flex-row items-center flex-1 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Search size={16} color="#9ca3af" />
            <TextInput
              placeholder="Search users, tenants..."
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
              className="flex-1 ml-2 text-sm text-gray-800 dark:text-gray-200"
              placeholderTextColor="#9ca3af"
            />
            {search ? (
              <Pressable onPress={() => { setSearch(''); setPage(1); }}>
                <X size={14} color="#9ca3af" />
              </Pressable>
            ) : null}
          </View>

          {/* Role filter */}
          <View className="flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => { setRoleFilter(r); setPage(1); }}
                className={`px-3 py-2 ${roleFilter === r ? 'bg-indigo-500' : ''}`}
              >
                <Text className={`text-xs font-medium ${roleFilter === r ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Status filter */}
          <View className="flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {STATUS_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 ${statusFilter === s ? 'bg-indigo-500' : ''}`}
              >
                <Text className={`text-xs font-medium ${statusFilter === s ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {s === 'ALL' ? 'All Status' : s === 'active' ? 'Active' : 'Disabled'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Loading */}
        {usersQuery.isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-gray-500 mt-3">Loading users…</Text>
          </View>
        )}

        {/* Error */}
        {usersQuery.isError && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-6 items-center">
            <AlertTriangle size={32} color="#dc2626" />
            <Text className="text-red-700 font-medium mt-2">Failed to load users</Text>
            <Pressable
              onPress={() => usersQuery.refetch()}
              className="mt-3 bg-red-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Users Table */}
        {usersQuery.isSuccess && (
          <View className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <View className="flex-row px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Text className="flex-[2] text-xs font-semibold text-gray-500 uppercase">User</Text>
              <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase hidden md:flex">Role</Text>
              <Text className="flex-[1.5] text-xs font-semibold text-gray-500 uppercase hidden md:flex">Tenant</Text>
              <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase hidden lg:flex">Last Login</Text>
              <Text className="flex-1 text-xs font-semibold text-gray-500 uppercase hidden md:flex">Status</Text>
              <Text className="flex-[1.5] text-xs font-semibold text-gray-500 uppercase text-right">Actions</Text>
            </View>

            {/* Empty state */}
            {users.length === 0 && (
              <View className="py-12 items-center">
                <Users size={40} color="#d1d5db" />
                <Text className="text-gray-400 mt-3">No users found</Text>
              </View>
            )}

            {/* User Rows */}
            {users.map((user) => (
              <View
                key={user.user_id}
                className="flex-row items-center px-4 py-3 border-b border-gray-50 dark:border-gray-700/50"
              >
                {/* User Info */}
                <View className="flex-[2]">
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name}
                  </Text>
                  <Text className="text-xs text-gray-500">{user.username}</Text>
                  {/* Mobile: show role + tenant inline */}
                  <View className="flex-row items-center gap-2 mt-1 md:hidden">
                    <RoleBadge role={user.role} />
                    <Text className="text-xs text-gray-400">{user.company_name}</Text>
                  </View>
                </View>

                {/* Role */}
                <View className="flex-1 hidden md:flex">
                  <RoleBadge role={user.role} />
                </View>

                {/* Tenant */}
                <View className="flex-[1.5] hidden md:flex">
                  <Text className="text-sm text-gray-800 dark:text-gray-200" numberOfLines={1}>{user.company_name}</Text>
                  <PlanBadge plan={user.tenant_plan} />
                </View>

                {/* Last Login */}
                <View className="flex-1 hidden lg:flex">
                  <Text className="text-xs text-gray-500">{formatDateTime(user.last_login)}</Text>
                </View>

                {/* Status */}
                <View className="flex-1 hidden md:flex">
                  <StatusDot active={user.is_active} />
                </View>

                {/* Actions */}
                <View className="flex-[1.5] flex-row items-center justify-end gap-1">
                  {/* View activity */}
                  <ActionIconButton
                    onPress={() => setActivityModal(user.user_id)}
                    tooltip="View Activity"
                    bgColor="bg-gray-100 dark:bg-gray-700"
                    icon={<Eye size={14} color="#6366f1" />}
                  />

                  {/* Reset password */}
                  <ActionIconButton
                    onPress={() => { setResetModal(user); setNewPassword(''); }}
                    tooltip="Reset Password"
                    bgColor="bg-amber-50 dark:bg-amber-900/30"
                    icon={<Key size={14} color="#d97706" />}
                  />

                  {/* Toggle active */}
                  <ActionIconButton
                    onPress={() => setToggleConfirm(user)}
                    tooltip={user.is_active ? 'Disable User' : 'Enable User'}
                    bgColor={user.is_active ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}
                    icon={user.is_active
                      ? <Ban size={14} color="#dc2626" />
                      : <CheckCircle size={14} color="#16a34a" />}
                  />

                  {/* Force logout */}
                  <ActionIconButton
                    onPress={() => setLogoutConfirm(user)}
                    tooltip="Force Logout"
                    bgColor="bg-orange-50 dark:bg-orange-900/30"
                    icon={<LogOut size={14} color="#ea580c" />}
                  />
                </View>
              </View>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <Text className="text-xs text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-lg ${page === 1 ? 'opacity-30' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <ChevronLeft size={16} color="#6b7280" />
                  </Pressable>
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {page} / {pagination.totalPages}
                  </Text>
                  <Pressable
                    onPress={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className={`p-2 rounded-lg ${page === pagination.totalPages ? 'opacity-30' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <ChevronRight size={16} color="#6b7280" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ─── Toggle Status Confirm Modal ──── */}
      <ConfirmModal
        visible={!!toggleConfirm}
        title={toggleConfirm?.is_active ? 'Disable User' : 'Enable User'}
        message={toggleConfirm ? `${toggleConfirm.is_active ? 'Disable' : 'Enable'} ${toggleConfirm.full_name} (${toggleConfirm.company_name})?` : ''}
        confirmLabel="Confirm"
        confirmColor={toggleConfirm?.is_active ? 'bg-red-600' : 'bg-green-600'}
        onConfirm={() => {
          if (toggleConfirm) {
            toggleStatusMutation.mutate({
              userId: toggleConfirm.user_id,
              is_active: !toggleConfirm.is_active,
            });
          }
        }}
        onCancel={() => setToggleConfirm(null)}
        isPending={toggleStatusMutation.isPending}
      />

      {/* ─── Force Logout Confirm Modal ────── */}
      <ConfirmModal
        visible={!!logoutConfirm}
        title="Force Logout"
        message={logoutConfirm ? `Force ${logoutConfirm.full_name} to re-authenticate?` : ''}
        confirmLabel="Force Logout"
        confirmColor="bg-orange-600"
        onConfirm={() => {
          if (logoutConfirm) {
            forceLogoutMutation.mutate(logoutConfirm.user_id);
          }
        }}
        onCancel={() => setLogoutConfirm(null)}
        isPending={forceLogoutMutation.isPending}
      />

      {/* ─── Reset Password Modal ───────────── */}
      <Modal
        visible={!!resetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">Reset Password</Text>
              <Pressable onPress={() => setResetModal(null)}>
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            {resetModal && (
              <>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  User: <Text className="font-semibold">{resetModal.full_name}</Text>
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tenant: <Text className="font-semibold">{resetModal.company_name}</Text>
                </Text>

                <Text className="text-xs font-medium text-gray-500 mb-1 uppercase">New Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 mb-4"
                  placeholder="Enter new password (min 6 chars)"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  returnKeyType="done"
                />

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setResetModal(null)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 items-center"
                  >
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (!newPassword || newPassword.length < 6) {
                        Alert.alert('Error', 'Password must be at least 6 characters');
                        return;
                      }
                      resetPasswordMutation.mutate({
                        userId: resetModal.user_id,
                        new_password: newPassword,
                      });
                    }}
                    disabled={resetPasswordMutation.isPending}
                    className="flex-1 py-2.5 rounded-lg bg-amber-500 items-center"
                  >
                    <Text className="text-sm font-medium text-white">
                      {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset Password'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── User Activity Modal ────────────── */}
      <Modal
        visible={!!activityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActivityModal(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">User Activity</Text>
              <Pressable onPress={() => setActivityModal(null)}>
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            {activityQuery.isLoading && (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            )}

            {activityQuery.isSuccess && activityQuery.data && (
              <>
                {/* User info header */}
                <View className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    {activityQuery.data.user?.full_name}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {activityQuery.data.user?.username} · {activityQuery.data.user?.company_name} · {activityQuery.data.user?.role}
                  </Text>
                </View>

                {/* Activity list */}
                <ScrollView className="max-h-[400px]">
                  {(activityQuery.data.activity as UserActivity[]).length === 0 && (
                    <Text className="text-gray-400 text-center py-6">No activity recorded</Text>
                  )}
                  {(activityQuery.data.activity as UserActivity[]).map((a) => (
                    <View
                      key={a.activity_id}
                      className="flex-row items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <View className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center mt-0.5">
                        <Clock size={14} color="#6366f1" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {a.action}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">{a.details}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(a.created_at)}
                          {a.ip_address ? ` · ${a.ip_address}` : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
