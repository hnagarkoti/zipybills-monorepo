import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Factory, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { fetchPlans, createProductionLog, type ProductionPlan } from '../services/api';
import { fetchShifts, type Shift } from '@zipybills/factory-shifts-frontend';
import { Alert } from '@zipybills/ui-components';

const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return { label: `${h}:00 – ${String(i + 1).padStart(2, '0')}:00`, value: i };
});

export function OperatorInputPage() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ hour_slot: '', quantity_produced: '', quantity_ok: '', quantity_rejected: '', rejection_reason: '', notes: '' });

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, shiftsData] = await Promise.all([fetchPlans({ date: today }), fetchShifts()]);
      setPlans(plansData.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNED'));
      setShifts(shiftsData);
      setError(null);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to load data'); } finally { setLoading(false); }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const currentShift = shifts.find((s) => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh = 0, sm = 0] = s.start_time.split(':').map(Number);
    const [eh = 0, em = 0] = s.end_time.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start < end ? current >= start && current < end : current >= start || current < end;
  });

  const handleSubmit = async () => {
    if (!selectedPlan) { setError('Select a plan first'); return; }
    if (!form.hour_slot || !form.quantity_produced) { setError('Hour slot and quantity required'); return; }
    const qty = parseInt(form.quantity_produced, 10);
    const ok = form.quantity_ok ? parseInt(form.quantity_ok, 10) : qty;
    const rej = form.quantity_rejected ? parseInt(form.quantity_rejected, 10) : 0;
    if (ok + rej !== qty) { setError(`OK (${ok}) + Rejected (${rej}) must equal Produced (${qty})`); return; }
    try {
      setSubmitting(true); setError(null);
      await createProductionLog({
        plan_id: selectedPlan.plan_id, machine_id: selectedPlan.machine_id, shift_id: selectedPlan.shift_id,
        hour_slot: form.hour_slot, quantity_produced: qty, quantity_ok: ok, quantity_rejected: rej,
        rejection_reason: form.rejection_reason || undefined, notes: form.notes || undefined,
      });
      setSuccess(`Logged ${qty} units for hour ${form.hour_slot}:00`);
      setForm({ hour_slot: '', quantity_produced: '', quantity_ok: '', quantity_rejected: '', rejection_reason: '', notes: '' });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to submit'); } finally { setSubmitting(false); }
  };

  const handleQtyChange = (val: string) => {
    const qty = parseInt(val, 10) || 0;
    const rej = parseInt(form.quantity_rejected, 10) || 0;
    setForm({ ...form, quantity_produced: val, quantity_ok: String(Math.max(0, qty - rej)) });
  };

  const handleRejChange = (val: string) => {
    const qty = parseInt(form.quantity_produced, 10) || 0;
    const rej = parseInt(val, 10) || 0;
    setForm({ ...form, quantity_rejected: val, quantity_ok: String(Math.max(0, qty - rej)) });
  };

  return (
    <ScrollView className="flex-1 p-4">
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900">Operator Input</Text>
        <Text className="text-sm text-gray-500">Log hourly production data for {today}</Text>
        {currentShift && (
          <View className="mt-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            <Text className="text-xs text-green-600">Current shift: {currentShift.shift_name}</Text>
          </View>
        )}
      </View>

      {success && (<View className="mb-4"><Alert variant="success" message={success} /></View>)}
      {error && (<View className="mb-4"><Alert variant="error" message={error} onDismiss={() => setError(null)} /></View>)}

      <Text className="text-sm font-semibold text-gray-700 mb-2">Select Active Plan *</Text>
      {loading ? (<Text className="text-center text-gray-400 py-4">Loading plans...</Text>) : plans.length === 0 ? (
        <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 items-center">
          <AlertTriangle size={28} color="#d97706" />
          <Text className="text-sm text-amber-700 mt-2">No active plans for today</Text>
          <Text className="text-xs text-amber-500">Ask a supervisor to create a production plan</Text>
        </View>
      ) : (
        <View className="mb-4 gap-2">
          {plans.map((p) => {
            const isSelected = selectedPlan?.plan_id === p.plan_id;
            const pct = p.target_quantity > 0 ? Math.round(((Number(p.actual_quantity) || 0) / p.target_quantity) * 100) : 0;
            return (
              <Pressable key={p.plan_id} onPress={() => setSelectedPlan(p)} className={`rounded-xl border p-3 ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-800'}`}>{p.product_name}</Text>
                  <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                    {isSelected && <CheckCircle size={12} color="#ffffff" />}
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Factory size={11} color="#6b7280" /><Text className="text-xs text-gray-500 ml-1">{p.machine_name}</Text>
                  <Text className="text-xs text-gray-500 mx-1">·</Text>
                  <Clock size={11} color="#6b7280" /><Text className="text-xs text-gray-500 ml-1">{p.shift_name}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-600 mr-2">{p.actual_quantity || 0}/{p.target_quantity}</Text>
                  <View className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><View className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} /></View>
                  <Text className="text-xs text-gray-500 ml-2">{pct}%</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {selectedPlan && (
        <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Log Production Entry</Text>
          <Text className="text-xs text-gray-500 mb-1">Hour Slot *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-1.5">
              {HOUR_SLOTS.map((slot) => (
                <Pressable key={slot.value} onPress={() => setForm({ ...form, hour_slot: String(slot.value) })} className={`px-2.5 py-1.5 rounded-lg border ${form.hour_slot === String(slot.value) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                  <Text className={`text-xs ${form.hour_slot === String(slot.value) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>{slot.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">Produced *</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-center" value={form.quantity_produced} onChangeText={handleQtyChange} keyboardType="numeric" placeholder="0" /></View>
            <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">OK</Text><TextInput className="border border-green-300 bg-green-50 rounded-lg px-3 py-2.5 text-sm text-center text-green-700" value={form.quantity_ok} onChangeText={(t) => setForm({ ...form, quantity_ok: t })} keyboardType="numeric" placeholder="0" /></View>
            <View className="flex-1"><Text className="text-xs text-gray-500 mb-1">Rejected</Text><TextInput className="border border-red-300 bg-red-50 rounded-lg px-3 py-2.5 text-sm text-center text-red-700" value={form.quantity_rejected} onChangeText={handleRejChange} keyboardType="numeric" placeholder="0" /></View>
          </View>
          {parseInt(form.quantity_rejected, 10) > 0 && (<View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Rejection Reason</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.rejection_reason} onChangeText={(t) => setForm({ ...form, rejection_reason: t })} placeholder="e.g., Dimension out of tolerance" /></View>)}
          <View className="mb-3"><Text className="text-xs text-gray-500 mb-1">Notes (optional)</Text><TextInput className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} placeholder="Any remarks..." multiline /></View>
          <Pressable onPress={handleSubmit} disabled={submitting} className={`py-3 rounded-lg items-center ${submitting ? 'bg-gray-300' : 'bg-emerald-500'}`}>
            <Text className="text-white font-semibold">{submitting ? 'Submitting...' : 'Submit Entry'}</Text>
          </Pressable>
        </View>
      )}
      <View className="h-8" />
    </ScrollView>
  );
}
