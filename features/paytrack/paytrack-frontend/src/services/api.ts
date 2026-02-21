/**
 * PayTrack Frontend – API Service Wrapper
 * Re-exports all typed API functions from the service interface.
 */

export {
  // Types
  type Vendor,
  type Project,
  type Material,
  type Payment,
  type DashboardStats,
  type MaterialFilters,
  // Vendor API
  fetchVendors,
  fetchVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  // Project API
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  // Material API
  fetchMaterials,
  fetchMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  // Workflow
  approveMaterial,
  requestPayment,
  rejectMaterial,
  markAsPaid,
  // Payments
  fetchPayments,
  // Dashboard
  fetchDashboard,
  // Duplicate check
  checkInvoice,
} from '@zipybills/paytrack-service-interface';
