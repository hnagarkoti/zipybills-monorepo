import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Factory, FolderOpen, Settings, Plus, Search, X, Eye } from 'lucide-react-native';
import { fetchMachines, createMachine, updateMachine, deleteMachine, type Machine } from '../services/api';
import { Badge, Alert, EmptyState, PageHeader } from '@zipybills/ui-components';
import { useRouter } from 'expo-router';

export function MachinesPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ machine_code: '', machine_name: '', department: '', machine_type: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMachines();
      setMachines(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMachines(); }, [loadMachines]);

  const resetForm = () => {
    setForm({ machine_code: '', machine_name: '', department: '', machine_type: '' });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (m: Machine) => {
    setForm({ machine_code: m.machine_code, machine_name: m.machine_name, department: m.department ?? '', machine_type: m.machine_type ?? '' });
    setEditingId(m.machine_id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.machine_code.trim() || !form.machine_name.trim()) {
      setError('Machine code and name are required');
      return;
    }
    try {
      if (editingId) {
        await updateMachine(editingId, { machine_name: form.machine_name, department: form.department, machine_type: form.machine_type });
      } else {
        await createMachine(form);
      }
      resetForm();
      setSuccess(editingId ? 'Machine updated successfully' : 'Machine created successfully');
      loadMachines();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMachine(id);
      setSuccess('Machine deleted');
      setDeleteConfirm(null);
      loadMachines();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchSearch = !search || m.machine_name.toLowerCase().includes(search.toLowerCase()) || m.machine_code.toLowerCase().includes(search.toLowerCase()) || (m.department?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [machines, search, statusFilter]);

  const counts = useMemo(() => ({
    active: machines.filter((m) => m.status === 'ACTIVE').length,
    inactive: machines.filter((m) => m.status === 'INACTIVE').length,
    maintenance: machines.filter((m) => m.status === 'MAINTENANCE').length,
  }), [machines]);

  const handleStatusToggle = async (m: Machine) => {
    const next = m.status === 'ACTIVE' ? 'INACTIVE' : m.status === 'INACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    await updateMachine(m.machine_id, { status: next });
    loadMachines();
  };

  const statusVariant = (s: string) =>
    s === 'ACTIVE' ? 'success' as const : s === 'MAINTENANCE' ? 'warning' as const : 'error' as const;

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title="Machines"
        subtitle={`${machines.length} machines configured`}
        actions={
          <Pressable onPress={() => { resetForm(); setShowForm(true); }} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Plus size={14} color="#fff" />
            <Text className="text-white font-medium text-sm ml-1">Add Machine</Text>
          </Pressable>
        }
      />

      {/* Status Summary Cards */}
      {machines.length > 0 && (
        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={() => setStatusFilter('ALL')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'ALL' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-100'}`}>
            <Text className="text-xs text-gray-500">Total</Text>
            <Text className="text-2xl font-bold text-gray-900">{machines.length}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('ACTIVE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'ACTIVE' ? 'bg-green-50 border-green-300' : 'bg-white border-gray-100'}`}>
            <Text className="text-xs text-green-600">Active</Text>
            <Text className="text-2xl font-bold text-green-700">{counts.active}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('MAINTENANCE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'MAINTENANCE' ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-100'}`}>
            <Text className="text-xs text-yellow-600">Maintenance</Text>
            <Text className="text-2xl font-bold text-yellow-700">{counts.maintenance}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('INACTIVE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'INACTIVE' ? 'bg-red-50 border-red-300' : 'bg-white border-gray-100'}`}>
            <Text className="text-xs text-red-600">Inactive</Text>
            <Text className="text-2xl font-bold text-red-700">{counts.inactive}</Text>
          </Pressable>
        </View>
      )}

      {/* Search Bar */}
      {machines.length > 0 && (
        <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4">
          <Search size={14} color="#9ca3af" />
          <TextInput
            className="flex-1 text-sm ml-2"
            value={search}
            onChangeText={setSearch}
            placeholder="Search machines..."
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={14} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      )}

      {success && (<View className="mb-4"><Alert variant="success" message={success} onDismiss={() => setSuccess(null)} /></View>)}
      {error && (
        <View className="mb-4">
          <Alert variant="error" message={error} onDismiss={() => setError(null)} />
        </View>
      )}

      {showForm && (
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">{editingId ? 'Edit Machine' : 'Add New Machine'}</Text>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Machine Code *</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.machine_code} onChangeText={(t) => setForm({ ...form, machine_code: t })} placeholder="e.g., CNC-001" editable={!editingId} />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Machine Name *</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.machine_name} onChangeText={(t) => setForm({ ...form, machine_name: t })} placeholder="e.g., CNC Lathe #1" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Department</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.department} onChangeText={(t) => setForm({ ...form, department: t })} placeholder="e.g., Assembly" />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Machine Type</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.machine_type} onChangeText={(t) => setForm({ ...form, machine_type: t })} placeholder="e.g., CNC, Press, Drill" />
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={handleSave} className="bg-emerald-500 px-6 py-2.5 rounded-lg flex-1 items-center">
              <Text className="text-white font-medium">{editingId ? 'Update' : 'Create'}</Text>
            </Pressable>
            <Pressable onPress={resetForm} className="bg-gray-200 px-6 py-2.5 rounded-lg">
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {loading ? (
        <View className="items-center py-12">
          <Text className="text-center text-gray-400">Loading machines...</Text>
        </View>
      ) : machines.length === 0 ? (
        <EmptyState
          icon={<Factory size={40} color="#9ca3af" />}
          title="No machines configured yet"
          description="Add your first machine to get started"
        />
      ) : filteredMachines.length === 0 ? (
        <EmptyState
          icon={<Search size={40} color="#9ca3af" />}
          title="No machines match"
          description="Try a different search or filter"
        />
      ) : (
        <View>
          <Text className="text-xs text-gray-400 mb-2">{filteredMachines.length} machine{filteredMachines.length !== 1 ? 's' : ''}</Text>
          {filteredMachines.map((m) => {
            const borderColor = m.status === 'ACTIVE' ? 'border-l-green-400' : m.status === 'MAINTENANCE' ? 'border-l-yellow-400' : 'border-l-red-400';
            return (
              <View key={m.machine_id} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} p-4 mb-3 shadow-sm`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-gray-50 rounded-lg p-2 mr-3">
                      <Factory size={18} color="#6b7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">{m.machine_name}</Text>
                      <Text className="text-xs text-gray-400 font-mono">{m.machine_code}</Text>
                    </View>
                  </View>
                  <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                </View>
                <View className="flex-row items-center mb-3">
                  {m.department && (
                    <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1 mr-2">
                      <FolderOpen size={11} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-1">{m.department}</Text>
                    </View>
                  )}
                  {m.machine_type && (
                    <View className="flex-row items-center bg-gray-50 rounded-md px-2 py-1">
                      <Settings size={11} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-1">{m.machine_type}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-2 pt-2 border-t border-gray-50">
                  <Pressable onPress={() => router.push(`/machines/${m.machine_id}`)} className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex-row items-center">
                    <Eye size={11} color="#059669" />
                    <Text className="text-xs text-emerald-700 font-medium ml-1">View</Text>
                  </Pressable>
                  <Pressable onPress={() => startEdit(m)} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-blue-700 font-medium">✎ Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleStatusToggle(m)} className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-yellow-700 font-medium">⟳ Toggle Status</Text>
                  </Pressable>
                  {deleteConfirm === m.machine_id ? (
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => handleDelete(m.machine_id)} className="bg-red-500 px-3 py-1.5 rounded-lg">
                        <Text className="text-xs text-white font-medium">Confirm</Text>
                      </Pressable>
                      <Pressable onPress={() => setDeleteConfirm(null)} className="bg-gray-200 px-3 py-1.5 rounded-lg">
                        <Text className="text-xs text-gray-600 font-medium">Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setDeleteConfirm(m.machine_id)} className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                      <Text className="text-xs text-red-700 font-medium">✕ Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
