import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { 
  getAllMachines, 
  createMachine, 
  updateMachine, 
  deleteMachine,
  type Machine 
} from '@zipybills/barcode-machines-service-interface';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';
import { useFeatureFlag } from '@zipybills/feature-flags';

interface MachineFormData {
  machine_name: string;
  machine_code: string;
  sequence_order: string;
  description: string;
  can_generate_barcode: boolean;
}

export default function MachinesPage() {
  console.log('🎯 MachinesPage: Component rendering');
  console.log('Rendering MachinesPage component');
  const machinesEnabled = useFeatureFlag('barcode.machines');
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MachineFormData>({
    machine_name: '',
    machine_code: '',
    sequence_order: '',
    description: '',
    can_generate_barcode: false,
  });

  useEffect(() => {
    console.log('🎯 MachinesPage: useEffect triggered, calling fetchMachines');
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    console.log('🎯 MachinesPage: fetchMachines started');
    console.log('Fetching machines...');
    setLoading(true);
    try {
      console.log('🎯 MachinesPage: Calling getAllMachines API');
      const response = await getAllMachines({
        client: createConfig({ 
          baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
        })
      });
      
      console.log('🎯 MachinesPage: API response received:', response);
      console.log('API response received', { response });
      console.log('Response data', { data: response.data });
      
      // The SDK returns { data: MachinesResponse } where MachinesResponse = { success, machines }
      const machinesData = response.data;
      console.log('🎯 MachinesPage: machinesData:', machinesData);
      
      if (machinesData && 'machines' in machinesData) {
        console.log('🎯 MachinesPage: Machines found:', machinesData.machines.length);
        console.log('Machines loaded successfully', { count: machinesData.machines.length });
        setMachines(machinesData.machines);
        setError('');
      } else {
        console.log('🎯 MachinesPage: No machines in response');
        console.error('No machines in response', { data: machinesData });
        setError('Failed to fetch machines');
      }
    } catch (err) {
      console.error('🎯 MachinesPage: Error fetching machines:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to server';
      console.error('Failed to fetch machines', err as Error, { errorMsg });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.machine_name ||
      !formData.machine_code ||
      !formData.sequence_order
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const machineData = {
        machine_name: formData.machine_name,
        machine_code: formData.machine_code,
        sequence_order: parseInt(formData.sequence_order),
        description: formData.description || null,
        can_generate_barcode: formData.can_generate_barcode,
      };

      const config = createConfig({ 
        baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
      });

      if (editingId) {
        await updateMachine({
          client: config,
          path: { id: editingId },
          body: machineData
        });
      } else {
        await createMachine({
          client: config,
          body: machineData
        });
      }

      setModalVisible(false);
      resetForm();
      fetchMachines();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save machine';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingId(machine.machine_id);
    setFormData({
      machine_name: machine.machine_name,
      machine_code: machine.machine_code,
      sequence_order: machine.sequence_order.toString(),
      description: machine.description || '',
      can_generate_barcode: machine.can_generate_barcode,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this machine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMachine({
                client: createConfig({ 
                  baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
                }),
                path: { id }
              });
              fetchMachines();
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Failed to delete machine';
              Alert.alert('Error', errorMsg);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      machine_name: '',
      machine_code: '',
      sequence_order: '',
      description: '',
      can_generate_barcode: false,
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    console.log('Opening add modal');
    resetForm();
    setModalVisible(true);
  };

  if (!machinesEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏭 Machines Management</Text>
        </View>
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledText}>⚠️ Machines management feature is currently disabled</Text>
          <Text style={styles.disabledSubtext}>Please contact your administrator to enable this feature.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏭 Machines Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Machine</Text>
        </TouchableOpacity>
      </View>

      {loading && !modalVisible ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView style={styles.listContainer}>
          {machines.map((machine) => (
            <View key={machine.machine_id} style={styles.machineCard}>
              <View style={styles.machineHeader}>
                <Text style={styles.machineName}>{machine.machine_name}</Text>
                <Text style={styles.machineCode}>{machine.machine_code}</Text>
              </View>
              <Text style={styles.machineDetail}>
                Sequence: {machine.sequence_order}
              </Text>
              {machine.description && (
                <Text style={styles.machineDescription}>
                  {machine.description}
                </Text>
              )}
              <View style={styles.machineTags}>
                {machine.can_generate_barcode && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Can Generate</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.tag,
                    machine.is_active ? styles.tagActive : styles.tagInactive,
                  ]}
                >
                  <Text style={styles.tagText}>
                    {machine.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.machineActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(machine)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(machine.machine_id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Machine' : 'Add New Machine'}
            </Text>

            <Text style={styles.inputLabel}>Machine Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.machine_name}
              onChangeText={(text) =>
                setFormData({ ...formData, machine_name: text })
              }
              placeholder="e.g., Machine 1 - Generator"
            />

            <Text style={styles.inputLabel}>Machine Code *</Text>
            <TextInput
              style={styles.input}
              value={formData.machine_code}
              onChangeText={(text) =>
                setFormData({ ...formData, machine_code: text })
              }
              placeholder="e.g., M1"
            />

            <Text style={styles.inputLabel}>Sequence Order *</Text>
            <TextInput
              style={styles.input}
              value={formData.sequence_order}
              onChangeText={(text) =>
                setFormData({ ...formData, sequence_order: text })
              }
              placeholder="e.g., 1"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                setFormData({
                  ...formData,
                  can_generate_barcode: !formData.can_generate_barcode,
                })
              }
            >
              <View style={styles.checkbox}>
                {formData.can_generate_barcode && (
                  <Text style={styles.checkboxCheck}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Can Generate Barcodes</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { backgroundColor: '#10b981', padding: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  loadingText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
  errorText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#dc2626' },
  listContainer: { flex: 1, padding: 16 },
  machineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  machineName: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  machineCode: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  machineDetail: { fontSize: 14, color: '#666', marginBottom: 4 },
  machineDescription: { fontSize: 14, color: '#999', marginBottom: 8 },
  machineTags: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#e0e0e0' },
  tagActive: { backgroundColor: '#d1fae5' },
  tagInactive: { backgroundColor: '#fee2e2' },
  tagText: { fontSize: 12, fontWeight: '600' },
  machineActions: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, backgroundColor: '#3b82f6', padding: 10, borderRadius: 6 },
  editButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  deleteButton: { flex: 1, backgroundColor: '#ef4444', padding: 10, borderRadius: 6 },
  deleteButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disabledContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  disabledText: { fontSize: 24, fontWeight: 'bold', color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  disabledSubtext: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});
