import React, { useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

const DESKTOP_BREAKPOINT = 1024;

export interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  brandName?: string;
  brandSubtitle?: string;
  sidebarFooter?: React.ReactNode;
  /** Right content for desktop header (user info, sign out, etc.) */
  headerRight?: React.ReactNode;
  /** Compact right content for mobile header (e.g. just avatar) */
  mobileHeaderRight?: React.ReactNode;
  /** Breadcrumb trail for desktop header */
  breadcrumbs?: BreadcrumbItem[];
}

export function AppShell({
  children,
  navItems,
  title = '',
  brandName = 'FactoryOS',
  brandSubtitle,
  sidebarFooter,
  headerRight,
  mobileHeaderRight,
  breadcrumbs,
}: AppShellProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const isWeb = Platform.OS === 'web';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isDesktop && isWeb) {
    return (
      <View className="flex-1 flex-row bg-gray-50">
        <Sidebar
          items={navItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={brandName}
          subtitle={brandSubtitle}
          footer={sidebarFooter}
        />
        <View className="flex-1">
          <Header title={title} rightContent={headerRight} />
          {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
          <View className="flex-1 bg-gray-50 dark:bg-gray-950">{children}</View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        {mobileMenuOpen && (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-50 flex-row">
            <View
              className="absolute top-0 left-0 right-0 bottom-0 bg-black/40"
              onTouchEnd={() => setMobileMenuOpen(false)}
            />
            <View className="z-10">
              <Sidebar
                items={navItems}
                title={brandName}
                subtitle={brandSubtitle}
                footer={sidebarFooter}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </View>
          </View>
        )}

        <Header
          title={title}
          showMenuToggle
          onMenuPress={() => setMobileMenuOpen(!mobileMenuOpen)}
          rightContent={mobileHeaderRight}
        />
        <View className="flex-1">{children}</View>

        <SafeAreaView edges={['bottom']} className="bg-white dark:bg-gray-900">
          <BottomNav items={navItems} />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
