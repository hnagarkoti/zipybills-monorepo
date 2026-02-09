/**
 * Shifts API – uses typed SDK from service-interface
 */

import {
  ShiftsApi,
  type Shift,
  type CreateShiftRequest,
  type UpdateShiftRequest,
} from '@zipybills/factory-shifts-service-interface';

export type { Shift, CreateShiftRequest, UpdateShiftRequest } from '@zipybills/factory-shifts-service-interface';

export const shiftsApi = new ShiftsApi();

export async function fetchShifts(): Promise<Shift[]> {
  return shiftsApi.getShifts();
}

export async function createShift(shiftData: CreateShiftRequest): Promise<Shift> {
  return shiftsApi.createShift(shiftData);
}

export async function updateShift(shiftId: number, shiftData: UpdateShiftRequest): Promise<Shift> {
  return shiftsApi.updateShift(shiftId, shiftData);
}

export async function deleteShift(shiftId: number): Promise<void> {
  return shiftsApi.deleteShift(shiftId);
}
