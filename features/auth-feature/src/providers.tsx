import React, { useEffect } from 'react';

import { useAuthStore } from './store';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const refreshAuth = useAuthStore((state) => state.refreshAuth);

  useEffect(() => {
    // Refresh token on app start
    refreshAuth();

    // Set up periodic token refresh (every 14 minutes)
    const interval = setInterval(() => {
      refreshAuth();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAuth]);

  return <>{children}</>;
};
