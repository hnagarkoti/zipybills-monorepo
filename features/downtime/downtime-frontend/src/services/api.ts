/**
 * Downtime API – uses typed SDK from service-interface
 */

import {
  DowntimeApi,
  type DowntimeLog,
  type CreateDowntimeRequest,
  type DowntimeFilters,
} from '@zipybills/factory-downtime-service-interface';

export type { DowntimeLog, CreateDowntimeRequest, DowntimeFilters } from '@zipybills/factory-downtime-service-interface';

export const downtimeApi = new DowntimeApi();

export async function fetchDowntimeLogs(filters?: DowntimeFilters): Promise<DowntimeLog[]> {
  return downtimeApi.getDowntimeLogs(filters);
}

export async function createDowntimeLog(downtimeData: CreateDowntimeRequest): Promise<DowntimeLog> {
  return downtimeApi.createDowntimeLog(downtimeData);
}

export async function endDowntimeLog(downtimeId: number): Promise<DowntimeLog> {
  return downtimeApi.endDowntimeLog(downtimeId);
}
