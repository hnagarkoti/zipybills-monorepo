/**
 * FactoryOS Auth Service Interface
 *
 * Types and API contract for authentication & user management.
 * Shared between service-runtime (backend) and auth-frontend (UI).
 */

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
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: SafeUser;
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
