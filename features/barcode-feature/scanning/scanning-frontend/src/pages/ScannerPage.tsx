import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getAllMachines, type Machine } from '@zipybills/barcode-machines-service-interface';
import { generateBarcode, scanBarcode } from '@zipybills/barcode-scanning-service-interface';
import { useFeatureFlag } from '@zipybills/feature-flags';
import { createConfig } from '@zipybills/barcode-machines-service-interface/dist/client';

export default function ScannerPage() {
  const scanningEnabled = useFeatureFlag('barcode.scanning');
  const barcodeGenerationEnabled = useFeatureFlag('barcode.generation');
  
  const [barcode, setBarcode] = useState('');
  const [machineId, setMachineId] = useState('1');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      console.log('Fetching machines...');
      const response = await getAllMachines({
        client: createConfig({ 
          baseUrl: process.env.NEXT_PUBLIC_MACHINES_API_URL || 'http://localhost:3006' 
        })
      });
      console.log('Machines response received', { response });
      console.log('Machines response data', { data: response.data });
      
      // SDK returns { data: MachinesResponse } where MachinesResponse = { success, machines }
      const machinesData = response.data;
      const allMachines = (machinesData && 'machines' in machinesData) ? machinesData.machines : [];
      const activeMachines = allMachines
        .filter((m) => m.is_active === true)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      setMachines(activeMachines);
      
      if (activeMachines.length > 0) {
        setMachineId(activeMachines[0].machine_id.toString());
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch machines';
      console.error('Failed to fetch machines', err as Error, { errorMsg });
      setError(`Failed to load machines: ${errorMsg}`);
    }
  };

  const handleGenerate = async () => {
    if (!barcodeGenerationEnabled) {
      setError('Barcode generation feature is disabled');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await generateBarcode({
        client: createConfig({ 
          baseUrl: process.env.NEXT_PUBLIC_SCANNING_API_URL || 'http://localhost:3003' 
        }),
        body: { machine_id: 1 }
      });
      
      if (response.data?.barcode) {
        setGeneratedBarcode(response.data.barcode);
        setBarcode(response.data.barcode);
        setResult({ message: 'Barcode generated! You can now scan it.' });
      } else {
        setError('Failed to generate barcode');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scanningEnabled) {
      setError('Scanning feature is disabled');
      return;
    }
    
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await scanBarcode({
        client: createConfig({ 
          baseUrl: process.env.NEXT_PUBLIC_SCANNING_API_URL || 'http://localhost:3003' 
        }),
        body: {
          barcode: barcode.trim(),
          machine_id: parseInt(machineId),
          parameters: {
            temperature: (Math.random() * 10 + 20).toFixed(1),
            pressure: (Math.random() * 10 + 100).toFixed(1),
            timestamp: new Date().toISOString(),
          },
        }
      });

      if (response.data) {
        setResult(response.data);
        setBarcode('');
      } else {
        setError('Failed to process barcode');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect. Ensure services are running.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!scanningEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📷 Barcode Scanner</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.disabledText}>⚠️ Scanning feature is currently disabled</Text>
          <Text style={styles.disabledSubtext}>Please contact your administrator to enable this feature.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 Barcode Scanner</Text>
        <Text style={styles.subtitle}>Machine {machineId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Machine:</Text>
        <View style={styles.pickerContainer}>
          {machines.length === 0 ? (
            <Text style={styles.pickerText}>Loading machines...</Text>
          ) : (
            machines.map((machine) => (
              <TouchableOpacity
                key={machine.machine_id}
                style={[
                  styles.machineOption,
                  machineId === machine.machine_id.toString() && styles.machineOptionSelected,
                ]}
                onPress={() => setMachineId(machine.machine_id.toString())}
              >
                <Text
                  style={[
                    styles.machineText,
                    machineId === machine.machine_id.toString() && styles.machineTextSelected,
                  ]}
                >
                  {machine.machine_name} ({machine.machine_code}) - Seq: {machine.sequence_order}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1️⃣ Generate New Barcode</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonGenerate, loading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Generating...' : '🎫 Generate Barcode'}</Text>
        </TouchableOpacity>

        {generatedBarcode && (
          <View style={styles.barcodeDisplay}>
            <Text style={styles.barcodeLabel}>PRODUCT BARCODE</Text>
            <Text style={styles.barcodeValue}>{generatedBarcode}</Text>
            <Text style={styles.barcodeDate}>Generated: {new Date().toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2️⃣ Scan/Process Barcode</Text>
        <Text style={styles.label}>Enter Barcode:</Text>
        <TextInput
          style={styles.input}
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Enter or scan barcode..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonScan,
            (loading || !barcode.trim()) && styles.buttonDisabled,
          ]}
          onPress={handleScan}
          disabled={loading || !barcode.trim()}
        >
          <Text style={styles.buttonText}>{loading ? 'Processing...' : '✅ Process Barcode'}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✅ Success!</Text>
          <Text style={styles.successText}>{result.message}</Text>

          {result.history && result.history.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Processing History:</Text>
              {result.history.map((item: any, index: number) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    <Text style={styles.historyBold}>Machine {item.machine_id}:</Text> {item.notes}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>📋 Test with Demo Data:</Text>
        <Text style={styles.demoText}>• DEMO_BARCODE_001 - Processed by all 4 machines</Text>
        <Text style={styles.demoText}>• DEMO_BARCODE_002 - Processed by machines 1,2,3</Text>
        <Text style={styles.demoText}>• DEMO_BARCODE_005 - Processed by machine 1 only</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666' },
  section: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  pickerText: { padding: 12, color: '#999' },
  machineOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  machineOptionSelected: { backgroundColor: '#3b82f6' },
  machineText: { fontSize: 14, color: '#333' },
  machineTextSelected: { color: '#fff', fontWeight: '600' },
  card: { margin: 20, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: { padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonGenerate: { backgroundColor: '#10b981' },
  buttonScan: { backgroundColor: '#3b82f6' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  barcodeDisplay: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  barcodeLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  barcodeValue: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, marginVertical: 12 },
  barcodeDate: { fontSize: 12, color: '#999' },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  successContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
  },
  successTitle: { color: '#059669', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  successText: { color: '#047857', fontSize: 14 },
  historyContainer: { marginTop: 12 },
  historyTitle: { fontWeight: '600', marginBottom: 8, color: '#047857' },
  historyItem: { padding: 12, backgroundColor: '#fff', borderRadius: 4, marginBottom: 4 },
  historyText: { fontSize: 14, color: '#333' },
  historyBold: { fontWeight: '600' },
  demoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
  },
  demoTitle: { color: '#1d4ed8', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  demoText: { color: '#1e40af', fontSize: 14, marginVertical: 2 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  disabledText: { fontSize: 24, fontWeight: 'bold', color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  disabledSubtext: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});
