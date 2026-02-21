import React from 'react';
import { useRouter, Redirect } from 'expo-router';
import { LoginPage } from '@zipybills/factory-auth-frontend';
import { useAuthStore, type AuthUser } from '@zipybills/ui-store';
import { apiFetch } from '@zipybills/factory-api-client';

export default function LoginScreen() {
  const { login, setTenantInfo, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // If already authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user) {
    return <Redirect href={user.is_platform_admin ? '/platform' : '/dashboard'} />;
  }

  const handleLogin = async (user: AuthUser, token: string) => {
    // Store user + token in auth state
    login(user, token);

    // H1: Fetch tenant metadata after login for plan awareness and branding
    if (user.tenant_id) {
      try {
        const data = await apiFetch<{ success: boolean; tenant: { tenant_id: number; plan: string; company_name: string; logo_url: string | null } }>('/api/tenant/me');
        if (data.success && data.tenant) {
          setTenantInfo({
            tenant_id: data.tenant.tenant_id,
            plan: data.tenant.plan,
            tenant_name: data.tenant.company_name,
            tenant_logo_url: data.tenant.logo_url ?? undefined,
          });
        }
      } catch {
        // Non-critical — tenant info is optional. User can still proceed.
      }
    }

    // Platform admins go to platform dashboard, tenants go to factory dashboard
    if (user.is_platform_admin) {
      router.replace('/platform');
    } else {
      router.replace('/dashboard');
    }
  };

  return <LoginPage onLogin={handleLogin} />;
}
