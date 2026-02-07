import { apiFetch } from '@zipybills/factory-api-client';

export interface Machine {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  department: string | null;
  machine_type: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
}

export async function fetchMachines(): Promise<Machine[]> {
  const data = await apiFetch<{ success: boolean; machines: Machine[] }>('/api/machines');
  return data.machines;
}

export async function createMachine(machineData: {
  machine_code: string;
  machine_name: string;
  department?: string;
  machine_type?: string;
}): Promise<Machine> {
  const data = await apiFetch<{ success: boolean; machine: Machine }>('/api/machines', {
    method: 'POST',
    body: JSON.stringify(machineData),
  });
  return data.machine;
}

export async function updateMachine(machineId: number, machineData: Partial<Machine>): Promise<Machine> {
  const data = await apiFetch<{ success: boolean; machine: Machine }>(`/api/machines/${machineId}`, {
    method: 'PUT',
    body: JSON.stringify(machineData),
  });
  return data.machine;
}

export async function deleteMachine(machineId: number): Promise<void> {
  await apiFetch(`/api/machines/${machineId}`, { method: 'DELETE' });
}
