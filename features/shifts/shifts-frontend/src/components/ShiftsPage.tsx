import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Clock, Plus, Sun, Moon, Sunrise, Sunset, RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { fetchShifts, createShift, updateShift, deleteShift, bulkCreateShifts, type Shift } from '../services/api';
import { StatusDot, PageHeader } from '@zipybills/ui-components';
import { colors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';

/* ─── Time Picker Component ──────────────────── */

function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [h, m] = (value || '00:00').split(':').map(Number);
  const hour = h ?? 0;
  const minute = m ?? 0;

  const pad = (n: number) => String(n).padStart(2, '0');

  const setHour = (newH: number) => {
    const wrapped = ((newH % 24) + 24) % 24;
    onChange(`${pad(wrapped)}:${pad(minute)}`);
  };

  const setMinute = (newM: number) => {
    const wrapped = ((newM % 60) + 60) % 60;
    onChange(`${pad(hour)}:${pad(wrapped)}`);
  };

  const HOUR_PRESETS = [0, 6, 8, 12, 14, 18, 22];

  return (
    <View>
      <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</Text>
      <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        {/* Clock spinner */}
        <View className="flex-row items-center justify-center gap-1 mb-2">
          <View className="items-center">
            <Pressable onPress={() => setHour(hour + 1)} className="w-14 h-7 items-center justify-center bg-white dark:bg-gray-700 rounded-t-lg border border-gray-200 dark:border-gray-600">
              <ChevronUp size={14} color="#6b7280" />
            </Pressable>
            <View className="w-14 h-11 items-center justify-center bg-white dark:bg-gray-700 border-x border-gray-200 dark:border-gray-600">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pad(hour)}</Text>
            </View>
            <Pressable onPress={() => setHour(hour - 1)} className="w-14 h-7 items-center justify-center bg-white dark:bg-gray-700 rounded-b-lg border border-gray-200 dark:border-gray-600">
              <ChevronDown size={14} color="#6b7280" />
            </Pressable>
          </View>
          <Text className="text-2xl font-bold text-gray-400 dark:text-gray-500 mx-0.5">:</Text>
          <View className="items-center">
            <Pressable onPress={() => setMinute(minute + 15)} className="w-14 h-7 items-center justify-center bg-white dark:bg-gray-700 rounded-t-lg border border-gray-200 dark:border-gray-600">
              <ChevronUp size={14} color="#6b7280" />
            </Pressable>
            <View className="w-14 h-11 items-center justify-center bg-white dark:bg-gray-700 border-x border-gray-200 dark:border-gray-600">
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pad(minute)}</Text>
            </View>
            <Pressable onPress={() => setMinute(minute - 15)} className="w-14 h-7 items-center justify-center bg-white dark:bg-gray-700 rounded-b-lg border border-gray-200 dark:border-gray-600">
              <ChevronDown size={14} color="#6b7280" />
            </Pressable>
          </View>
        </View>
        {/* Quick presets */}
        <View className="flex-row flex-wrap gap-1 justify-center">
          {HOUR_PRESETS.map((ph) => (
            <Pressable key={ph} onPress={() => onChange(`${pad(ph)}:00`)} className={`px-2 py-1 rounded-md ${hour === ph && minute === 0 ? 'bg-emerald-500' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}>
              <Text className={`text-[10px] font-medium ${hour === ph && minute === 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{pad(ph)}:00</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ─── Shift Form Modal ───────────────────────── */

interface ShiftFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (form: { shift_name: string; start_time: string; end_time: string; is_active: boolean }) => Promise<void>;
  initialData?: { shift_name: string; start_time: string; end_time: string; is_active: boolean };
  isEditing: boolean;
}

function ShiftFormModal({ visible, onClose, onSave, initialData, isEditing }: ShiftFormModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState(initialData ?? { shift_name: '', start_time: '06:00', end_time: '14:00', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };

  useEffect(() => {
    if (visible) {
      setForm(initialData ?? { shift_name: '', start_time: '06:00', end_time: '14:00', is_active: true });
      setError(null);
    }
  }, [visible, initialData]);

  const PRESETS = [
    { label: 'Morning', icon: '☀️', start: '06:00', end: '14:00' },
    { label: 'Afternoon', icon: '🌤️', start: '14:00', end: '22:00' },
    { label: 'Night', icon: '🌙', start: '22:00', end: '06:00' },
  ];

  const handleSave = async () => {
    if (!form.shift_name.trim()) { showError(t('shifts.shiftNameRequired')); return; }
    if (!form.start_time || !form.end_time) { showError(t('shifts.timesRequired')); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('shifts.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
          {/* Header */}
          <View className="bg-emerald-500 px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Clock size={20} color="#fff" />
              <Text className="text-white font-bold text-lg ml-2">{isEditing ? t('shifts.editShift') : t('shifts.newShift')}</Text>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <X size={20} color="#d1fae5" />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} className="p-5" style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
            {error && (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            )}

            {/* Quick Presets */}
            {!isEditing && (
              <View className="mb-5">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('shifts.quickPresets')}</Text>
                <View className="flex-row gap-2">
                  {PRESETS.map((p) => (
                    <Pressable key={p.label} onPress={() => setForm({ ...form, shift_name: p.label, start_time: p.start, end_time: p.end })}
                      className={`flex-1 p-3 rounded-xl border-2 items-center ${form.shift_name === p.label ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <Text className="text-lg mb-0.5">{p.icon}</Text>
                      <Text className={`text-xs font-semibold ${form.shift_name === p.label ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>{p.label}</Text>
                      <Text className="text-[10px] text-gray-400 mt-0.5">{p.start}–{p.end}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Shift Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('shifts.shiftName')} *</Text>
              <TextInput className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100" value={form.shift_name} onChangeText={(t) => setForm({ ...form, shift_name: t })} placeholder="e.g., Morning" placeholderTextColor="#9ca3af" />
            </View>

            {/* Time Pickers */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <TimePicker label="START TIME *" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
              </View>
              <View className="flex-1">
                <TimePicker label="END TIME *" value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
              </View>
            </View>

            {/* Active Toggle */}
            <Pressable onPress={() => setForm({ ...form, is_active: !form.is_active })} className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-200 dark:border-gray-700">
              <View className={`w-12 h-7 rounded-full justify-center px-0.5 ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <View className={`w-6 h-6 bg-white rounded-full shadow ${form.is_active ? 'self-end' : 'self-start'}`} />
              </View>
              <Text className="text-sm text-gray-700 dark:text-gray-300 font-medium ml-3">{form.is_active ? t('common.active') : t('common.inactive')}</Text>
            </Pressable>

            {/* Preview */}
            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <Text className="text-xs text-gray-400 mb-1">{t('common.preview')}</Text>
              <View className="flex-row items-center gap-2">
                <View className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{form.shift_name || t('common.untitled')}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">{form.start_time || '--:--'} → {form.end_time || '--:--'}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
            <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl items-center ${saving ? 'bg-emerald-400' : 'bg-emerald-500'}`}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEditing ? t('shifts.updateShift') : t('shifts.createShift')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Delete Confirmation Modal ──────────────── */

function DeleteConfirmModal({ visible, shiftName, onConfirm, onCancel }: { visible: boolean; shiftName: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">{t('shifts.deleteShift')}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">{t('shifts.deleteConfirm')} "{shiftName}"? {t('shifts.cannotUndone')}</Text>
          <View className="flex-row gap-3">
            <Pressable onPress={onCancel} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} className="flex-1 bg-red-500 py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">{t('common.delete')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main Shifts Page ───────────────────────── */

export function ShiftsPage() {
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate, guard } = useCompliance();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<2 | 3 | null>(null);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setShifts(await fetchShifts());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('shifts.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (form: { shift_name: string; start_time: string; end_time: string; is_active: boolean }) => {
    const mutationType = editingShift ? 'edit' as const : 'create' as const;
    await guardedMutate(mutationType, async () => {
      if (editingShift) {
        await updateShift(editingShift.shift_id, form);
      } else {
        await createShift(form);
      }
      setShowFormModal(false);
      setEditingShift(null);
      loadData();
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guardedMutate('delete', async () => {
      try {
        await deleteShift(deleteTarget.shift_id);
        setDeleteTarget(null);
        loadData();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('shifts.failedToDelete'));
        setDeleteTarget(null);
      }
    });
  };

  const handleBulkCreate = async (count: 2 | 3) => {
    await guardedMutate('create', async () => {
      try {
        setBulkLoading(count);
        setError(null);
        await bulkCreateShifts(count);
        await loadData();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('shifts.failedToCreateShifts'));
      } finally {
        setBulkLoading(null);
      }
    });
  };

  return (
    <ScrollView className="flex-1 p-4">
      <PageHeader
        title={t('shifts.shiftManagement')}
        subtitle={`${shifts.length} ${t('shifts.shiftsConfigured')}`}
        actions={
          <Pressable onPress={() => { setEditingShift(null); setShowFormModal(true); }} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Plus size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1">{t('shifts.addShift')}</Text>
          </Pressable>
        }
      />

      {error && (
        <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mb-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {shifts.length === 0 ? t('shifts.couldNotLoad') : t('shifts.somethingWrong')}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400 mt-1">{error}</Text>
              {shifts.length === 0 && (
                <Text className="text-xs text-amber-500 dark:text-amber-400/70 mt-1">{t('shifts.canStillSetup')}</Text>
              )}
            </View>
            <View className="flex-row gap-2">
              <Pressable onPress={loadData} className="bg-amber-100 dark:bg-amber-800/40 px-3 py-1.5 rounded-lg flex-row items-center">
                <RefreshCw size={12} color={colors.amber[700]} />
                <Text className="text-xs font-medium text-amber-700 dark:text-amber-400 ml-1">{t('common.retry')}</Text>
              </Pressable>
              <Pressable onPress={() => setError(null)} className="bg-amber-100 dark:bg-amber-800/40 px-3 py-1.5 rounded-lg">
                <Text className="text-xs font-medium text-amber-700 dark:text-amber-400">{t('common.dismiss')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <Text className="text-center text-gray-400 py-8">{t('shifts.loadingShifts')}</Text>
      ) : shifts.length === 0 ? (
        <View className="py-4">
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
            <View className="items-center mb-5">
              <View className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mb-3">
                <Clock size={28} color={colors.emerald[500]} />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('shifts.setupShifts')}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">{t('shifts.setupShiftsDesc')}</Text>
            </View>

            {/* 2-Shift */}
            <Pressable onPress={() => handleBulkCreate(2)} disabled={bulkLoading !== null}
              className={`border-2 rounded-xl p-4 mb-3 ${bulkLoading === 2 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="flex-row mr-3">
                    <View className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center"><Sun size={18} color={colors.amber[500]} /></View>
                    <View className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center -ml-2"><Moon size={18} color={colors.violet[500]} /></View>
                  </View>
                  <View className="flex-1"><Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('shifts.twoShifts')}</Text><Text className="text-xs text-gray-500 dark:text-gray-400">{t('shifts.twoShiftsDesc')}</Text></View>
                </View>
                {bulkLoading === 2 ? <ActivityIndicator size="small" color={colors.emerald[500]} /> : <View className="bg-emerald-500 px-4 py-2 rounded-lg"><Text className="text-white text-sm font-medium">{t('common.create')}</Text></View>}
              </View>
            </Pressable>

            {/* 3-Shift */}
            <Pressable onPress={() => handleBulkCreate(3)} disabled={bulkLoading !== null}
              className={`border-2 rounded-xl p-4 ${bulkLoading === 3 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="flex-row mr-3">
                    <View className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/40 items-center justify-center"><Sunrise size={18} color={colors.orange[500]} /></View>
                    <View className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center -ml-2"><Sun size={18} color={colors.amber[500]} /></View>
                    <View className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center -ml-2"><Moon size={18} color={colors.violet[500]} /></View>
                  </View>
                  <View className="flex-1"><Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('shifts.threeShifts')}</Text><Text className="text-xs text-gray-500 dark:text-gray-400">{t('shifts.threeShiftsDesc')}</Text></View>
                </View>
                {bulkLoading === 3 ? <ActivityIndicator size="small" color={colors.emerald[500]} /> : <View className="bg-emerald-500 px-4 py-2 rounded-lg"><Text className="text-white text-sm font-medium">{t('common.create')}</Text></View>}
              </View>
            </Pressable>
          </View>
          <Text className="text-center text-xs text-gray-400 dark:text-gray-500">{t('shifts.orCustomShifts')}</Text>
        </View>
      ) : (
        <View>
          {/* 24-Hour Coverage bar */}
          <View className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t('shifts.coverage24h')}</Text>
            <View className="h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex-row">
              {shifts.filter((s) => s.is_active).map((s, idx) => {
                const sh = Number(s.start_time.split(':')[0]) || 0;
                const eh = Number(s.end_time.split(':')[0]) || 0;
                const end = eh <= sh ? eh + 24 : eh;
                const width = ((end - sh) / 24) * 100;
                const left = (sh / 24) * 100;
                const barColors = ['bg-blue-400', 'bg-emerald-400', 'bg-indigo-400', 'bg-amber-400'];
                return (
                  <View key={s.shift_id} className={`h-full ${barColors[idx % barColors.length]} items-center justify-center`} style={{ width: `${width}%`, marginLeft: idx === 0 ? `${left}%` : 0 }}>
                    <Text className="text-[10px] text-white font-medium">{s.shift_name}</Text>
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-1">
              {[0, 6, 12, 18, 24].map((hv) => (
                <Text key={hv} className="text-[10px] text-gray-400">{String(hv % 24).padStart(2, '0')}:00</Text>
              ))}
            </View>
          </View>

          {/* Shifts list */}
          {shifts.map((s) => (
            <View key={s.shift_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <StatusDot color={s.is_active ? 'green' : 'gray'} size="sm" />
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 ml-2">{s.shift_name}</Text>
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => { setEditingShift(s); setShowFormModal(true); }} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-gray-600 dark:text-gray-400">{t('common.edit')}</Text>
                  </Pressable>
                  <Pressable onPress={() => setDeleteTarget(s)} className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-red-600">{t('common.delete')}</Text>
                  </Pressable>
                </View>
              </View>
              <View className="flex-row items-center">
                <Clock size={12} color={sc.iconDefault} />
                <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">{s.start_time} → {s.end_time}</Text>
              </View>
              <Text className={`text-xs mt-1 ${s.is_active ? 'text-green-600' : 'text-gray-400'}`}>{s.is_active ? t('common.active') : t('common.inactive')}</Text>
            </View>
          ))}
        </View>
      )}
      <View className="h-8" />

      {/* Shift Form Modal */}
      <ShiftFormModal
        visible={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingShift(null); }}
        onSave={handleSave}
        initialData={editingShift ? { shift_name: editingShift.shift_name, start_time: editingShift.start_time, end_time: editingShift.end_time, is_active: editingShift.is_active } : undefined}
        isEditing={!!editingShift}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        shiftName={deleteTarget?.shift_name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
  );
}
