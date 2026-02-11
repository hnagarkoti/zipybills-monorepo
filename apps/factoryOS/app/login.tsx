import React from 'react';
import { useRouter } from 'expo-router';
import { LoginPage } from '@zipybills/factory-auth-frontend';
import { useAuthStore, type AuthUser } from '@zipybills/ui-store';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = (user: AuthUser, token: string) => {
    login(user, token);
    router.replace('/dashboard');
  };

  return <LoginPage onLogin={handleLogin} />;
}
