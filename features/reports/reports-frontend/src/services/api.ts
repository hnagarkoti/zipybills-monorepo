/**
 * Reports API – uses typed SDK from service-interface
 */

import {
  ReportsApi,
  type ReportFilters,
  type ProductionReportRow,
  type MachineWiseReportRow,
  type ShiftWiseReportRow,
  type RejectionReportRow,
} from '@zipybills/factory-reports-service-interface';

export type {
  ReportFilters,
  ProductionReportRow,
  MachineWiseReportRow,
  ShiftWiseReportRow,
  RejectionReportRow,
} from '@zipybills/factory-reports-service-interface';

export const reportsApi = new ReportsApi();

export async function fetchProductionReport(filters: ReportFilters): Promise<ProductionReportRow[]> {
  return reportsApi.getProductionReport(filters);
}

export async function fetchMachineWiseReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<MachineWiseReportRow[]> {
  return reportsApi.getMachineWiseReport(filters);
}

export async function fetchShiftWiseReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<ShiftWiseReportRow[]> {
  return reportsApi.getShiftWiseReport(filters);
}

export async function fetchRejectionReport(filters: Pick<ReportFilters, 'start_date' | 'end_date'>): Promise<RejectionReportRow[]> {
  return reportsApi.getRejectionReport(filters);
}
