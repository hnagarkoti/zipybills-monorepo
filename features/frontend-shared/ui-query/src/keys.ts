/**
 * Centralized query key factory.
 *
 * Pattern: queryKeys.feature.action(params)
 * This ensures consistent cache keys across all features.
 */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
    users: () => ['auth', 'users'] as const,
  },
  machines: {
    all: () => ['machines'] as const,
    detail: (id: number) => ['machines', id] as const,
  },
  shifts: {
    all: () => ['shifts'] as const,
  },
  plans: {
    all: (filters?: Record<string, unknown>) => ['plans', filters] as const,
    detail: (id: number) => ['plans', id] as const,
  },
  productionLogs: {
    all: (filters?: Record<string, unknown>) => ['production-logs', filters] as const,
  },
  downtime: {
    all: (filters?: Record<string, unknown>) => ['downtime', filters] as const,
  },
  dashboard: {
    summary: () => ['dashboard'] as const,
  },
  reports: {
    production: (params: Record<string, unknown>) => ['reports', 'production', params] as const,
    machineWise: (params: Record<string, unknown>) => ['reports', 'machine-wise', params] as const,
    shiftWise: (params: Record<string, unknown>) => ['reports', 'shift-wise', params] as const,
    rejections: (params: Record<string, unknown>) => ['reports', 'rejections', params] as const,
  },
} as const;
