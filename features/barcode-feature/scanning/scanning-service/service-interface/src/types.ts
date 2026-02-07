export interface ScanResult {
  barcode: string;
  format: string;
  timestamp: string;
}

export interface ProcessScanRequest {
  barcode: string;
  machineId: number;
}
