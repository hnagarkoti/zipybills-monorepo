import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  LayoutDashboard, ClipboardList, Pencil, Factory,
  AlertTriangle, Clock, BarChart3, Users, LogOut,
} from 'lucide-react-native';
import { AppShell, type NavItem } from './layout';
import { useAuthStore, type AuthUser } from '@zipybills/ui-store';
import { colors } from '@zipybills/theme-engine';
import { LoginPage, UsersPage } from '@zipybills/factory-auth-frontend';
import { DashboardPage } from '@zipybills/factory-dashboard-frontend';
import { MachinesPage } from '@zipybills/factory-machines-frontend';
import { ShiftsPage } from '@zipybills/factory-shifts-frontend';
import { ProductionPlanPage, OperatorInputPage } from '@zipybills/factory-planning-frontend';
import { DowntimePage } from '@zipybills/factory-downtime-frontend';
import { ReportsPage } from '@zipybills/factory-reports-frontend';
import { Avatar } from '@zipybills/ui-components';

type PageId =
  | 'dashboard'
  | 'machines'
  | 'plans'
  | 'operator'
  | 'downtime'
  | 'shifts'
  | 'reports'
  | 'users';

const ICON_SIZE = 18;
const ICON_MAP: Record<PageId, React.ReactNode> = {
  dashboard: <LayoutDashboard size={ICON_SIZE} />,
  plans: <ClipboardList size={ICON_SIZE} />,
  operator: <Pencil size={ICON_SIZE} />,
  machines: <Factory size={ICON_SIZE} />,
  downtime: <AlertTriangle size={ICON_SIZE} />,
  shifts: <Clock size={ICON_SIZE} />,
  reports: <BarChart3 size={ICON_SIZE} />,
  users: <Users size={ICON_SIZE} />,
};

const PAGE_DEFS: { id: PageId; label: string; roles?: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'plans', label: 'Planning' },
  { id: 'operator', label: 'Operator Input' },
  { id: 'machines', label: 'Machines' },
  { id: 'downtime', label: 'Downtime' },
  { id: 'shifts', label: 'Shifts', roles: ['ADMIN', 'SUPERVISOR'] },
  { id: 'reports', label: 'Reports', roles: ['ADMIN', 'SUPERVISOR'] },
  { id: 'users', label: 'Users', roles: ['ADMIN'] },
];

const PAGE_COMPONENTS: Record<PageId, React.ComponentType> = {
  dashboard: DashboardPage,
  machines: MachinesPage,
  plans: ProductionPlanPage,
  operator: OperatorInputPage,
  downtime: DowntimePage,
  shifts: ShiftsPage,
  reports: ReportsPage,
  users: UsersPage,
};

export function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const handleLogin = (loggedInUser: AuthUser, token: string) => {
    login(loggedInUser, token);
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const visiblePages = PAGE_DEFS.filter(
    (p) => !p.roles || p.roles.includes(user.role),
  );

  const navItems: NavItem[] = visiblePages.map((p) => ({
    id: p.id,
    label: p.label,
    icon: ICON_MAP[p.id],
    isActive: currentPage === p.id,
    onPress: () => setCurrentPage(p.id),
  }));

  const activePageDef = PAGE_DEFS.find((p) => p.id === currentPage);
  const ActivePage = PAGE_COMPONENTS[currentPage] ?? DashboardPage;

  return (
    <AppShell
      navItems={navItems}
      title={activePageDef?.label ?? 'FactoryOS'}
      brandName="FactoryOS"
      brandSubtitle={`${user.full_name} · ${user.role}`}
      sidebarFooter={
        <Pressable onPress={logout} className="flex-row items-center py-2">
          <LogOut size={14} color={colors.gray[400]} />
          <Text className="text-xs text-slate-400 ml-2">Sign Out</Text>
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.full_name}</Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500">{user.role}</Text>
          </View>
          <Avatar name={user.full_name} size="sm" />
          <Pressable onPress={logout} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg ml-2">
            <Text className="text-xs text-gray-600 dark:text-gray-400">Sign Out</Text>
          </Pressable>
        </View>
      }
    >
      <ActivePage />
    </AppShell>
  );
}
