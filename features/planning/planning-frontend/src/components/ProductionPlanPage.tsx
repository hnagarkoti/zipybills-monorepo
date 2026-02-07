import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { fetchPlans, createPlan, updatePlanStatus, type ProductionPlan } from '../services/api';
import { fetchMachines, type Machine } from '@zipybills/factory-machines-frontend';
import { fetchShifts, type Shift } from '@zipybills/factory-shifts-frontend';

function PlanStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <View className={`px-2 py-0.5 rounded-full ${styles[status] || styles.PLANNED}`}>
      <Text className="text-xs font-medium">{status.replace('_', ' ')}</Text>
    </View>
  );
}

export function ProductionPlanPage() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [form, setForm] = useState({ machine_id: '', shift_id: '', product_name: '', product_code: '', target_quantity: '' });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, machinesData, shiftsData] = await Promise.all([
        fetchPlans({ date: selectedDate }), fetchMachines(), fetchShifts(),
      ]);
      setPlans(plansData);
      setMachines(machinesData.filter((m) => m.status === 'ACTIVE'));
      setShifts(shiftsData.filter((s) => s.is_active));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!form.machine_id || !form.shift_id || !form.product_name || !form.target_quantity) { setError('All fields required'); return; }
    try {
      await createPlan({
        machine_id: parseInt(form.machine_id, 10), shift_id: parseInt(form.shift_id, 10),
        plan_date: selectedDate, product_name: form.product_name, product_code: form.product_code,
        target_quantity: parseInt(form.target_quantity, 10),
      });
      setShowForm(false);
      setForm({ machine_id: '', shift_id: '', product_name: '', product_code: '', target_quantity: '' });
      loadData();
    } catch (err: any) { setError(err.message || 'Failed to create plan'); }
  };

  const handleStatusChange = async (planId: number, status: string) => {
    try { await updatePlanStatus(planId, status); loadData(); } catch (err: any) { setError(err.message); }
  };

  const totalTarget = plans.reduce((s, p) => s + p.target_quantity, 0);
  const totalProduced = plans.reduce((s, p) => s + (Number(p.actual_quantity) || 0), 0);

  return (
    <ScrollView className="flex-1 p-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xl font-bold text-gray-900">Production Planning</Text>
          <Text className="text-sm text-gray-500">{plans.length} plans for {selectedDate}</Text>
        </View>
        <Pressable onPress={() => setShowForm(!showForm)} className="bg-emerald-500 px-4 py-2.5 rounded-lg">
          <Text className="text-white font-medium text-sm">+ New Plan</Text>
        </Pressable>
      </View>

      {/* Date Selector */}
      <View className="flex-row mb-4 gap-2">
        <Pressable onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0] ?? ''); }} className="bg-gray-200 px-3 py-2 rounded-lg">
          <Text className="text-sm text-gray-700">← Prev</Text>
        </Pressable>
        <View className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 items-center">
          <Text className="text-sm font-medium text-gray-900">{selectedDate}</Text>
        </View>
        <Pressable onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0] ?? ''); }} className="bg-gray-200 px-3 py-2 rounded-lg">
          <Text className="text-sm text-gray-700">Next →</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedDate(new Date().toISOString().split('T')[0] ?? '')} className="bg-blue-50 px-3 py-2 rounded-lg">
          <Text className="text-sm text-blue-600 font-medium">Today</Text>
        </Pressable>
      </View>

      {/* Summary */}
      {plans.length > 0 && (
        <View className="flex-row mb-4 gap-2">
          <View className="flex-1 bg-blue-50 rounded-xl p-3"><Text className="text-xs text-blue-500">Target</Text><Text className="text-xl font-bold text-blue-700">{totalTarget}</Text></View>
          <View className="flex-1 bg-green-50 rounded-xl p-3"><Text className="text-xs text-green-500">Produced</Text><Text className="text-xl font-bold text-green-700">{totalProduced}</Text></View>
          <View className="flex-1 bg-purple-50 rounded-xl p-3"><Text className="text-xs text-purple-500">Efficiency</Text><Text className="text-xl font-bold text-purple-700">{totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0}%</Text></View>
        </View>
      )}

      {error && (<View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><Text className="text-sm text-red-700">{error}</Text></View>)}

      {/* Create Plan Form */}
      {showForm && (
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Create Plan for {selectedDate}</Text>
          <Text className="text-xs text-gray-500 mb-1">Machine *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {machines.map((m) => (
              <Pressable key={m.machine_id} onPress={() => setForm({ ...form, machine_id: String(m.machine_id) })} className={`px-3 py-2 rounded-lg border ${form.machine_id === String(m.machine_id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                <Text className={`text-sm ${form.machine_id === String(m.machine_id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>{m.machine_name}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mb-1">Shift *</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {shifts.map((s) => (
              <Pressable key={s.shift_id} onPress={() => setForm({ ...form, shift_id: String(s.shift_id) })} className={`px-3 py-2 rounded-lg border ${form.shift_id === String(s.shift_id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                <Text className={`text-sm ${form.shift_id === String(s.shift_id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>{s.shift_name} ({s.start_time}–{s.end_time})</Text>
              </Pressable>
            ))}
          </View>
          <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Product Name *</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.product_name} onChangeText={(t) => setForm({ ...form, product_name: t })} placeholder="e.g., Gear Shaft A-200" /></View>
          <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Product Code</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.product_code} onChangeText={(t) => setForm({ ...form, product_code: t })} placeholder="e.g., GS-A200" /></View>
          <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Target Quantity *</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.target_quantity} onChangeText={(t) => setForm({ ...form, target_quantity: t })} placeholder="e.g., 500" keyboardType="numeric" /></View>
          <View className="flex-row gap-2">
            <Pressable onPress={handleCreate} className="bg-emerald-500 px-6 py-2.5 rounded-lg flex-1 items-center"><Text className="text-white font-medium">Create Plan</Text></Pressable>
            <Pressable onPress={() => setShowForm(false)} className="bg-gray-200 px-6 py-2.5 rounded-lg"><Text className="text-gray-700 font-medium">Cancel</Text></Pressable>
          </View>
        </View>
      )}

      {/* Plans List */}
      {loading ? (<Text className="text-center text-gray-400 py-8">Loading plans...</Text>) : plans.length === 0 ? (
        <View className="items-center py-12"><Text className="text-4xl mb-3">📋</Text><Text className="text-lg text-gray-500">No plans for this date</Text><Text className="text-sm text-gray-400 mt-1">Create a production plan to get started</Text></View>
      ) : (
        plans.map((p) => {
          const pct = p.target_quantity > 0 ? Math.round(((Number(p.actual_quantity) || 0) / p.target_quantity) * 100) : 0;
          return (
            <View key={p.plan_id} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1"><Text className="text-base font-bold text-gray-900">{p.product_name}</Text>{p.product_code && <Text className="text-xs text-gray-400">{p.product_code}</Text>}</View>
                <PlanStatusBadge status={p.status} />
              </View>
              <View className="flex-row mb-2"><Text className="text-xs text-gray-500 mr-3">🏭 {p.machine_name}</Text><Text className="text-xs text-gray-500">⏰ {p.shift_name}</Text></View>
              <View className="flex-row items-center mb-2">
                <Text className="text-sm text-gray-700 mr-2">{p.actual_quantity || 0} / {p.target_quantity}</Text>
                <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><View className={`h-full rounded-full ${pct >= 90 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></View>
                <Text className="text-xs text-gray-500 ml-2">{pct}%</Text>
              </View>
              {(p.actual_rejected ?? 0) > 0 && <Text className="text-xs text-red-500 mb-2">⚠ {p.actual_rejected} rejected</Text>}
              {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                <View className="flex-row gap-2 pt-2 border-t border-gray-50">
                  {p.status === 'PLANNED' && <Pressable onPress={() => handleStatusChange(p.plan_id, 'IN_PROGRESS')} className="bg-yellow-50 px-3 py-1.5 rounded-lg"><Text className="text-xs text-yellow-600 font-medium">Start</Text></Pressable>}
                  <Pressable onPress={() => handleStatusChange(p.plan_id, 'COMPLETED')} className="bg-green-50 px-3 py-1.5 rounded-lg"><Text className="text-xs text-green-600 font-medium">Complete</Text></Pressable>
                  <Pressable onPress={() => handleStatusChange(p.plan_id, 'CANCELLED')} className="bg-red-50 px-3 py-1.5 rounded-lg"><Text className="text-xs text-red-600 font-medium">Cancel</Text></Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
