import { useAuthStore } from './store';

export const useAuth = () => {
  const auth = useAuthStore();

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login: auth.login,
    register: auth.register,
    loginWithOAuth: auth.loginWithOAuth,
    logout: auth.logout,
  };
};

export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  const can = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  return { can, hasRole };
};
