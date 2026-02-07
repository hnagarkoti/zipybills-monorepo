/**
 * Auth & User API functions
 */

import { apiFetch, setAuthToken } from '@zipybills/factory-api-client';

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// ─── Auth ────────────────────────────────────

export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const data = await apiFetch<{ success: boolean; user: User }>('/api/auth/me');
  return data.user;
}

export function logout(): void {
  setAuthToken(null);
}

// ─── Users ───────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const data = await apiFetch<{ success: boolean; users: User[] }>('/api/users');
  return data.users;
}

export async function createUser(userData: {
  username: string;
  password: string;
  full_name: string;
  role: string;
}): Promise<User> {
  const data = await apiFetch<{ success: boolean; user: User }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return data.user;
}

export async function updateUser(
  userId: number,
  userData: Partial<User & { password?: string }>,
): Promise<User> {
  const data = await apiFetch<{ success: boolean; user: User }>(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
  return data.user;
}
