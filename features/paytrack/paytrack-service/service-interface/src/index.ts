/**
 * PayTrack Service Interface
 * Types + typed API client for frontend consumption.
 */

import { apiFetch } from '@zipybills/factory-api-client';

/* ═══════════════════════ TYPES ═══════════════════════ */

export interface Vendor {
  id: number;
  tenant_id: number;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  notes?: string;
  total_billed?: number;
  total_paid?: number;
  material_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  tenant_id: number;
  name: string;
  client_name?: string;
  description?: string;
  budget?: number;
  status: 'active' | 'completed' | 'on_hold';
  material_count?: number;
  total_requested?: number;
  total_paid?: number;
  pending_amount?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  tenant_id: number;
  project_id: number;
  vendor_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  invoice_number?: string;
  invoice_image_url?: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  notes?: string;
  status: 'pending' | 'approved' | 'payment_requested' | 'paid' | 'rejected';
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  project_name?: string;
  vendor_name?: string;
  created_by_name?: string;
  approved_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  tenant_id: number;
  material_id: number;
  payment_mode: 'upi' | 'bank' | 'cash' | 'paytm' | 'cheque';
  transaction_id?: string;
  payment_date: string;
  paid_amount: number;
  proof_image_url?: string;
  notes?: string;
  material_name?: string;
  invoice_number?: string;
  project_name?: string;
  vendor_name?: string;
  paid_by_name?: string;
  created_by: number;
  created_at: string;
}

export interface DashboardStats {
  summary: {
    total_materials: number;
    pending_count: number;
    approved_count: number;
    requested_count: number;
    paid_count: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
  };
  projects: Array<{
    id: number;
    name: string;
    client_name?: string;
    material_count: number;
    total_requested: number;
    total_paid: number;
    pending_amount: number;
  }>;
  vendors: Array<{
    id: number;
    name: string;
    material_count: number;
    total_billed: number;
    total_paid: number;
  }>;
  recent: Array<{
    id: number;
    material_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    project_name: string;
    vendor_name: string;
  }>;
  monthly: Array<{
    month: string;
    total: number;
    paid: number;
    entries: number;
  }>;
}

export interface MaterialFilters {
  project_id?: number;
  vendor_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/* ═══════════════════════ API CLIENT ═══════════════════════ */

const BASE = '/api/paytrack';

// Vendors
export const fetchVendors = () => apiFetch<{ vendors: Vendor[] }>(`${BASE}/vendors`);
export const fetchVendor = (id: number) => apiFetch<{ vendor: Vendor }>(`${BASE}/vendors/${id}`);
export const createVendor = (data: Partial<Vendor>) => apiFetch<{ vendor: Vendor }>(`${BASE}/vendors`, { method: 'POST', body: JSON.stringify(data) });
export const updateVendor = (id: number, data: Partial<Vendor>) => apiFetch<{ vendor: Vendor }>(`${BASE}/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVendor = (id: number) => apiFetch(`${BASE}/vendors/${id}`, { method: 'DELETE' });

// Projects
export const fetchProjects = () => apiFetch<{ projects: Project[] }>(`${BASE}/projects`);
export const fetchProject = (id: number) => apiFetch<{ project: Project; materials: Material[] }>(`${BASE}/projects/${id}`);
export const createProject = (data: Partial<Project>) => apiFetch<{ project: Project }>(`${BASE}/projects`, { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id: number, data: Partial<Project>) => apiFetch<{ project: Project }>(`${BASE}/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProject = (id: number) => apiFetch(`${BASE}/projects/${id}`, { method: 'DELETE' });

// Materials
export const fetchMaterials = (filters?: MaterialFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  }
  const qs = params.toString();
  return apiFetch<{ materials: Material[] }>(`${BASE}/materials${qs ? `?${qs}` : ''}`);
};
export const fetchMaterial = (id: number) => apiFetch<{ material: Material; payments: Payment[] }>(`${BASE}/materials/${id}`);
export const createMaterial = (data: Partial<Material>) => apiFetch<{ material: Material }>(`${BASE}/materials`, { method: 'POST', body: JSON.stringify(data) });
export const updateMaterial = (id: number, data: Partial<Material>) => apiFetch<{ material: Material }>(`${BASE}/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaterial = (id: number) => apiFetch(`${BASE}/materials/${id}`, { method: 'DELETE' });

// Workflow
export const approveMaterial = (id: number) => apiFetch<{ material: Material }>(`${BASE}/materials/${id}/approve`, { method: 'POST' });
export const requestPayment = (id: number) => apiFetch<{ material: Material }>(`${BASE}/materials/${id}/request-payment`, { method: 'POST' });
export const rejectMaterial = (id: number, notes?: string) => apiFetch<{ material: Material }>(`${BASE}/materials/${id}/reject`, { method: 'POST', body: JSON.stringify({ notes }) });
export const markAsPaid = (id: number, data: { payment_mode: string; transaction_id?: string; payment_date?: string; paid_amount?: number; proof_image_url?: string; notes?: string }) =>
  apiFetch<{ payment: Payment }>(`${BASE}/materials/${id}/pay`, { method: 'POST', body: JSON.stringify(data) });

// Payments
export const fetchPayments = (filters?: { material_id?: number; date_from?: string; date_to?: string }) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
  }
  const qs = params.toString();
  return apiFetch<{ payments: Payment[] }>(`${BASE}/payments${qs ? `?${qs}` : ''}`);
};

// Dashboard
export const fetchDashboard = () => apiFetch<DashboardStats>(`${BASE}/dashboard`);

// Duplicate check
export const checkInvoice = (number: string, vendorId?: number) => {
  const params = new URLSearchParams({ number });
  if (vendorId) params.set('vendor_id', String(vendorId));
  return apiFetch<{ duplicates: any[]; hasDuplicate: boolean }>(`${BASE}/check-invoice?${params}`);
};
