import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Clock, Plus } from 'lucide-react-native';
import { fetchShifts, createShift, updateShift, deleteShift, type Shift } from '../services/api';
import { Alert, EmptyState, StatusDot, PageHeader } from '@zipybills/ui-components';

export function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ shift_name: '', start_time: '', end_time: '', is_active: true });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setShifts(await fetchShifts());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setForm({ shift_name: '', start_time: '', end_time: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s: Shift) => {
    setForm({ shift_name: s.shift_name, start_time: s.start_time, end_time: s.end_time, is_active: s.is_active });
    setEditingId(s.shift_id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.shift_name || !form.start_time || !form.end_time) {
      setError('All fields required');
      return;
    }
    try {
      if (editingId) { await updateShift(editingId, form); } else { await createShift(form); }
      resetForm();
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    try { await deleteShift(id); loadData(); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const TIME_PRESETS = [
    { label: 'Morning (6–14)', start: '06:00', end: '14:00' },
    { label: 'Afternoon (14–22)', start: '14:00', end: '22:00' },
    { label: 'Night (22–06)', start: '22:00', end: '06:00' },
  ];

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title="Shift Management"
        subtitle={`${shifts.length} shifts configured`}
        actions={
          <Pressable onPress={() => { resetForm(); setShowForm(!showForm); }} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Plus size={14} color="#fff" />
            <Text className="text-white font-medium text-sm ml-1">Add Shift</Text>
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
          <Text className="text-lg font-semibold mb-3">{editingId ? 'Edit Shift' : 'New Shift'}</Text>
          {!editingId && (
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">Quick presets</Text>
              <View className="flex-row flex-wrap gap-2">
                {TIME_PRESETS.map((p) => (
                  <Pressable key={p.label} onPress={() => setForm({ ...form, shift_name: p.label.split(' (')[0] ?? p.label, start_time: p.start, end_time: p.end })} className="bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-gray-600">{p.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Shift Name *</Text>
            <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.shift_name} onChangeText={(t) => setForm({ ...form, shift_name: t })} placeholder="e.g., Morning" />
          </View>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Start Time * (HH:MM)</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.start_time} onChangeText={(t) => setForm({ ...form, start_time: t })} placeholder="06:00" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">End Time * (HH:MM)</Text>
              <TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.end_time} onChangeText={(t) => setForm({ ...form, end_time: t })} placeholder="14:00" />
            </View>
          </View>
          <Pressable onPress={() => setForm({ ...form, is_active: !form.is_active })} className="flex-row items-center mb-4">
            <View className={`w-10 h-6 rounded-full justify-center ${form.is_active ? 'bg-emerald-500 items-end' : 'bg-gray-300 items-start'}`}>
              <View className="w-5 h-5 bg-white rounded-full m-0.5" />
            </View>
            <Text className="text-sm text-gray-700 ml-2">{form.is_active ? 'Active' : 'Inactive'}</Text>
          </Pressable>
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
        <Text className="text-center text-gray-400 py-8">Loading shifts...</Text>
      ) : shifts.length === 0 ? (
        <EmptyState
          icon={<Clock size={40} color="#9ca3af" />}
          title="No shifts configured"
          description="Add your first shift to get started"
        />
      ) : (
        <View>
          {/* 24-Hour Coverage bar */}
          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-600 mb-3">24-Hour Coverage</Text>
            <View className="h-8 bg-gray-100 rounded-full overflow-hidden flex-row">
              {shifts.filter((s) => s.is_active).map((s, idx) => {
                const sh = Number(s.start_time.split(':')[0]) || 0;
                const eh = Number(s.end_time.split(':')[0]) || 0;
                const end = eh <= sh ? eh + 24 : eh;
                const width = ((end - sh) / 24) * 100;
                const left = (sh / 24) * 100;
                const colors = ['bg-blue-400', 'bg-emerald-400', 'bg-indigo-400', 'bg-amber-400'];
                return (
                  <View key={s.shift_id} className={`h-full ${colors[idx % colors.length]} items-center justify-center`} style={{ width: `${width}%`, marginLeft: idx === 0 ? `${left}%` : 0 }}>
                    <Text className="text-[10px] text-white font-medium">{s.shift_name}</Text>
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-1">
              {[0, 6, 12, 18, 24].map((h) => (
                <Text key={h} className="text-[10px] text-gray-400">{String(h % 24).padStart(2, '0')}:00</Text>
              ))}
            </View>
          </View>

          {/* Shifts list */}
          {shifts.map((s) => (
            <View key={s.shift_id} className="bg-white rounded-xl border border-gray-100 p-4 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <StatusDot color={s.is_active ? 'green' : 'gray'} size="sm" />
                  <Text className="text-base font-semibold text-gray-900 ml-2">{s.shift_name}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => startEdit(s)} className="bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-gray-600">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(s.shift_id)} className="bg-red-50 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-red-600">Delete</Text>
                  </Pressable>
                </View>
              </View>
              <View className="flex-row items-center">
                <Clock size={12} color="#6b7280" />
                <Text className="text-sm text-gray-500 ml-1">{s.start_time} → {s.end_time}</Text>
              </View>
              <Text className={`text-xs mt-1 ${s.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                {s.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
