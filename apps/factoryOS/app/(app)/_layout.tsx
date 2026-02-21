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
  AlertTriangle, Clock, BarChart3, Users, LogOut, Settings,
  ShieldCheck, Palette, Shield, HardDrive, Globe,
} from 'lucide-react-native';
import { AppShell, type NavItem, type BreadcrumbItem } from '@zipybills/factory-home-frontend';
import { useAuthStore } from '@zipybills/ui-store';
import { Avatar, ServerErrorPage } from '@zipybills/ui-components';
import { useFeatureFlags } from '@zipybills/factory-feature-registry/react';
import { colors } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';

/* ─── Route definitions ───────────────────────── */

const ICON_SIZE = 18;

interface RouteConfig {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  roles?: string[];
  featureId?: string;
  minPlan?: string;
  children?: RouteConfig[];
}

const ROUTES: RouteConfig[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={ICON_SIZE} />, featureId: 'dashboard' },
  {
    href: '/plans', labelKey: 'nav.planning', icon: <ClipboardList size={ICON_SIZE} />, featureId: 'planning',
    children: [
      { href: '/plans/operator', labelKey: 'nav.operatorInput', icon: <Pencil size={ICON_SIZE} />, featureId: 'planning' },
    ],
  },
  { href: '/machines', labelKey: 'nav.machines', icon: <Factory size={ICON_SIZE} />, featureId: 'machines' },
  { href: '/downtime', labelKey: 'nav.downtime', icon: <AlertTriangle size={ICON_SIZE} />, featureId: 'downtime', minPlan: 'STARTER' },
  { href: '/shifts', labelKey: 'nav.shifts', icon: <Clock size={ICON_SIZE} />, roles: ['ADMIN', 'SUPERVISOR'], featureId: 'shifts' },
  { href: '/reports', labelKey: 'nav.reports', icon: <BarChart3 size={ICON_SIZE} />, roles: ['ADMIN', 'SUPERVISOR'], featureId: 'reports', minPlan: 'STARTER' },
  { href: '/users', labelKey: 'nav.users', icon: <Users size={ICON_SIZE} />, roles: ['ADMIN'], featureId: 'auth' },
  {
    href: '/settings', labelKey: 'nav.settings', icon: <Settings size={ICON_SIZE} />,
    children: [
      { href: '/settings/appearance', labelKey: 'nav.appearance', icon: <Palette size={ICON_SIZE} /> },
      { href: '/settings/language', labelKey: 'nav.language', icon: <Globe size={ICON_SIZE} /> },
      { href: '/settings/compliance', labelKey: 'nav.compliance', icon: <Shield size={ICON_SIZE} />, roles: ['ADMIN', 'SUPERVISOR'] },
      { href: '/settings/backup', labelKey: 'nav.backupData', icon: <HardDrive size={ICON_SIZE} />, roles: ['ADMIN'] },
    ],
  },
  { href: '/admin', labelKey: 'nav.admin', icon: <ShieldCheck size={ICON_SIZE} />, roles: ['ADMIN'] },
];

/* ─── Expo Router ErrorBoundary ───────────────── */

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <ServerErrorPage
      error={error}
      onRetry={retry}
    />
  );
}

/* ─── Layout ──────────────────────────────────── */

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  /* Feature flags – must be called before any early return (Rules of Hooks) */
  const flags = useFeatureFlags();
  const { t } = useLocale();

  /* Auth guard – redirect to login if not authenticated */
  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  /* Platform admins should not access tenant routes */
  if (user.is_platform_admin) {
    return <Redirect href="/platform" />;
  }

  /* H3: Plan hierarchy for feature gating */
  const PLAN_ORDER = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const userPlanIndex = user.plan ? PLAN_ORDER.indexOf(user.plan) : -1;

  /** Check if a route passes role + feature-flag + plan filters */
  const isRouteVisible = (r: RouteConfig): boolean => {
    if (r.roles && !r.roles.includes(user.role)) return false;
    if (r.featureId && flags[r.featureId]?.ui === 'DISABLED') return false;
    // H3: Plan-based visibility — hide features above user's plan tier
    if (r.minPlan && user.plan) {
      const requiredIndex = PLAN_ORDER.indexOf(r.minPlan);
      if (userPlanIndex >= 0 && userPlanIndex < requiredIndex) return false;
    }
    return true;
  };

  const visibleRoutes = ROUTES.filter(isRouteVisible);

  /** Convert a RouteConfig to a NavItem, including children */
  const toNavItem = (r: RouteConfig): NavItem => {
    const isExact = pathname === r.href;
    const isPrefix = r.href !== '/dashboard' && pathname.startsWith(r.href + '/');
    const isActive = isExact || (isPrefix && !(r.children && r.children.length > 0));

    const navItem: NavItem = {
      id: r.href,
      label: t(r.labelKey),
      icon: r.icon,
      isActive,
      onPress: () => router.push(r.href as never),
    };

    // Build children dropdown items
    if (r.children && r.children.length > 0) {
      const visibleChildren = r.children.filter(isRouteVisible);
      if (visibleChildren.length > 0) {
        navItem.children = visibleChildren.map((child) => ({
          id: child.href,
          label: t(child.labelKey),
          icon: child.icon,
          isActive: pathname === child.href,
          onPress: () => router.push(child.href as never),
        }));
      }
    }

    return navItem;
  };

  /* Build NavItem[] for Sidebar & BottomNav */
  const navItems: NavItem[] = visibleRoutes.map(toNavItem);

  /** Flatten routes (including children) for activeRoute lookup */
  const allRoutes = visibleRoutes.flatMap((r) => [r, ...(r.children?.filter(isRouteVisible) ?? [])]);
  const activeRoute = allRoutes.find(
    (r) => pathname === r.href || pathname.startsWith(r.href + '/'),
  );

  /* ─── Build breadcrumbs from route hierarchy ─── */
  const breadcrumbs: BreadcrumbItem[] = [];
  // Find the parent route that owns this path
  const parentRoute = visibleRoutes.find(
    (r) => pathname === r.href || pathname.startsWith(r.href + '/') || r.children?.some((c) => pathname === c.href),
  );
  if (parentRoute) {
    breadcrumbs.push({
      label: t(parentRoute.labelKey),
      href: parentRoute.href,
      onPress: () => router.push(parentRoute.href as never),
    });
    // Check if we're on a child route
    const childRoute = parentRoute.children?.find((c) => pathname === c.href);
    if (childRoute) {
      breadcrumbs.push({ label: t(childRoute.labelKey) });
    }
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppShell
      navItems={navItems}
      title={activeRoute ? t(activeRoute.labelKey) : 'FactoryOS'}
      breadcrumbs={breadcrumbs}
      brandName="FactoryOS"
      brandLogoUrl={user.tenant_logo_url}
      brandSubtitle={
        user.tenant_name
          ? `${user.tenant_name} · ${user.full_name} · ${t('roles.' + user.role) || user.role}${user.plan ? ` (${user.plan})` : ''}`
          : `${user.full_name} · ${t('roles.' + user.role) || user.role}`
      }
      sidebarFooter={
        <Pressable onPress={handleLogout} className="flex-row items-center py-2">
          <LogOut size={14} color={colors.gray[400]} />
          <Text className="text-xs text-slate-400 ml-2">{t('common.signOut')}</Text>
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.full_name}</Text>
            <Text className="text-xs text-gray-400">{t('roles.' + user.role) || user.role}</Text>
          </View>
          <Avatar name={user.full_name} size="sm" />
          <Pressable
            onPress={handleLogout}
            className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg ml-2"
          >
            <Text className="text-xs text-gray-600 dark:text-gray-400">{t('common.signOut')}</Text>
          </Pressable>
        </View>
      }
      mobileHeaderRight={
        <Avatar name={user.full_name} size="sm" />
      }
    >
      <Slot />
    </AppShell>
  );
}
