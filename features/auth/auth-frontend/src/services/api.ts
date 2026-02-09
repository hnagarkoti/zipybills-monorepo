/**
 * Auth & User API – uses typed SDK from service-interface
 */

import {
  AuthApi,
  type SafeUser,
  type LoginResponse,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@zipybills/factory-auth-service-interface';
import { setAuthToken } from '@zipybills/factory-api-client';

export type User = SafeUser;
export type AuthResponse = LoginResponse;
export type { SafeUser, CreateUserRequest, UpdateUserRequest } from '@zipybills/factory-auth-service-interface';

export const authApi = new AuthApi();

// ─── Auth ────────────────────────────────────

export async function login(username: string, password: string): Promise<LoginResponse> {
  const data = await authApi.login({ username, password });
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<SafeUser> {
  return authApi.me();
}

export function logout(): void {
  setAuthToken(null);
}

// ─── Users ───────────────────────────────────

export async function fetchUsers(): Promise<SafeUser[]> {
  return authApi.getUsers();
}

export async function createUser(userData: CreateUserRequest): Promise<SafeUser> {
  return authApi.createUser(userData);
}

export async function updateUser(
  userId: number,
  userData: UpdateUserRequest,
): Promise<SafeUser> {
  return authApi.updateUser(userId, userData);
}
