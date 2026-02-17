import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert as RNAlert } from 'react-native';
import { Users, ShieldCheck, ClipboardCheck, Wrench, Plus, Trash2, Key, Search, X, Pencil } from 'lucide-react-native';
import { fetchUsers, deleteUser, type User } from '../services/api';
import { Badge, Alert, Avatar, EmptyState, PageHeader } from '@zipybills/ui-components';
import { colors, machineStatusColors, useSemanticColors } from '@zipybills/theme-engine';

const ROLES = ['ADMIN', 'SUPERVISOR', 'OPERATOR'] as const;
type RoleFilter = 'ALL' | (typeof ROLES)[number];

const ROLE_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  ADMIN: ShieldCheck,
  SUPERVISOR: ClipboardCheck,
  OPERATOR: Wrench,
};

const ROLE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  ADMIN: 'info',
  SUPERVISOR: 'warning',
  OPERATOR: 'success',
};

const ROLE_COLORS: Record<string, { bg: string; bgDark: string; text: string; textDark: string; border: string; borderDark: string }> = {
  ALL:        { bg: 'bg-emerald-50',  bgDark: 'bg-emerald-900/20',  text: 'text-emerald-700',  textDark: 'text-emerald-400',  border: 'border-emerald-200',  borderDark: 'border-emerald-700' },
  ADMIN:      { bg: 'bg-blue-50',     bgDark: 'bg-blue-900/20',     text: 'text-blue-700',     textDark: 'text-blue-400',     border: 'border-blue-200',     borderDark: 'border-blue-700' },
  SUPERVISOR: { bg: 'bg-amber-50',    bgDark: 'bg-amber-900/20',    text: 'text-amber-700',    textDark: 'text-amber-400',    border: 'border-amber-200',    borderDark: 'border-amber-700' },
  OPERATOR:   { bg: 'bg-green-50',    bgDark: 'bg-green-900/20',    text: 'text-green-700',    textDark: 'text-green-400',    border: 'border-green-200',    borderDark: 'border-green-700' },
};

export interface UsersPageProps {
  /** Called when user taps "Add User" — navigate to /users/add */
  onAddUser?: () => void;
  /** Called when user taps "Edit" on a user card — navigate to /users/:id */
  onEditUser?: (userId: number) => void;
}

export function UsersPage({ onAddUser, onEditUser }: UsersPageProps = {}) {
  const sc = useSemanticColors();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setUsers(await fetchUsers());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Derived data ── */
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: users.length };
    for (const r of ROLES) counts[r] = 0;
    for (const u of users) {
      if (counts[u.role] !== undefined) counts[u.role]!++;
    }
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q),
      );
    }
    return result;
  }, [users, roleFilter, searchQuery]);

  const activeCount = users.filter((u) => u.is_active).length;

  const handleDelete = (u: User) => {
    RNAlert.alert(
      'Delete User',
      `Are you sure you want to delete "${u.full_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(u.user_id);
              loadData();
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : 'Failed to delete user');
            }
          },
        },
      ],
    );
  };

  /* ── Subtitle reflects active filters ── */
  const subtitleParts: string[] = [];
  if (roleFilter !== 'ALL') subtitleParts.push(`${filteredUsers.length} ${roleFilter.toLowerCase()}s`);
  else subtitleParts.push(`${activeCount} active of ${users.length} users`);
  if (searchQuery.trim()) subtitleParts.push(`matching "${searchQuery.trim()}"`);

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title="User Management"
        subtitle={subtitleParts.join(' · ')}
        actions={
          <Pressable
            onPress={onAddUser}
            className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center"
          >
            <Plus size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1">Add User</Text>
          </Pressable>
        }
      />

      {/* ── Filter Bar: Search + Role Chips ── */}
      <View className="mb-4 gap-3">
        {/* Search */}
        <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-0.5">
          <Search size={16} color={sc.iconMuted ?? '#9ca3af'} />
          <TextInput
            className="flex-1 ml-2 py-2.5 text-sm text-gray-900 dark:text-gray-100"
            placeholder="Search by name or username…"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {/* Role chips — horizontally scrollable on small screens */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <View className="flex-row gap-2">
            {(['ALL', ...ROLES] as RoleFilter[]).map((role) => {
              const isActive = roleFilter === role;
              const count = roleCounts[role] ?? 0;
              const palette = ROLE_COLORS[role] ?? ROLE_COLORS.ALL!;
              const RoleIcon = role === 'ALL' ? Users : (ROLE_ICON[role] ?? Wrench);
              const label = role === 'ALL' ? 'All Users' : role.charAt(0) + role.slice(1).toLowerCase() + 's';

              return (
                <Pressable
                  key={role}
                  onPress={() => setRoleFilter(role)}
                  className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
                    isActive
                      ? `${palette.bg} dark:${palette.bgDark} ${palette.border} dark:${palette.borderDark}`
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <RoleIcon
                    size={14}
                    color={isActive ? (role === 'ALL' ? colors.emerald[600] : role === 'ADMIN' ? '#2563eb' : role === 'SUPERVISOR' ? '#d97706' : '#16a34a') : '#9ca3af'}
                  />
                  <Text
                    className={`text-sm font-medium ml-1.5 ${
                      isActive
                        ? `${palette.text} dark:${palette.textDark}`
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </Text>
                  <View
                    className={`ml-1.5 min-w-[20px] h-5 rounded-full items-center justify-center px-1.5 ${
                      isActive
                        ? `${palette.bg} dark:${palette.bgDark}`
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? `${palette.text} dark:${palette.textDark}`
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {error && (
        <View className="mb-4">
          <Alert variant="error" message={error} onDismiss={() => setError(null)} />
        </View>
      )}

      {/* Users List */}
      {loading ? (
        <Text className="text-center text-gray-400 py-8">Loading users...</Text>
      ) : filteredUsers.length === 0 ? (
        <View className="items-center py-12">
          <Users size={40} color={sc.iconMuted} />
          <Text className="text-gray-500 dark:text-gray-400 font-medium mt-3">
            {users.length === 0
              ? 'No users found'
              : roleFilter !== 'ALL' && searchQuery.trim()
                ? `No ${roleFilter.toLowerCase()}s matching "${searchQuery.trim()}"`
                : roleFilter !== 'ALL'
                  ? `No ${roleFilter.toLowerCase()}s yet`
                  : `No users matching "${searchQuery.trim()}"`}
          </Text>
          {(roleFilter !== 'ALL' || searchQuery.trim()) && users.length > 0 && (
            <Pressable
              onPress={() => { setRoleFilter('ALL'); setSearchQuery(''); }}
              className="mt-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <Text className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clear filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          {/* Result count when filtered */}
          {(roleFilter !== 'ALL' || searchQuery.trim()) && (
            <View className="flex-row items-center justify-between mb-2 px-1">
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </Text>
              <Pressable
                onPress={() => { setRoleFilter('ALL'); setSearchQuery(''); }}
                hitSlop={8}
              >
                <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Clear filters</Text>
              </Pressable>
            </View>
          )}
          {filteredUsers.map((u) => (
          <View key={u.user_id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 mb-2 ${u.is_active ? 'border-gray-100 dark:border-gray-800' : 'border-gray-200 dark:border-gray-700 opacity-60'}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${u.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {(() => { const RoleIcon = ROLE_ICON[u.role] ?? Wrench; return <RoleIcon size={16} color={u.is_active ? colors.emerald[600] : sc.iconDefault} />; })()}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-gray-100">{u.full_name}</Text>
                  <Text className="text-xs text-gray-400">@{u.username}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Badge variant={ROLE_VARIANT[u.role] ?? 'default'}>{u.role}</Badge>
                <Pressable onPress={() => onEditUser?.(u.user_id)} className="bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg" hitSlop={4}>
                  <Key size={13} color="#d97706" />
                </Pressable>
                <Pressable onPress={() => onEditUser?.(u.user_id)} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex-row items-center gap-1" hitSlop={4}>
                  <Pencil size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-600 dark:text-gray-400">Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(u)} className="bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg" hitSlop={4}>
                  <Trash2 size={13} color="#dc2626" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        </>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
