import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Factory, FolderOpen, Settings, Plus, Search, X, Eye, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { fetchMachines, createMachine, updateMachine, deleteMachine, type Machine } from '../services/api';
import { Badge, PageHeader } from '@zipybills/ui-components';
import { colors, machineStatusColors, useSemanticColors } from '@zipybills/theme-engine';
import { useCompliance } from '@zipybills/ui-store';
import { useRouter } from 'expo-router';
import { useLocale } from '@zipybills/i18n-engine';

/* ─── Machine Form Modal ─────────────────────── */

interface MachineFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (form: { machine_code: string; machine_name: string; department: string; machine_type: string }) => Promise<void>;
  initialData?: { machine_code: string; machine_name: string; department: string; machine_type: string };
  isEditing: boolean;
}

const MACHINE_TYPE_PRESETS = [
  { label: 'CNC', icon: '⚙️' },
  { label: 'Lathe', icon: '🔩' },
  { label: 'Press', icon: '🔨' },
  { label: 'Drill', icon: '🔧' },
  { label: 'Assembly', icon: '🏭' },
  { label: 'Welding', icon: '🔥' },
];

const DEPARTMENT_PRESETS = ['Production', 'Assembly', 'Machining', 'Finishing', 'Quality'];

function MachineFormModal({ visible, onClose, onSave, initialData, isEditing }: MachineFormModalProps) {
  const { t } = useLocale();
  const [form, setForm] = useState(initialData ?? { machine_code: '', machine_name: '', department: '', machine_type: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const showError = (msg: string) => {
    setError(msg);
    // Scroll to top so the error is visible
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };

  useEffect(() => {
    if (visible) {
      setForm(initialData ?? { machine_code: '', machine_name: '', department: '', machine_type: '' });
      setError(null);
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!form.machine_code.trim()) { showError(t('machines.machineCodeRequired')); return; }
    if (!form.machine_name.trim()) { showError(t('machines.machineNameRequired')); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('machines.failedToSave'));
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
          <View className="bg-blue-500 px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Factory size={20} color="#fff" />
              <Text className="text-white font-bold text-lg ml-2">{isEditing ? t('machines.editMachine') : t('machines.newMachine')}</Text>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <X size={20} color="#dbeafe" />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} className="p-5" style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
            {error && (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            )}

            {/* Machine Type Presets */}
            {!isEditing && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('machines.quickType')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {MACHINE_TYPE_PRESETS.map((p) => (
                    <Pressable key={p.label} onPress={() => setForm({ ...form, machine_type: p.label })}
                      className={`px-3 py-2 rounded-xl border-2 flex-row items-center ${form.machine_type === p.label ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                      <Text className="text-sm mr-1">{p.icon}</Text>
                      <Text className={`text-xs font-semibold ${form.machine_type === p.label ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Machine Code */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('machines.machineCode')} *</Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100 ${isEditing ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-300 dark:border-gray-600'}`}
                value={form.machine_code}
                onChangeText={(t) => setForm({ ...form, machine_code: t })}
                placeholder="e.g., CNC-001"
                placeholderTextColor="#9ca3af"
                editable={!isEditing}
              />
              {isEditing && <Text className="text-[10px] text-gray-400 mt-1">{t('machines.codeCannotChange')}</Text>}
            </View>

            {/* Machine Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('machines.machineName')} *</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                value={form.machine_name}
                onChangeText={(t) => setForm({ ...form, machine_name: t })}
                placeholder="e.g., CNC Lathe #1"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Department */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('machines.department')}</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                value={form.department}
                onChangeText={(t) => setForm({ ...form, department: t })}
                placeholder="e.g., Assembly"
                placeholderTextColor="#9ca3af"
              />
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {DEPARTMENT_PRESETS.map((d) => (
                  <Pressable key={d} onPress={() => setForm({ ...form, department: d })}
                    className={`px-2.5 py-1 rounded-lg ${form.department === d ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text className={`text-[10px] font-medium ${form.department === d ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Machine Type (if not set via preset) */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('machines.machineType')}</Text>
              <TextInput
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:bg-gray-800 dark:text-gray-100"
                value={form.machine_type}
                onChangeText={(t) => setForm({ ...form, machine_type: t })}
                placeholder="e.g., CNC, Press, Drill"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Preview */}
            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <Text className="text-xs text-gray-400 mb-1">{t('common.preview')}</Text>
              <View className="flex-row items-center gap-2">
                <Factory size={14} color="#6b7280" />
                <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">{form.machine_name || t('common.untitled')}</Text>
                <Text className="text-xs text-gray-400 font-mono">{form.machine_code || '---'}</Text>
              </View>
              {(form.department || form.machine_type) && (
                <View className="flex-row gap-2 mt-1">
                  {form.department ? <Text className="text-[10px] text-gray-400">📁 {form.department}</Text> : null}
                  {form.machine_type ? <Text className="text-[10px] text-gray-400">⚙️ {form.machine_type}</Text> : null}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-row gap-3">
            <Pressable onPress={onClose} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center">
              <Text className="text-gray-600 dark:text-gray-400 font-semibold">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl items-center ${saving ? 'bg-blue-400' : 'bg-blue-500'}`}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">{isEditing ? t('machines.updateMachine') : t('machines.createMachine')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Delete Confirmation Modal ──────────────── */

function MachineDeleteModal({ visible, machineName, onConfirm, onCancel }: { visible: boolean; machineName: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLocale();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-xl">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">{t('machines.deleteMachine')}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">{t('machines.deleteConfirm')} "{machineName}"? {t('machines.cannotUndone')}</Text>
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

/* ─── Toast Component ────────────────────────── */

interface ToastState {
  message: string;
  type: 'success' | 'error';
  id: number;
}

function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: 'success' | 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);
    setToast({ message, type, id: Date.now() });
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 3500);
  }, [slideAnim, opacityAnim]);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [slideAnim, opacityAnim]);

  const ToastView = useCallback(() => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
      <Animated.View
        style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim, position: 'absolute', top: 8, left: 16, right: 16, zIndex: 9999 }}
        className={`rounded-xl p-3.5 shadow-lg flex-row items-center ${isSuccess ? 'bg-emerald-600' : 'bg-red-600'}`}
      >
        {isSuccess ? <CheckCircle2 size={18} color="#fff" /> : <AlertTriangle size={18} color="#fff" />}
        <Text className="text-white font-medium text-sm ml-2.5 flex-1">{toast.message}</Text>
        <Pressable onPress={dismiss} className="ml-2 p-1">
          <X size={16} color="#ffffffcc" />
        </Pressable>
      </Animated.View>
    );
  }, [toast, slideAnim, opacityAnim, dismiss]);

  return { show, ToastView };
}

/* ─── Main Machines Page ─────────────────────── */

export function MachinesPage() {
  const router = useRouter();
  const sc = useSemanticColors();
  const { t } = useLocale();
  const { guardedMutate, guard } = useCompliance();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast
  const { show: showToast, ToastView } = useToast();

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMachines();
      setMachines(data);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('machines.failedToLoad'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadMachines(); }, [loadMachines]);

  const handleSave = async (form: { machine_code: string; machine_name: string; department: string; machine_type: string }) => {
    const mutationType = editingMachine ? 'edit' as const : 'create' as const;
    await guardedMutate(mutationType, async () => {
      if (editingMachine) {
        await updateMachine(editingMachine.machine_id, { machine_name: form.machine_name, department: form.department, machine_type: form.machine_type });
      } else {
        await createMachine(form);
      }
      setShowFormModal(false);
      setEditingMachine(null);
      showToast(editingMachine ? t('machines.machineUpdated') : t('machines.machineCreated'), 'success');
      loadMachines();
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guardedMutate('delete', async () => {
      try {
        await deleteMachine(deleteTarget.machine_id);
        showToast(t('machines.machineDeleted'), 'success');
        setDeleteTarget(null);
        loadMachines();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : t('machines.failedToDelete'), 'error');
        setDeleteTarget(null);
      }
    });
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
    <View className="flex-1">
      <ToastView />
      <ScrollView className="flex-1 p-4">
      <PageHeader
        title={t('machines.title')}
        subtitle={`${machines.length} ${t('machines.machinesConfigured')}`}
        actions={
          <Pressable onPress={() => { setEditingMachine(null); setShowFormModal(true); }} className="bg-emerald-500 px-4 py-2.5 rounded-lg flex-row items-center">
            <Plus size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1">{t('machines.addMachine')}</Text>
          </Pressable>
        }
      />

      {/* Status Summary Cards */}
      {machines.length > 0 && (
        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={() => setStatusFilter('ALL')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'ALL' ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <Text className="text-xs text-gray-500 dark:text-gray-400">{t('common.total')}</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">{machines.length}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('ACTIVE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'ACTIVE' ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <Text className="text-xs text-green-600">{t('common.active')}</Text>
            <Text className="text-2xl font-bold text-green-700">{counts.active}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('MAINTENANCE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'MAINTENANCE' ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <Text className="text-xs text-yellow-600">{t('machines.maintenance')}</Text>
            <Text className="text-2xl font-bold text-yellow-700">{counts.maintenance}</Text>
          </Pressable>
          <Pressable onPress={() => setStatusFilter('INACTIVE')} className={`flex-1 rounded-xl p-3 border ${statusFilter === 'INACTIVE' ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <Text className="text-xs text-red-600">{t('common.inactive')}</Text>
            <Text className="text-2xl font-bold text-red-700">{counts.inactive}</Text>
          </Pressable>
        </View>
      )}

      {/* Search Bar */}
      {machines.length > 0 && (
        <View className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 mb-4">
          <Search size={14} color={sc.iconMuted} />
          <TextInput
            className="flex-1 text-sm ml-2"
            value={search}
            onChangeText={setSearch}
            placeholder={t('machines.searchMachines')}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={14} color={sc.iconMuted} />
            </Pressable>
          )}
        </View>
      )}

      {loading ? (
        <View className="items-center py-12">
          <Text className="text-center text-gray-400">{t('machines.loadingMachines')}</Text>
        </View>
      ) : machines.length === 0 ? (
        <View className="items-center py-12">
          <View className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-4">
            <Factory size={32} color={colors.blue[500]} />
          </View>
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t('machines.noMachinesYet')}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('machines.noMachinesDesc')}</Text>
          <Pressable onPress={() => { setEditingMachine(null); setShowFormModal(true); }} className="bg-blue-500 px-5 py-2.5 rounded-lg flex-row items-center">
            <Plus size={14} color={colors.white} />
            <Text className="text-white font-medium text-sm ml-1">{t('machines.addMachine')}</Text>
          </Pressable>
        </View>
      ) : filteredMachines.length === 0 ? (
        <View className="items-center py-12">
          <Search size={32} color={sc.iconMuted} />
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-3 mb-1">{t('machines.noMachinesMatch')}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{t('machines.noMachinesMatchDesc')}</Text>
        </View>
      ) : (
        <View>
          <Text className="text-xs text-gray-400 mb-2">{filteredMachines.length} machine{filteredMachines.length !== 1 ? 's' : ''}</Text>
          {filteredMachines.map((m) => {
            const borderColor = m.status === 'ACTIVE' ? 'border-l-green-400' : m.status === 'MAINTENANCE' ? 'border-l-yellow-400' : 'border-l-red-400';
            return (
              <View key={m.machine_id} className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 border-l-4 ${borderColor} p-4 mb-3 shadow-sm`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mr-3">
                      <Factory size={18} color={sc.iconDefault} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{m.machine_name}</Text>
                      <Text className="text-xs text-gray-400 font-mono">{m.machine_code}</Text>
                    </View>
                  </View>
                  <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                </View>
                <View className="flex-row items-center mb-3">
                  {m.department && (
                    <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1 mr-2">
                      <FolderOpen size={11} color={sc.iconDefault} />
                      <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{m.department}</Text>
                    </View>
                  )}
                  {m.machine_type && (
                    <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-1">
                      <Settings size={11} color={sc.iconDefault} />
                      <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">{m.machine_type}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                  <Pressable onPress={() => router.push(`/machines/${m.machine_id}`)} className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex-row items-center">
                    <Eye size={11} color={machineStatusColors.ACTIVE.icon} />
                    <Text className="text-xs text-emerald-700 font-medium ml-1">{t('common.view')}</Text>
                  </Pressable>
                  <Pressable onPress={() => { setEditingMachine(m); setShowFormModal(true); }} className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-blue-700 font-medium">✎ {t('common.edit')}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleStatusToggle(m)} className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-yellow-700 font-medium">⟳ {t('machines.toggleStatus')}</Text>
                  </Pressable>
                  <Pressable onPress={() => setDeleteTarget(m)} className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs text-red-700 font-medium">✕ {t('common.delete')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View className="h-8" />

      {/* Machine Form Modal */}
      <MachineFormModal
        visible={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingMachine(null); }}
        onSave={handleSave}
        initialData={editingMachine ? { machine_code: editingMachine.machine_code, machine_name: editingMachine.machine_name, department: editingMachine.department ?? '', machine_type: editingMachine.machine_type ?? '' } : undefined}
        isEditing={!!editingMachine}
      />

      {/* Delete Confirm Modal */}
      <MachineDeleteModal
        visible={!!deleteTarget}
        machineName={deleteTarget?.machine_name ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </ScrollView>
    </View>
  );
}
