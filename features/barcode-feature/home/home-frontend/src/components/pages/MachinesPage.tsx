import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import {
  fetchMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  type Machine,
} from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'add' | 'edit';

interface MachineFormData {
  machineId: string;
  machineName: string;
  machineCode: string;
  sequenceOrder: string;
  description: string;
  canGenerateBarcode: boolean;
}

const EMPTY_FORM: MachineFormData = {
  machineId: '',
  machineName: '',
  machineCode: '',
  sequenceOrder: '',
  description: '',
  canGenerateBarcode: false,
};

// ─── Confirm Helper (works on both web & native) ────────────────────────────

function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirm', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

// ─── Form Field ──────────────────────────────────────────────────────────────

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        className={`border rounded-xl px-4 py-3 text-base ${
          editable ? 'border-gray-200 bg-white text-gray-900' : 'border-gray-100 bg-gray-50 text-gray-400'
        } ${multiline ? 'min-h-[80px]' : ''}`}
        placeholderTextColor="#9CA3AF"
        style={multiline ? { textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}

// ─── Machine Card ────────────────────────────────────────────────────────────

function MachineCard({
  machine,
  onEdit,
  onDelete,
}: {
  machine: Machine;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isGenerator = machine.can_generate_barcode;

  return (
    <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-3">
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
            isGenerator ? 'bg-amber-50' : 'bg-blue-50'
          }`}
        >
          <Text className="text-xl">{isGenerator ? '⚡' : '🏭'}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-semibold text-gray-900 flex-1">
              {machine.machine_name}
            </Text>
            {isGenerator && (
              <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-medium text-amber-700">Generator</Text>
              </View>
            )}
            {!machine.is_active && (
              <View className="bg-red-100 px-2 py-0.5 rounded-full ml-1">
                <Text className="text-xs font-medium text-red-700">Inactive</Text>
              </View>
            )}
          </View>

          <Text className="text-sm text-gray-500 mb-1">
            {machine.machine_code} • Step {machine.sequence_order}
          </Text>

          {machine.description ? (
            <Text className="text-sm text-gray-400">{machine.description}</Text>
          ) : null}

          {/* Action buttons */}
          <View className="flex-row mt-3 gap-2">
            <Pressable
              onPress={onEdit}
              className="bg-blue-50 px-4 py-2 rounded-lg active:bg-blue-100"
            >
              <Text className="text-sm font-medium text-blue-600">✏️ Edit</Text>
            </Pressable>

            {!isGenerator && (
              <Pressable
                onPress={onDelete}
                className="bg-red-50 px-4 py-2 rounded-lg active:bg-red-100"
              >
                <Text className="text-sm font-medium text-red-600">🗑 Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Machine Form ────────────────────────────────────────────────────────────

function MachineForm({
  mode,
  form,
  setForm,
  saving,
  onSave,
  onCancel,
}: {
  mode: 'add' | 'edit';
  form: MachineFormData;
  setForm: React.Dispatch<React.SetStateAction<MachineFormData>>;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={onCancel} className="mr-3 p-2">
            <Text className="text-2xl">←</Text>
          </Pressable>
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {mode === 'add' ? 'Add Machine' : 'Edit Machine'}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {mode === 'add'
                ? 'Create a new machine in the factory line'
                : 'Update machine configuration'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="bg-gray-50 rounded-2xl p-5 mb-4">
          <FormField
            label="Machine ID"
            value={form.machineId}
            onChangeText={(t) => setForm((f) => ({ ...f, machineId: t }))}
            placeholder="e.g. 5"
            keyboardType="numeric"
            editable={mode === 'add'}
          />

          <FormField
            label="Machine Name"
            value={form.machineName}
            onChangeText={(t) => setForm((f) => ({ ...f, machineName: t }))}
            placeholder="e.g. Machine 5 - Labelling"
          />

          <FormField
            label="Machine Code"
            value={form.machineCode}
            onChangeText={(t) => setForm((f) => ({ ...f, machineCode: t.toUpperCase() }))}
            placeholder="e.g. M5"
          />

          <FormField
            label="Sequence Order"
            value={form.sequenceOrder}
            onChangeText={(t) => setForm((f) => ({ ...f, sequenceOrder: t }))}
            placeholder="e.g. 5"
            keyboardType="numeric"
          />

          <FormField
            label="Description"
            value={form.description}
            onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
            placeholder="What does this machine do?"
            multiline
          />

          <View className="flex-row items-center justify-between py-2">
            <View>
              <Text className="text-sm font-medium text-gray-700">
                Can Generate Barcodes?
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                Enable if this is a generator station
              </Text>
            </View>
            <Switch
              value={form.canGenerateBarcode}
              onValueChange={(v) => setForm((f) => ({ ...f, canGenerateBarcode: v }))}
              trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
              thumbColor={form.canGenerateBarcode ? '#2563EB' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={onSave}
          disabled={saving}
          className={`rounded-xl py-4 items-center ${
            saving ? 'bg-gray-300' : 'bg-blue-600 active:bg-blue-700'
          }`}
        >
          <Text className="text-white font-semibold text-base">
            {saving
              ? mode === 'add'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'add'
              ? '➕ Add Machine'
              : '💾 Save Changes'}
          </Text>
        </Pressable>

        <Pressable onPress={onCancel} className="mt-3 py-3 items-center">
          <Text className="text-gray-500 font-medium">Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main MachinesPage ───────────────────────────────────────────────────────

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [form, setForm] = useState<MachineFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Load Machines ──────────────────────────────────────────────────────────
  const loadMachines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMachines();
      setMachines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load machines');
      // Fallback machines if backend is down
      setMachines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  // ── Flash success message ──────────────────────────────────────────────────
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Open Add Form ──────────────────────────────────────────────────────────
  const openAddForm = () => {
    const nextId =
      machines.length > 0
        ? Math.max(...machines.map((m) => m.machine_id)) + 1
        : 1;
    const nextOrder =
      machines.length > 0
        ? Math.max(...machines.map((m) => m.sequence_order)) + 1
        : 1;

    setForm({
      machineId: String(nextId),
      machineName: '',
      machineCode: `M${nextId}`,
      sequenceOrder: String(nextOrder),
      description: '',
      canGenerateBarcode: false,
    });
    setViewMode('add');
  };

  // ── Open Edit Form ─────────────────────────────────────────────────────────
  const openEditForm = (machine: Machine) => {
    setEditingMachine(machine);
    setForm({
      machineId: String(machine.machine_id),
      machineName: machine.machine_name,
      machineCode: machine.machine_code,
      sequenceOrder: String(machine.sequence_order),
      description: machine.description || '',
      canGenerateBarcode: machine.can_generate_barcode,
    });
    setViewMode('edit');
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    // Basic validation
    if (!form.machineName.trim()) {
      Alert.alert('Validation', 'Machine name is required');
      return;
    }
    if (!form.machineCode.trim()) {
      Alert.alert('Validation', 'Machine code is required');
      return;
    }

    const id = parseInt(form.machineId, 10);
    const order = parseInt(form.sequenceOrder, 10);
    if (isNaN(id) || id <= 0) {
      Alert.alert('Validation', 'Machine ID must be a positive number');
      return;
    }
    if (isNaN(order) || order <= 0) {
      Alert.alert('Validation', 'Sequence order must be a positive number');
      return;
    }

    setSaving(true);
    try {
      if (viewMode === 'add') {
        await createMachine({
          machineId: id,
          machineName: form.machineName.trim(),
          machineCode: form.machineCode.trim(),
          sequenceOrder: order,
          description: form.description.trim() || undefined,
          canGenerateBarcode: form.canGenerateBarcode,
        });
        showSuccess(`✅ ${form.machineName} created successfully!`);
      } else {
        await updateMachine(id, {
          machineName: form.machineName.trim(),
          machineCode: form.machineCode.trim(),
          sequenceOrder: order,
          description: form.description.trim(),
          canGenerateBarcode: form.canGenerateBarcode,
        });
        showSuccess(`✅ ${form.machineName} updated successfully!`);
      }
      setViewMode('list');
      setForm(EMPTY_FORM);
      setEditingMachine(null);
      await loadMachines();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (machine: Machine) => {
    const confirmed = await confirmAction(
      'Delete Machine',
      `Are you sure you want to deactivate "${machine.machine_name}"?\n\nThis is a soft delete — it can be reactivated later.`,
    );
    if (!confirmed) return;

    try {
      await deleteMachine(machine.machine_id);
      showSuccess(`🗑 ${machine.machine_name} deactivated`);
      await loadMachines();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete machine',
      );
    }
  };

  // ── Cancel form ────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setViewMode('list');
    setForm(EMPTY_FORM);
    setEditingMachine(null);
  };

  // ─── Form View ─────────────────────────────────────────────────────────────
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <MachineForm
        mode={viewMode}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // ─── List View ─────────────────────────────────────────────────────────────
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-gray-900">Machines</Text>
          <Pressable
            onPress={openAddForm}
            className="bg-blue-600 px-4 py-2.5 rounded-xl active:bg-blue-700 flex-row items-center"
          >
            <Text className="text-white font-semibold text-sm">➕ Add Machine</Text>
          </Pressable>
        </View>
        <Text className="text-base text-gray-500 mb-6">
          Manage factory machines. Add new stations, edit existing ones, or deactivate machines no longer in use.
        </Text>

        {/* Success Message */}
        {successMsg && (
          <View className="bg-green-50 rounded-xl p-3 mb-4 border border-green-200">
            <Text className="text-sm text-green-700 font-medium">{successMsg}</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <Pressable
            onPress={loadMachines}
            className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200"
          >
            <Text className="text-sm text-red-700 font-medium">⚠️ {error}</Text>
            <Text className="text-xs text-red-500 mt-1">Tap to retry</Text>
          </Pressable>
        )}

        {/* Loading */}
        {loading ? (
          <View className="py-12 items-center">
            <Text className="text-gray-400 text-base">Loading machines…</Text>
          </View>
        ) : machines.length === 0 ? (
          /* Empty state */
          <View className="py-16 items-center">
            <Text className="text-5xl mb-4">🏭</Text>
            <Text className="text-lg font-semibold text-gray-700 mb-1">
              No machines yet
            </Text>
            <Text className="text-sm text-gray-400 text-center mb-6 px-8">
              Add your first machine to get started with the factory line.
            </Text>
            <Pressable
              onPress={openAddForm}
              className="bg-blue-600 px-6 py-3 rounded-xl active:bg-blue-700"
            >
              <Text className="text-white font-semibold">➕ Add First Machine</Text>
            </Pressable>
          </View>
        ) : (
          /* Machine list */
          <View>
            {/* Summary bar */}
            <View className="flex-row mb-4 gap-3">
              <View className="flex-1 bg-blue-50 rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-blue-700">
                  {machines.length}
                </Text>
                <Text className="text-xs text-blue-500">Total</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-green-700">
                  {machines.filter((m) => m.is_active).length}
                </Text>
                <Text className="text-xs text-green-500">Active</Text>
              </View>
              <View className="flex-1 bg-amber-50 rounded-xl p-3 items-center">
                <Text className="text-2xl font-bold text-amber-700">
                  {machines.filter((m) => m.can_generate_barcode).length}
                </Text>
                <Text className="text-xs text-amber-500">Generators</Text>
              </View>
            </View>

            {/* Factory flow visualization */}
            <View className="bg-gray-50 rounded-xl p-3 mb-4">
              <Text className="text-xs text-gray-500 font-medium mb-2">
                FACTORY FLOW
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row items-center">
                  {machines.map((m, i) => (
                    <React.Fragment key={m.machine_id}>
                      <View
                        className={`px-3 py-1.5 rounded-lg ${
                          m.can_generate_barcode ? 'bg-amber-100' : 'bg-blue-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            m.can_generate_barcode
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {m.machine_code}
                        </Text>
                      </View>
                      {i < machines.length - 1 && (
                        <Text className="text-gray-300 mx-1">→</Text>
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Machine cards */}
            {machines.map((machine) => (
              <MachineCard
                key={machine.machine_id}
                machine={machine}
                onEdit={() => openEditForm(machine)}
                onDelete={() => handleDelete(machine)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
