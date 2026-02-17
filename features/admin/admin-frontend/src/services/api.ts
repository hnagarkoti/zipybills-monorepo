/**
 * Admin Panel API Services
 */
import { apiFetch } from '@zipybills/factory-api-client';

// ─── Types ────────────────────────────────────

export interface SystemDashboard {
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
  users: {
    total_users: number;
    admins: number;
    supervisors: number;
    operators: number;
    active_users: number;
    inactive_users: number;
  };
  machines: {
    total_machines: number;
    running: number;
    idle: number;
    maintenance: number;
    offline_machines: number;
  };
  production: {
    total_plans: number;
    active_plans: number;
    completed_plans: number;
    total_produced: number;
  };
  downtime: {
    total_events: number;
    total_minutes: number;
  };
  activity: { events_24h: number };
  featureFlags: Array<{ feature_id: string; name: string; enabled: boolean; description: string }>;
  timestamp: string;
}

export interface AuditLog {
  activity_id: number;
  user_id: number | null;
  username: string | null;
  full_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ username: string; full_name: string; count: number }>;
}

export interface BackupItem {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
  sizeHuman: string;
  type: 'manual' | 'scheduled';
  createdBy: string | null;
  status: 'completed' | 'failed' | 'in-progress';
  notes: string | null;
}

export interface LicenseInfo {
  valid: boolean;
  status: string;
  tier: string;
  company: string;
  daysRemaining: number;
  machinesUsed: number;
  machinesAllowed: number;
  usersActive: number;
  usersAllowed: number;
  features: string[];
  warnings: string[];
}

// ─── API Calls ────────────────────────────────

export async function fetchAdminDashboard() {
  return apiFetch<{ success: boolean; dashboard: SystemDashboard }>('/api/admin/dashboard');
}

export async function fetchAuditLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.action) qs.set('action', params.action);
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);

  return apiFetch<{
    success: boolean;
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/audit/logs?${qs.toString()}`);
}

export async function fetchAuditStats() {
  return apiFetch<{ success: boolean; stats: AuditStats }>('/api/audit/stats');
}

export async function fetchAuditActions() {
  return apiFetch<{ success: boolean; actions: string[] }>('/api/audit/actions');
}

export async function fetchBackups() {
  return apiFetch<{ success: boolean; backups: BackupItem[] }>('/api/backups');
}

export async function createBackup(notes?: string) {
  return apiFetch<{ success: boolean; backup: BackupItem }>('/api/backups', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function deleteBackup(id: string) {
  return apiFetch<{ success: boolean }>(`/api/backups/${id}`, { method: 'DELETE' });
}

export async function fetchLicenseStatus() {
  // In SaaS mode, use the tenant subscription data which is the real "license"
  try {
    const tenantData = await apiFetch<{
      success: boolean;
      tenant: {
        tenant_id: number;
        company_name: string;
        plan: string;
        status: string;
        max_users: number;
        max_machines: number;
        trial_ends_at: string | null;
        expires_at: string | null;
        is_active: boolean;
        settings: Record<string, any>;
      } | null;
      usage: {
        usersCount: number;
        machinesCount: number;
        plansCount: number;
        logsCount: number;
      };
    }>('/api/tenant/me');

    if (tenantData.success && tenantData.tenant) {
      const t = tenantData.tenant;
      const u = tenantData.usage;

      // Fetch plan features from the API (DB-backed, managed by platform admin)
      let planFeatures: string[] = [];
      try {
        const plansData = await apiFetch<{ plans: Array<{ tenant_plan: string; features: string[] }> }>('/api/billing/plans');
        const match = plansData.plans?.find((p) => p.tenant_plan === t.plan);
        if (match) planFeatures = match.features ?? [];
      } catch {
        // Fallback to hardcoded if billing plans endpoint fails
      }

      if (planFeatures.length === 0) {
        const PLAN_FEATURES_FALLBACK: Record<string, string[]> = {
          FREE: ['auth', 'machines', 'shifts', 'planning', 'dashboard'],
          STARTER: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports'],
          PROFESSIONAL: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme'],
          ENTERPRISE: ['auth', 'machines', 'shifts', 'planning', 'downtime', 'dashboard', 'reports', 'export', 'audit', 'theme', 'backups', 'admin', 'license', 'permissions'],
        };
        planFeatures = PLAN_FEATURES_FALLBACK[t.plan] ?? [];
      }

      // Calculate days remaining from trial_ends_at or expires_at
      let daysRemaining = -1; // -1 means no expiry
      const expiryDate = t.trial_ends_at || t.expires_at;
      if (expiryDate) {
        const diff = new Date(expiryDate).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const warnings: string[] = [];
      if (t.status === 'SUSPENDED') warnings.push('Your account has been suspended. Contact support.');
      if (t.status === 'TRIAL' && daysRemaining >= 0 && daysRemaining <= 7) {
        warnings.push(`Trial expires in ${daysRemaining} day(s). Upgrade your plan to continue.`);
      }
      if (t.max_users > 0 && u.usersCount >= t.max_users) {
        warnings.push(`User limit reached (${u.usersCount}/${t.max_users}).`);
      }
      if (t.max_machines > 0 && u.machinesCount >= t.max_machines) {
        warnings.push(`Machine limit reached (${u.machinesCount}/${t.max_machines}).`);
      }

      const license: LicenseInfo = {
        valid: t.is_active && (t.status === 'ACTIVE' || t.status === 'TRIAL'),
        status: t.status,
        tier: t.plan,
        company: t.company_name,
        daysRemaining: daysRemaining >= 0 ? daysRemaining : -1,
        machinesUsed: u.machinesCount,
        machinesAllowed: t.max_machines,
        usersActive: u.usersCount,
        usersAllowed: t.max_users,
        features: planFeatures,
        warnings,
      };

      return { success: true, license };
    }
  } catch {
    // Fall through to legacy license endpoint for on-prem mode
  }

  // Fallback: on-prem license system
  return apiFetch<{ success: boolean; license: LicenseInfo | null }>('/api/license/status');
}

export async function fetchDbStats() {
  return apiFetch<{
    success: boolean;
    tables: Array<{ table_name: string; row_count: number; total_size: string; size_bytes: number }>;
    connections: { total_connections: number; active: number; idle: number };
  }>('/api/admin/db-stats');
}

export async function toggleFeatureFlag(featureId: string) {
  return apiFetch<{ success: boolean }>(`/api/admin/features/${featureId}/toggle`, { method: 'PATCH' });
}

export async function exportReport(type: string, startDate: string, endDate: string, format: 'csv' | 'json' = 'csv') {
  const qs = new URLSearchParams({ start_date: startDate, end_date: endDate, format });
  return apiFetch<any>(`/api/export/${type}?${qs.toString()}`);
}
