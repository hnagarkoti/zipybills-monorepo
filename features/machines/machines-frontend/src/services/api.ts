/**
 * Machines API – uses typed SDK from service-interface
 */

import {
  MachinesApi,
  type Machine,
  type CreateMachineRequest,
  type UpdateMachineRequest,
} from '@zipybills/factory-machines-service-interface';

export type { Machine, CreateMachineRequest, UpdateMachineRequest } from '@zipybills/factory-machines-service-interface';

export const machinesApi = new MachinesApi();

export async function fetchMachines(): Promise<Machine[]> {
  return machinesApi.getMachines();
}

export async function createMachine(machineData: CreateMachineRequest): Promise<Machine> {
  return machinesApi.createMachine(machineData);
}

export async function updateMachine(machineId: number, machineData: UpdateMachineRequest): Promise<Machine> {
  return machinesApi.updateMachine(machineId, machineData);
}

export async function deleteMachine(machineId: number): Promise<void> {
  return machinesApi.deleteMachine(machineId);
}
