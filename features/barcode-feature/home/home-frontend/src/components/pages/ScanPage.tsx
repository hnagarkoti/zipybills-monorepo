import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Alert, TextInput } from 'react-native';
import {
  fetchMachines,
  scanBarcode,
  type Machine,
  type ScanResult,
  type MachineDataRecord,
} from '../../services/api';

// expo-camera is only available on native — we gracefully degrade on web
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const expoCamera = require('expo-camera');
  CameraView = expoCamera.CameraView;
  useCameraPermissions = expoCamera.useCameraPermissions;
} catch {
  // expo-camera not available (web or not installed)
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScannedItem {
  barcode: string;
  machineId: number;
  machineName: string;
  time: string;
  result: ScanResult;
}

// ─── Machine Selection Screen ────────────────────────────────────────────────

function MachineSelectionScreen({
  machines,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  onSelect: (machine: Machine) => void;
  onRetry: () => void;
}) {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Select Your Station
        </Text>
        <Text className="text-base text-gray-500 mb-6">
          Choose the processing machine you're working at. Machine 1 (Generator) creates barcodes — you scan & process them.
        </Text>

        {error && (
          <Pressable
            onPress={onRetry}
            className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200"
          >
            <Text className="text-sm text-red-700 font-medium">⚠️ {error}</Text>
            <Text className="text-xs text-red-500 mt-1">Tap to retry • Using fallback machines below</Text>
          </Pressable>
        )}

        {loading ? (
          <View className="py-12 items-center">
            <Text className="text-gray-400">Loading machines...</Text>
          </View>
        ) : (
          <View className="gap-3">
            {machines.map((machine) => (
              <Pressable
                key={machine.machine_id}
                onPress={() => onSelect(machine)}
                className="bg-white rounded-2xl p-5 border-2 border-gray-100 active:border-primary"
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-xl bg-primary-50 items-center justify-center mr-4">
                    <Text className="text-2xl">🏭</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {machine.machine_name}
                    </Text>
                    <Text className="text-sm text-gray-400">
                      {machine.machine_code} • Step {machine.sequence_order} of 4
                    </Text>
                    {machine.description && (
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {machine.description}
                      </Text>
                    )}
                  </View>
                  <Text className="text-gray-300 text-xl">→</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
          <Text className="text-sm font-semibold text-amber-800 mb-1">🏭 Factory Flow</Text>
          <Text className="text-xs text-amber-700">
            Machine 1 (Generator) creates barcodes → You scan them at your station → Sequential order enforced (M2 → M3 → M4).
            A barcode must be processed by the previous machine before your machine can scan it.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Scan Result Banner ──────────────────────────────────────────────────────

function ScanResultBanner({
  item,
  onDismiss,
}: {
  item: ScannedItem;
  onDismiss: () => void;
}) {
  const isSuccess = item.result.success;
  return (
    <View
      className={`mx-0 mb-4 rounded-xl p-4 border ${
        isSuccess
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className={`text-base font-semibold ${
              isSuccess ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isSuccess ? '✅ Scan Successful' : '❌ Scan Failed'}
          </Text>
          <Text
            className={`text-sm mt-1 ${
              isSuccess ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {item.result.message || item.result.error}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {item.barcode}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {item.machineName} • {item.time}
          </Text>
        </View>
        <Pressable onPress={onDismiss} className="p-1">
          <Text className="text-gray-400 text-lg">✕</Text>
        </Pressable>
      </View>

      {/* Processing History */}
      {isSuccess && item.result.history && item.result.history.length > 0 && (
        <View className="mt-3 pt-3 border-t border-green-200">
          <Text className="text-xs font-semibold text-green-800 mb-2">
            Processing History:
          </Text>
          {item.result.history.map((h: MachineDataRecord, i: number) => (
            <View key={i} className="flex-row items-center mb-1">
              <View className="w-5 h-5 rounded-full bg-green-200 items-center justify-center mr-2">
                <Text className="text-xs font-bold text-green-800">
                  {h.machine_id}
                </Text>
              </View>
              <Text className="text-xs text-green-700 flex-1">{h.notes}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Camera Scanner (Native) ─────────────────────────────────────────────────

function NativeCameraScanner({
  onBarcodeScanned,
  scanActive,
}: {
  onBarcodeScanned: (data: string) => void;
  scanActive: boolean;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const lastScannedRef = useRef<string>('');
  const cooldownRef = useRef<boolean>(false);

  const handleBarcodeScan = useCallback(
    ({ data }: { data: string }) => {
      if (!scanActive || cooldownRef.current) return;
      if (data === lastScannedRef.current) return;

      lastScannedRef.current = data;
      cooldownRef.current = true;
      onBarcodeScanned(data);

      // Cooldown to prevent rapid re-scans
      setTimeout(() => {
        cooldownRef.current = false;
        lastScannedRef.current = '';
      }, 3000);
    },
    [onBarcodeScanned, scanActive],
  );

  if (!permission) {
    return (
      <View className="bg-gray-900 rounded-2xl h-72 items-center justify-center">
        <Text className="text-white/60">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="bg-gray-900 rounded-2xl h-72 items-center justify-center px-6">
        <Text className="text-white text-xl mb-2">📷</Text>
        <Text className="text-white/80 text-center text-sm mb-4">
          Camera permission is needed to scan barcodes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="rounded-2xl overflow-hidden h-72">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'code128',
            'code39',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'itf14',
            'qr',
            'datamatrix',
          ],
        }}
        onBarcodeScanned={scanActive ? handleBarcodeScan : undefined}
      >
        {/* Scan overlay */}
        <View className="flex-1 items-center justify-center">
          <View className="w-56 h-56 border-2 border-white/60 rounded-xl items-center justify-center">
            {scanActive ? (
              <>
                <Text className="text-white/80 text-sm">Scanning...</Text>
                <View className="mt-2 h-0.5 w-40 bg-primary" />
              </>
            ) : (
              <Text className="text-white/60 text-sm">Paused</Text>
            )}
          </View>
        </View>

        {/* Live indicator */}
        {scanActive && (
          <View className="absolute top-3 left-3 bg-red-500 rounded-full px-3 py-1 flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-white mr-1.5" />
            <Text className="text-white text-xs font-semibold">LIVE</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

// ─── Web Fallback Scanner (Manual Entry) ─────────────────────────────────────

function WebFallbackScanner({
  onBarcodeScanned,
}: {
  onBarcodeScanned: (data: string) => void;
}) {
  const [manualBarcode, setManualBarcode] = useState('');

  return (
    <View className="bg-gray-900 rounded-2xl p-6 items-center justify-center">
      <Text className="text-white text-xl mb-2">📷</Text>
      <Text className="text-white/80 text-sm mb-4 text-center">
        Camera scanning requires a native device.{'\n'}
        Enter a barcode manually below:
      </Text>
      <View className="w-full flex-row items-center gap-2">
        <TextInput
          className="flex-1 bg-white rounded-lg px-4 py-3 text-gray-900"
          placeholder="Enter barcode value..."
          placeholderTextColor="#9ca3af"
          value={manualBarcode}
          onChangeText={setManualBarcode}
          onSubmitEditing={() => {
            if (manualBarcode.trim()) {
              onBarcodeScanned(manualBarcode.trim());
              setManualBarcode('');
            }
          }}
        />
        <Pressable
          onPress={() => {
            if (manualBarcode.trim()) {
              onBarcodeScanned(manualBarcode.trim());
              setManualBarcode('');
            }
          }}
          className="bg-primary rounded-lg px-4 py-3"
        >
          <Text className="text-white font-semibold">Scan</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main ScanPage ───────────────────────────────────────────────────────────

export function ScanPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [machinesError, setMachinesError] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [scanActive, setScanActive] = useState(true);
  const [scanProcessing, setScanProcessing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScannedItem | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([]);

  const isNative = Platform.OS !== 'web';
  const hasCameraSupport = isNative && CameraView != null;

  // Fetch machines from backend
  const loadMachines = useCallback(async () => {
    setMachinesLoading(true);
    setMachinesError(null);
    try {
      const result = await fetchMachines();
      setMachines(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load machines';
      setMachinesError(msg);
      // Fallback to hardcoded machines if backend is down
      setMachines([
        { machine_id: 1, machine_name: 'Machine 1 - Generator', machine_code: 'M1', sequence_order: 1, description: null, is_active: true, can_generate_barcode: true, created_at: '', updated_at: '' },
        { machine_id: 2, machine_name: 'Machine 2 - Processing', machine_code: 'M2', sequence_order: 2, description: null, is_active: true, can_generate_barcode: false, created_at: '', updated_at: '' },
        { machine_id: 3, machine_name: 'Machine 3 - Quality Check', machine_code: 'M3', sequence_order: 3, description: null, is_active: true, can_generate_barcode: false, created_at: '', updated_at: '' },
        { machine_id: 4, machine_name: 'Machine 4 - Final Packaging', machine_code: 'M4', sequence_order: 4, description: null, is_active: true, can_generate_barcode: false, created_at: '', updated_at: '' },
      ]);
    } finally {
      setMachinesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  // Handle barcode scanned (from camera or manual entry)
  const handleBarcodeScanned = useCallback(
    async (barcodeValue: string) => {
      if (!selectedMachine || scanProcessing) return;

      setScanProcessing(true);
      setScanActive(false);

      try {
        const result = await scanBarcode(barcodeValue, selectedMachine.machine_id);

        const scannedItem: ScannedItem = {
          barcode: barcodeValue,
          machineId: selectedMachine.machine_id,
          machineName: selectedMachine.machine_name,
          time: new Date().toLocaleTimeString(),
          result,
        };

        setLastScanResult(scannedItem);
        setScanHistory((prev) => [scannedItem, ...prev].slice(0, 50));

        if (!result.success && Platform.OS !== 'web') {
          Alert.alert(
            'Scan Result',
            result.error || result.message || 'Unknown error',
            [{ text: 'OK', onPress: () => setScanActive(true) }],
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error';
        const scannedItem: ScannedItem = {
          barcode: barcodeValue,
          machineId: selectedMachine.machine_id,
          machineName: selectedMachine.machine_name,
          time: new Date().toLocaleTimeString(),
          result: {
            success: false,
            message: '',
            error: `Connection error: ${errorMsg}. Is the scanning service running on port 3003?`,
          },
        };
        setLastScanResult(scannedItem);
        setScanHistory((prev) => [scannedItem, ...prev].slice(0, 50));
      } finally {
        setScanProcessing(false);
        // Auto-resume scanning after 2s
        setTimeout(() => setScanActive(true), 2000);
      }
    },
    [selectedMachine, scanProcessing],
  );

  // Machine selection screen
  if (!selectedMachine) {
    return (
      <MachineSelectionScreen
        machines={machines}
        loading={machinesLoading}
        error={machinesError}
        onSelect={setSelectedMachine}
        onRetry={loadMachines}
      />
    );
  }

  // Scanner screen
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Machine Badge + Status */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => setSelectedMachine(null)}
            className="flex-row items-center bg-primary-50 rounded-full px-3 py-1.5"
          >
            <Text className="text-sm mr-1">🏭</Text>
            <Text className="text-sm font-semibold text-primary-700">
              {selectedMachine.machine_name}
            </Text>
            <Text className="text-xs text-primary-400 ml-1">✏️</Text>
          </Pressable>
          <View className="flex-row items-center">
            {scanProcessing && (
              <View className="bg-yellow-100 rounded-full px-2 py-0.5 mr-2">
                <Text className="text-xs text-yellow-700">Processing...</Text>
              </View>
            )}
            <Pressable onPress={() => setScanActive(!scanActive)}>
              <Text className="text-xs text-gray-400">
                {scanActive ? '🔴 Scanning' : '⚪ Paused'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Barcode Scanner
        </Text>
        <Text className="text-sm text-gray-500 mb-4">
          {hasCameraSupport
            ? 'Point your camera at a barcode to scan and store it.'
            : 'Enter barcode values manually to process them.'}
        </Text>

        {/* Camera / Manual Entry */}
        {hasCameraSupport ? (
          <View className="mb-4">
            <NativeCameraScanner
              onBarcodeScanned={handleBarcodeScanned}
              scanActive={scanActive && !scanProcessing}
            />
            <Pressable
              onPress={() => setScanActive(!scanActive)}
              className="mt-2 items-center"
            >
              <Text className="text-xs text-gray-400">
                {scanActive ? 'Tap to pause scanning' : 'Tap to resume scanning'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="mb-4">
            <WebFallbackScanner
              onBarcodeScanned={handleBarcodeScanned}
            />
          </View>
        )}

        {/* Last Scan Result */}
        {lastScanResult && (
          <ScanResultBanner
            item={lastScanResult}
            onDismiss={() => setLastScanResult(null)}
          />
        )}

        {/* Quick Actions */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap -mx-1.5">
          {[
            {
              icon: scanActive ? '⏸️' : '▶️',
              label: scanActive ? 'Pause Scan' : 'Resume Scan',
              action: () => setScanActive(!scanActive),
            },
            {
              icon: '🔄',
              label: 'Switch Machine',
              action: () => setSelectedMachine(null),
            },
            {
              icon: '🗑️',
              label: 'Clear History',
              action: () => {
                setScanHistory([]);
                setLastScanResult(null);
              },
            },
            {
              icon: '📊',
              label: `${scanHistory.length} Scans`,
              action: () => {},
            },
          ].map((item, i) => (
            <View key={i} className="w-1/2 px-1.5 mb-3">
              <Pressable
                onPress={item.action}
                className="bg-gray-50 rounded-xl p-4 flex-row items-center border border-gray-100"
              >
                <Text className="text-2xl mr-3">{item.icon}</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {item.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Scan History */}
        <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">
          Scan History — {selectedMachine.machine_name}
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 mb-6">
          {scanHistory.length === 0 ? (
            <View className="px-4 py-8 items-center">
              <Text className="text-2xl mb-2">📷</Text>
              <Text className="text-gray-400 text-sm">
                No scans yet. Point your camera at a barcode!
              </Text>
            </View>
          ) : (
            scanHistory.map((item, i) => (
              <View
                key={`${item.barcode}-${item.time}-${i}`}
                className={`flex-row items-center px-4 py-3 ${
                  i > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
                    item.result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <Text className="text-sm">
                    {item.result.success ? '✅' : '❌'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    {item.barcode}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text
                      className={`text-xs ${
                        item.result.success ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {item.result.success
                        ? item.result.message
                        : (item.result.error || 'Failed').substring(0, 50)}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-400">{item.time}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
