/**
 * FactoryOS Auth Service Interface
 *
 * Types, API contract, and typed SDK client for authentication & user management.
 */

import { BaseApi } from '@zipybills/factory-api-client';

export { Configuration, type ConfigurationParameters } from '@zipybills/factory-api-client';

// ─── Types ───────────────────────────────────

export interface User {
  user_id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface LoginRequest {
  username: string;
  password: string;
  /** Workspace slug — required for SaaS multi-tenant login */
  tenant_slug: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: SafeUser & { tenant_id?: number; plan?: string; is_platform_admin?: boolean; permissions?: string[] };
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
}

export interface UpdateUserRequest {
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

// ─── Typed API Client ────────────────────────

export class AuthApi extends BaseApi {
  async login(req: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/saas/login', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async me(): Promise<SafeUser> {
    const data = await this.request<{ success: boolean; user: SafeUser }>('/api/auth/me');
    return data.user;
  }

  async getUsers(): Promise<SafeUser[]> {
    const data = await this.request<{ success: boolean; users: SafeUser[] }>('/api/users');
    return data.users;
  }

  async createUser(req: CreateUserRequest): Promise<SafeUser> {
    const data = await this.request<{ success: boolean; user: SafeUser }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return data.user;
  }

  async updateUser(userId: number, req: UpdateUserRequest): Promise<SafeUser> {
    const data = await this.request<{ success: boolean; user: SafeUser }>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
    return data.user;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.request(`/api/users/${userId}`, { method: 'DELETE' });
  }
}
