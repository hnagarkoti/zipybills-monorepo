/**
 * (app)/_layout – Authenticated shell layout
 *
 * Wraps all authenticated routes with:
 * - Auth guard (redirects to /login if unauthenticated)
 * - Feature flag filtering (hides disabled features from nav)
 * - AppShell (sidebar, header, bottom nav)
 * - Expo Router <Slot /> for child route rendering
 *
 * Navigation uses real URLs:
 *   /dashboard, /machines, /plans, /shifts, etc.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Slot, Redirect, usePathname, useRouter } from 'expo-router';
import {
  LayoutDashboard, ClipboardList, Pencil, Factory,
  AlertTriangle, Clock, BarChart3, Users, LogOut,
} from 'lucide-react-native';
import { AppShell, type NavItem } from '@zipybills/factory-home-frontend';
import { useAuthStore } from '@zipybills/ui-store';
import { Avatar, ServerErrorPage } from '@zipybills/ui-components';
import { useFeatureFlags } from '@zipybills/factory-feature-registry/react';

/* ─── Route definitions ───────────────────────── */

const ICON_SIZE = 18;

interface RouteConfig {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  /** Feature ID for feature-flag gating. If set, route is hidden when feature UI is disabled. */
  featureId?: string;
}

const ROUTES: RouteConfig[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={ICON_SIZE} />, featureId: 'dashboard' },
  { href: '/plans', label: 'Planning', icon: <ClipboardList size={ICON_SIZE} />, featureId: 'planning' },
  { href: '/plans/operator', label: 'Operator Input', icon: <Pencil size={ICON_SIZE} />, featureId: 'planning' },
  { href: '/machines', label: 'Machines', icon: <Factory size={ICON_SIZE} />, featureId: 'machines' },
  { href: '/downtime', label: 'Downtime', icon: <AlertTriangle size={ICON_SIZE} />, featureId: 'downtime' },
  { href: '/shifts', label: 'Shifts', icon: <Clock size={ICON_SIZE} />, roles: ['ADMIN', 'SUPERVISOR'], featureId: 'shifts' },
  { href: '/reports', label: 'Reports', icon: <BarChart3 size={ICON_SIZE} />, roles: ['ADMIN', 'SUPERVISOR'], featureId: 'reports' },
  { href: '/users', label: 'Users', icon: <Users size={ICON_SIZE} />, roles: ['ADMIN'], featureId: 'auth' },
];

/* ─── Expo Router ErrorBoundary ───────────────── */

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <ServerErrorPage
      error={error}
      onRetry={retry}
      onGoHome={() => {
        // Force navigation to dashboard on error recovery
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }}
    />
  );
}

/* ─── Layout ──────────────────────────────────── */

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  /* Auth guard – redirect to login if not authenticated */
  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  /* Filter nav items by user role AND feature flags */
  const flags = useFeatureFlags();

  const visibleRoutes = ROUTES.filter((r) => {
    // Role-based filter
    if (r.roles && !r.roles.includes(user.role)) return false;
    // Feature-flag filter: hide if feature UI is DISABLED
    if (r.featureId && flags[r.featureId]?.ui === 'DISABLED') return false;
    return true;
  });

  /* Build NavItem[] for Sidebar & BottomNav */
  const navItems: NavItem[] = visibleRoutes.map((r) => ({
    id: r.href,
    label: r.label,
    icon: r.icon,
    isActive: pathname === r.href || (r.href !== '/dashboard' && pathname.startsWith(r.href + '/')),
    onPress: () => router.push(r.href as never),
  }));

  const activeRoute = visibleRoutes.find(
    (r) => pathname === r.href || pathname.startsWith(r.href + '/'),
  );

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppShell
      navItems={navItems}
      title={activeRoute?.label ?? 'FactoryOS'}
      brandName="FactoryOS"
      brandSubtitle={`${user.full_name} · ${user.role}`}
      sidebarFooter={
        <Pressable onPress={handleLogout} className="flex-row items-center py-2">
          <LogOut size={14} color="#94a3b8" />
          <Text className="text-xs text-slate-400 ml-2">Sign Out</Text>
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-sm font-medium text-gray-700">{user.full_name}</Text>
            <Text className="text-xs text-gray-400">{user.role}</Text>
          </View>
          <Avatar name={user.full_name} size="sm" />
          <Pressable
            onPress={handleLogout}
            className="bg-gray-100 px-3 py-1.5 rounded-lg ml-2"
          >
            <Text className="text-xs text-gray-600">Sign Out</Text>
          </Pressable>
        </View>
      }
    >
      <Slot />
    </AppShell>
  );
}
