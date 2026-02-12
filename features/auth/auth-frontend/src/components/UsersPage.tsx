import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Users, ShieldCheck, ClipboardCheck, Wrench, Plus } from 'lucide-react-native';
import { fetchUsers, createUser, updateUser, type User } from '../services/api';
import { Badge, Alert, Avatar, EmptyState, PageHeader } from '@zipybills/ui-components';
import { colors, machineStatusColors, useSemanticColors } from '@zipybills/theme-engine';

const ROLES = ['ADMIN', 'SUPERVISOR', 'OPERATOR'] as const;

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

export function UsersPage() {
  const sc = useSemanticColors();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', role: 'OPERATOR' as 'ADMIN' | 'SUPERVISOR' | 'OPERATOR', is_active: true,
  });

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

  const resetForm = () => {
    setForm({ username: '', password: '', full_name: '', role: 'OPERATOR', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (u: User) => {
    setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role, is_active: u.is_active });
    setEditingId(u.user_id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.full_name) { setError('Username and full name required'); return; }
    if (!editingId && !form.password) { setError('Password required for new user'); return; }
    try {
      if (editingId) {
        const payload: Record<string, unknown> = { username: form.username, full_name: form.full_name, role: form.role, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await updateUser(editingId, payload);
      } else {
        await createUser(form);
      }
      resetForm();
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title="User Management"
        subtitle={`${activeCount} active of ${users.length} users`}
        actions={
          <Pressable
            onPress={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center"
          >
            <Plus size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1">Add User</Text>
          </Pressable>
        }
      />

      {/* Role Summary */}
      <View className="flex-row gap-2 mb-4">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role && u.is_active).length;
          return (
            <View key={role} className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 items-center">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{count}</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{role}S</Text>
            </View>
          );
        })}
      </View>

      {error && (
        <View className="mb-4">
          <Alert variant="error" message={error} onDismiss={() => setError(null)} />
        </View>
      )}

      {/* Form */}
      {showForm && (
        <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <Text className="text-lg font-semibold mb-3 dark:text-gray-100">{editingId ? 'Edit User' : 'New User'}</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Username *</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
              value={form.username}
              onChangeText={(t) => setForm({ ...form, username: t })}
              placeholder="username"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{editingId ? 'New Password (leave blank to keep)' : 'Password *'}</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
              placeholder={editingId ? '(unchanged)' : 'password'}
              secureTextEntry
            />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name *</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-800 dark:text-gray-100"
              value={form.full_name}
              onChangeText={(t) => setForm({ ...form, full_name: t })}
              placeholder="Full Name"
            />
          </View>

          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Role *</Text>
          <View className="flex-row gap-2 mb-3">
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setForm({ ...form, role: r })}
                className={`px-4 py-2 rounded-lg border ${form.role === r ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <Text className={`text-sm ${form.role === r ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setForm({ ...form, is_active: !form.is_active })}
            className="flex-row items-center mb-4"
          >
            <View className={`w-10 h-6 rounded-full justify-center ${form.is_active ? 'bg-emerald-500 items-end' : 'bg-gray-300 dark:bg-gray-600 items-start'}`}>
              <View className="w-5 h-5 bg-white dark:bg-gray-200 rounded-full m-0.5" />
            </View>
            <Text className="text-sm text-gray-700 dark:text-gray-300 ml-2">{form.is_active ? 'Active' : 'Inactive'}</Text>
          </Pressable>

          <View className="flex-row gap-2">
            <Pressable onPress={handleSave} className="bg-emerald-500 px-6 py-2.5 rounded-lg flex-1 items-center">
              <Text className="text-white font-medium">{editingId ? 'Update' : 'Create'}</Text>
            </Pressable>
            <Pressable onPress={resetForm} className="bg-gray-200 dark:bg-gray-700 px-6 py-2.5 rounded-lg">
              <Text className="text-gray-700 dark:text-gray-300 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Users List */}
      {loading ? (
        <Text className="text-center text-gray-400 py-8">Loading users...</Text>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users size={40} color={sc.iconMuted} />} title="No users found" />
      ) : (
        users.map((u) => (
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
                <Pressable onPress={() => startEdit(u)} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                  <Text className="text-xs text-gray-600 dark:text-gray-400">Edit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
