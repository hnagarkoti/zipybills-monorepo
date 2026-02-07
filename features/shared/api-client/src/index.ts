/**
 * FactoryOS Shared API Client
 *
 * Centralised HTTP utility used by every feature-frontend package.
 * Manages auth-token state and provides a typed `apiFetch<T>()` helper.
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

// ─── Typed Fetch ─────────────────────────────

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}
