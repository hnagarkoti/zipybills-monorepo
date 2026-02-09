import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Factory, FolderOpen, Settings, Plus } from 'lucide-react-native';
import { fetchMachines, createMachine, updateMachine, deleteMachine, type Machine } from '../services/api';
import { Badge, Alert, EmptyState, PageHeader } from '@zipybills/ui-components';

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ machine_code: '', machine_name: '', department: '', machine_type: '' });
  const [error, setError] = useState<string | null>(null);

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
      loadMachines();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMachine(id);
      loadMachines();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

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
        <Text className="text-center text-gray-400 py-8">Loading machines...</Text>
      ) : machines.length === 0 ? (
        <EmptyState
          icon={<Factory size={40} color="#9ca3af" />}
          title="No machines configured yet"
          description="Add your first machine to get started"
        />
      ) : (
        machines.map((m) => (
          <View key={m.machine_id} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-gray-900 mr-2">{m.machine_name}</Text>
                <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
              </View>
              <Text className="text-sm text-gray-400 font-mono">{m.machine_code}</Text>
            </View>
            <View className="flex-row items-center">
              {m.department && (
                <View className="flex-row items-center mr-3">
                  <FolderOpen size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-500 ml-1">{m.department}</Text>
                </View>
              )}
              {m.machine_type && (
                <View className="flex-row items-center">
                  <Settings size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-500 ml-1">{m.machine_type}</Text>
                </View>
              )}
            </View>
            <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-50">
              <Pressable onPress={() => startEdit(m)} className="bg-blue-50 px-3 py-1.5 rounded-lg">
                <Text className="text-xs text-blue-600 font-medium">Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleStatusToggle(m)} className="bg-yellow-50 px-3 py-1.5 rounded-lg">
                <Text className="text-xs text-yellow-600 font-medium">Toggle Status</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(m.machine_id)} className="bg-red-50 px-3 py-1.5 rounded-lg">
                <Text className="text-xs text-red-600 font-medium">Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
