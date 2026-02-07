/**
 * API service for the barcode scanner app.
 * Connects to the scanning-service (port 3003) and machines-service (port 3006).
 */

import { Platform } from 'react-native';

// On web, localhost works. On physical devices, we need the laptop's LAN IP.
// We extract it from Expo's debuggerHost which is set to "IP:PORT".
const getLanHost = (): string => {
  try {
    // expo-constants exposes the dev server host
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost ?? Constants.manifest?.debuggerHost;
    if (typeof debuggerHost === 'string' && debuggerHost.includes(':')) {
      return debuggerHost.split(':')[0];
    }
  } catch {
    // expo-constants not available — fall through
  }
  return 'localhost';
};

const getBaseUrl = (port: number): string => {
  if (Platform.OS === 'web') {
    return `http://localhost:${port}`;
  }
  // On native devices, use the same LAN IP that Expo uses to serve the bundle
  const host = getLanHost();
  return `http://${host}:${port}`;
};

const SCANNING_API = getBaseUrl(3003);
const MACHINES_API = getBaseUrl(3006);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Machine {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  sequence_order: number;
  description: string | null;
  is_active: boolean;
  can_generate_barcode: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarcodeRecord {
  barcode_id: number;
  barcode: string;
  generated_by_machine: number;
  generated_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MachineDataRecord {
  data_id: number;
  barcode: string;
  machine_id: number;
  processed_at: string;
  machine_parameters: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  history?: MachineDataRecord[];
  error?: string;
}

export interface DashboardData {
  success: boolean;
  status: {
    totalBarcodes: number;
    totalProcessed: number;
    todayBarcodes: number;
    todayScans: number;
    completed: number;
    inProgress: number;
    pending: number;
    totalMachines: number;
    machineStats: Array<{
      machine_id: number;
      count: number;
      machine_name: string;
      machine_code: string;
    }>;
    recentActivity: ActivityLogEntry[];
    failuresToday: number;
    avgProcessingMinutes: number;
  };
}

export interface ActivityLogEntry {
  log_id: number;
  action: string;
  barcode: string | null;
  machine_id: number | null;
  machine_name?: string;
  machine_code?: string;
  user_id: string | null;
  status: 'SUCCESS' | 'FAILED';
  error_message: string | null;
  details: string | null;
  created_at: string;
}

export interface ReportSummary {
  barcodesGenerated: number;
  totalScans: number;
  failedAttempts: number;
  completed: number;
  successRate: number;
  totalMachines: number;
}

export interface MachineActivityItem {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  can_generate_barcode: boolean;
  scan_count: number;
  first_scan: string | null;
  last_scan: string | null;
  failed_count: number;
}

export interface CompletionItem {
  barcode: string;
  generated_at: string;
  generated_by_machine: number;
  machines_processed: number;
  total_machines: number;
  completion_status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  processed_by_machines: string | null;
  first_scan_at: string | null;
  last_scan_at: string | null;
}

export interface FailedScanItem {
  log_id: number;
  action: string;
  barcode: string | null;
  machine_id: number | null;
  machine_name: string | null;
  machine_code: string | null;
  user_id: string | null;
  error_message: string;
  details: string | null;
  created_at: string;
}

export interface HourlyActivity {
  hour: number;
  scan_count: number;
  unique_barcodes: number;
}

export interface DailyActivity {
  date: string;
  scan_count: number;
  unique_barcodes: number;
  active_machines: number;
}

export interface BarcodeJourney {
  barcode: BarcodeRecord;
  steps: Array<{
    data_id: number;
    machine_id: number;
    machine_name: string;
    machine_code: string;
    sequence_order: number;
    processed_at: string;
    machine_parameters: string | null;
    notes: string | null;
    status: string;
  }>;
  activityLog: ActivityLogEntry[];
  allMachines: Array<{ machine_id: number; machine_name: string; machine_code: string; sequence_order: number }>;
  totalMachines: number;
  machinesProcessed: number;
  isComplete: boolean;
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

// ─── API Functions ───────────────────────────────────────────────────────────

/** Fetch all active machines from the machines service */
export async function fetchMachines(): Promise<Machine[]> {
  const res = await fetch(`${MACHINES_API}/api/machines`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch machines');
  return (data.machines || [])
    .filter((m: Machine) => m.is_active)
    .sort((a: Machine, b: Machine) => a.sequence_order - b.sequence_order);
}

/** Generate a new barcode (from Machine 1) */
export async function generateBarcode(machineId: number = 1): Promise<string> {
  const res = await fetch(`${SCANNING_API}/api/barcode/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate barcode');
  return data.barcode;
}

/** Get all barcodes */
export async function fetchBarcodes(): Promise<BarcodeRecord[]> {
  const res = await fetch(`${SCANNING_API}/api/barcodes`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch barcodes');
  return data.barcodes || [];
}

/** Get barcode details + processing history */
export async function fetchBarcodeDetails(barcode: string): Promise<{
  barcode: BarcodeRecord;
  history: MachineDataRecord[];
}> {
  const res = await fetch(`${SCANNING_API}/api/barcode/${encodeURIComponent(barcode)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Barcode not found');
  return { barcode: data.barcode, history: data.history || [] };
}

/** Scan/process a barcode at a specific machine */
export async function scanBarcode(
  barcode: string,
  machineId: number,
  parameters?: Record<string, unknown>,
  notes?: string,
): Promise<ScanResult> {
  const res = await fetch(`${SCANNING_API}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode,
      machineId,
      parameters: parameters || {
        temperature: parseFloat((Math.random() * 10 + 20).toFixed(1)),
        pressure: parseFloat((Math.random() * 10 + 100).toFixed(1)),
        timestamp: new Date().toISOString(),
      },
      notes: notes || `Scanned by Machine ${machineId} via mobile app`,
    }),
  });
  const data = await res.json();
  return data;
}

/** Get dashboard/status data */
export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${SCANNING_API}/api/status`);
  const data = await res.json();
  return data;
}

/** Reset database with demo data */
export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${SCANNING_API}/api/reset-database`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to reset database');
}

// ─── Machine CRUD ────────────────────────────────────────────────────────────

/** Create a new machine */
export async function createMachine(machine: {
  machineId: number;
  machineName: string;
  machineCode: string;
  sequenceOrder: number;
  description?: string;
  canGenerateBarcode?: boolean;
}): Promise<void> {
  const res = await fetch(`${MACHINES_API}/api/machines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(machine),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create machine');
}

/** Update an existing machine */
export async function updateMachine(
  machineId: number,
  updates: {
    machineName?: string;
    machineCode?: string;
    sequenceOrder?: number;
    description?: string;
    isActive?: boolean;
    canGenerateBarcode?: boolean;
  },
): Promise<void> {
  const res = await fetch(`${MACHINES_API}/api/machines/${machineId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update machine');
}

/** Delete (deactivate) a machine */
export async function deleteMachine(machineId: number): Promise<void> {
  const res = await fetch(`${MACHINES_API}/api/machines/${machineId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete machine');
}

// ─── Reports API ─────────────────────────────────────────────────────────────

function buildReportUrl(endpoint: string, period: ReportPeriod, startDate?: string, endDate?: string): string {
  const params = new URLSearchParams({ period });
  if (period === 'custom' && startDate) params.set('startDate', startDate);
  if (period === 'custom' && endDate) params.set('endDate', endDate);
  return `${SCANNING_API}${endpoint}?${params.toString()}`;
}

/** Fetch summary report for a period */
export async function fetchReportSummary(period: ReportPeriod = 'all', startDate?: string, endDate?: string): Promise<ReportSummary> {
  const res = await fetch(buildReportUrl('/api/reports/summary', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch report summary');
  return data.summary;
}

/** Fetch per-machine activity breakdown */
export async function fetchMachineActivity(period: ReportPeriod = 'all', startDate?: string, endDate?: string): Promise<MachineActivityItem[]> {
  const res = await fetch(buildReportUrl('/api/reports/machine-activity', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch machine activity');
  return data.machines || [];
}

/** Fetch completion stats for all barcodes */
export async function fetchCompletionStats(period: ReportPeriod = 'all', startDate?: string, endDate?: string): Promise<CompletionItem[]> {
  const res = await fetch(buildReportUrl('/api/reports/completion', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch completion stats');
  return data.items || [];
}

/** Fetch failed scans log */
export async function fetchFailedScans(period: ReportPeriod = 'all', startDate?: string, endDate?: string): Promise<FailedScanItem[]> {
  const res = await fetch(buildReportUrl('/api/reports/failed-scans', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch failed scans');
  return data.failures || [];
}

/** Fetch hourly activity chart data */
export async function fetchHourlyActivity(period: ReportPeriod = 'today', startDate?: string, endDate?: string): Promise<HourlyActivity[]> {
  const res = await fetch(buildReportUrl('/api/reports/hourly', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch hourly activity');
  return data.hourly || [];
}

/** Fetch daily activity trend data */
export async function fetchDailyActivity(period: ReportPeriod = 'month', startDate?: string, endDate?: string): Promise<DailyActivity[]> {
  const res = await fetch(buildReportUrl('/api/reports/daily', period, startDate, endDate));
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch daily activity');
  return data.daily || [];
}

/** Fetch complete barcode journey */
export async function fetchBarcodeJourney(barcode: string): Promise<BarcodeJourney> {
  const res = await fetch(`${SCANNING_API}/api/reports/barcode-journey/${encodeURIComponent(barcode)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Barcode not found');
  return data.journey;
}

/** Fetch activity log with pagination and filters */
export async function fetchActivityLog(
  page: number = 1,
  limit: number = 50,
  filters?: { action?: string; status?: string; machineId?: number; period?: ReportPeriod; startDate?: string; endDate?: string },
): Promise<{ logs: ActivityLogEntry[]; total: number; page: number; limit: number; totalPages: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.action) params.set('action', filters.action);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.machineId) params.set('machineId', String(filters.machineId));
  if (filters?.period) params.set('period', filters.period);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);

  const res = await fetch(`${SCANNING_API}/api/reports/activity-log?${params.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch activity log');
  return { logs: data.logs, total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages };
}
