/**
 * (platform)/_layout – Platform Admin shell layout
 *
 * Wraps all platform admin routes with:
 * - Auth guard + platform admin check (redirects to /login if not platform admin)
 * - AppShell with platform-specific navigation
 * - Expo Router <Slot /> for child route rendering
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Slot, Redirect, usePathname, useRouter } from 'expo-router';
import {
  LayoutDashboard, Building2, CreditCard, Activity,
  ShieldAlert, LogOut, Bell, BarChart3, Users, HardDrive,
} from 'lucide-react-native';
import { AppShell, type NavItem, type BreadcrumbItem } from '@zipybills/factory-home-frontend';
import { useAuthStore } from '@zipybills/ui-store';
import { Avatar, ServerErrorPage } from '@zipybills/ui-components';
import { colors, useTheme } from '@zipybills/theme-engine';

const ICON_SIZE = 18;

interface RouteConfig {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const PLATFORM_ROUTES: RouteConfig[] = [
  { href: '/platform', label: 'Overview', icon: <LayoutDashboard size={ICON_SIZE} /> },
  { href: '/platform/tenants', label: 'Tenants', icon: <Building2 size={ICON_SIZE} /> },
  { href: '/platform/users', label: 'Users', icon: <Users size={ICON_SIZE} /> },
  { href: '/platform/plans', label: 'Plans & Billing', icon: <CreditCard size={ICON_SIZE} /> },
  { href: '/platform/activity', label: 'Activity & Audit', icon: <Activity size={ICON_SIZE} /> },
  { href: '/platform/health', label: 'System Health', icon: <ShieldAlert size={ICON_SIZE} /> },
  { href: '/platform/announcements', label: 'Announcements', icon: <Bell size={ICON_SIZE} /> },
  { href: '/platform/backups', label: 'Backups', icon: <HardDrive size={ICON_SIZE} /> },
  { href: '/platform/analytics', label: 'Analytics', icon: <BarChart3 size={ICON_SIZE} /> },
];

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ServerErrorPage error={error} onRetry={retry} />;
}

export default function PlatformLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { setComplianceMode } = useTheme();

  // Platform admin should never see tenant compliance modes (e.g. Validation Mode)
  // Reset to standard on mount in case a tenant admin set it in the same browser session
  useEffect(() => {
    setComplianceMode('standard');
  }, [setComplianceMode]);

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  // Only platform admins can access this layout
  if (!user.is_platform_admin) {
    return <Redirect href="/dashboard" />;
  }

  const navItems: NavItem[] = PLATFORM_ROUTES.map((r) => ({
    id: r.href,
    label: r.label,
    icon: r.icon,
    isActive: r.href === '/platform'
      ? pathname === '/platform'
      : pathname.startsWith(r.href),
    onPress: () => router.push(r.href as never),
  }));

  const activeRoute = PLATFORM_ROUTES.find(
    (r) => r.href === '/platform'
      ? pathname === '/platform'
      : pathname.startsWith(r.href),
  );

  const breadcrumbs: BreadcrumbItem[] = [];
  if (activeRoute) {
    breadcrumbs.push({ label: activeRoute.label });
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppShell
      navItems={navItems}
      title={activeRoute?.label ?? 'Platform Admin'}
      breadcrumbs={breadcrumbs}
      brandName="FactoryOS"
      brandSubtitle="Platform Administration"
      sidebarFooter={
        <Pressable onPress={handleLogout} className="flex-row items-center py-2">
          <LogOut size={14} color={colors.gray[400]} />
          <Text className="text-xs text-slate-400 ml-2">Sign Out</Text>
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.full_name}</Text>
            <Text className="text-xs text-emerald-500 font-medium">Platform Admin</Text>
          </View>
          <Avatar name={user.full_name} size="sm" />
          <Pressable
            onPress={handleLogout}
            className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg ml-2"
          >
            <Text className="text-xs text-gray-600 dark:text-gray-400">Sign Out</Text>
          </Pressable>
        </View>
      }
      mobileHeaderRight={<Avatar name={user.full_name} size="sm" />}
    >
      <Slot />
    </AppShell>
  );
}
