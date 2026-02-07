import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppShell, type NavItem } from './layout';
import { setAuthToken } from '@zipybills/factory-api-client';
import { LoginPage, UsersPage } from '@zipybills/factory-auth-frontend';
import { DashboardPage } from '@zipybills/factory-dashboard-frontend';
import { MachinesPage } from '@zipybills/factory-machines-frontend';
import { ShiftsPage } from '@zipybills/factory-shifts-frontend';
import { ProductionPlanPage, OperatorInputPage } from '@zipybills/factory-planning-frontend';
import { DowntimePage } from '@zipybills/factory-downtime-frontend';
import { ReportsPage } from '@zipybills/factory-reports-frontend';

type PageId =
  | 'dashboard'
  | 'machines'
  | 'plans'
  | 'operator'
  | 'downtime'
  | 'shifts'
  | 'reports'
  | 'users';

interface AuthUser {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
}

const PAGE_DEFS: { id: PageId; label: string; icon: string; roles?: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'plans', label: 'Planning', icon: '📋' },
  { id: 'operator', label: 'Operator Input', icon: '✏️' },
  { id: 'machines', label: 'Machines', icon: '🏭' },
  { id: 'downtime', label: 'Downtime', icon: '⚠️' },
  { id: 'shifts', label: 'Shifts', icon: '⏰', roles: ['ADMIN', 'SUPERVISOR'] },
  { id: 'reports', label: 'Reports', icon: '📈', roles: ['ADMIN', 'SUPERVISOR'] },
  { id: 'users', label: 'Users', icon: '👤', roles: ['ADMIN'] },
];

function renderPage(pageId: PageId): React.ReactNode {
  switch (pageId) {
    case 'dashboard':
      return <DashboardPage />;
    case 'machines':
      return <MachinesPage />;
    case 'plans':
      return <ProductionPlanPage />;
    case 'operator':
      return <OperatorInputPage />;
    case 'downtime':
      return <DowntimePage />;
    case 'shifts':
      return <ShiftsPage />;
    case 'reports':
      return <ReportsPage />;
    case 'users':
      return <UsersPage />;
    default:
      return <DashboardPage />;
  }
}

export function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const handleLogin = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthToken('');
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Filter pages by role
  const visiblePages = PAGE_DEFS.filter(
    (p) => !p.roles || p.roles.includes(user.role),
  );

  const navItems: NavItem[] = visiblePages.map((p) => ({
    id: p.id,
    label: p.label,
    icon: p.icon,
    isActive: currentPage === p.id,
    onPress: () => setCurrentPage(p.id),
  }));

  const activePageDef = PAGE_DEFS.find((p) => p.id === currentPage);

  return (
    <AppShell
      navItems={navItems}
      title={activePageDef?.label || 'FactoryOS'}
      brandName="FactoryOS"
      brandSubtitle={`${user.full_name} · ${user.role}`}
      sidebarFooter={
        <Pressable onPress={handleLogout} className="py-2">
          <Text className="text-xs text-slate-400">🚪 Sign Out</Text>
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center">
          <View className="mr-3 items-end">
            <Text className="text-sm font-medium text-gray-700">{user.full_name}</Text>
            <Text className="text-xs text-gray-400">{user.role}</Text>
          </View>
          <Pressable onPress={handleLogout} className="bg-gray-100 px-3 py-1.5 rounded-lg">
            <Text className="text-xs text-gray-600">Sign Out</Text>
          </Pressable>
        </View>
      }
    >
      {renderPage(currentPage)}
    </AppShell>
  );
}
