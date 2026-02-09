/**
 * FactoryOS Shared API Client
 *
 * Centralised HTTP utility used by every feature-frontend package.
 * Provides:
 *  - Configuration class (basePath, auth token)
 *  - BaseApi class (typed HTTP methods)
 *  - Legacy apiFetch<T>() for backward compat
 */

import { Platform } from 'react-native';

// ─── Base URL ────────────────────────────────

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:4000';
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
};

export const API_BASE = getBaseUrl();

// ─── Auth Token ──────────────────────────────

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// ─── Configuration ───────────────────────────

export interface ConfigurationParameters {
  basePath?: string;
  /** API version prefix, e.g. "v1" (default), "v2" */
  apiVersion?: string;
  getAccessToken?: () => string | null;
}

export class Configuration {
  readonly basePath: string;
  /** API version prefix (e.g. "v1") */
  readonly apiVersion: string;
  readonly getAccessToken: () => string | null;

  constructor(params?: ConfigurationParameters) {
    this.basePath = params?.basePath ?? API_BASE;
    this.apiVersion = params?.apiVersion ?? 'v1';
    this.getAccessToken = params?.getAccessToken ?? getAuthToken;
  }
}

// ─── Base API Client ─────────────────────────

export class BaseApi {
  protected readonly config: Configuration;

  constructor(config?: Configuration) {
    this.config = config ?? new Configuration();
  }

  protected async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    const token = this.config.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Inject API version: /api/machines → /api/v1/machines
    const versionedPath = path.startsWith('/api/')
      ? path.replace('/api/', `/api/${this.config.apiVersion}/`)
      : path;

    const res = await fetch(`${this.config.basePath}${versionedPath}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
    }

    return data as T;
  }

  protected buildQuery(params: object): string {
    const entries = Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] => {
        const v = entry[1];
        return v != null && ['string', 'number', 'boolean'].includes(typeof v);
      },
    );
    if (entries.length === 0) return '';
    const qs = new URLSearchParams(entries.map(([k, v]): [string, string] => [k, String(v)]));
    return `?${qs.toString()}`;
  }
}

// ─── Legacy apiFetch (backward compat) ───────

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Inject default v1 version: /api/machines → /api/v1/machines
  const versionedPath = path.startsWith('/api/')
    ? path.replace('/api/', '/api/v1/')
    : path;

  const res = await fetch(`${API_BASE}${versionedPath}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return data as T;
}
