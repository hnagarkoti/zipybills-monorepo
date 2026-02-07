import React, { useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

const DESKTOP_BREAKPOINT = 1024;

export interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  brandName?: string;
  brandSubtitle?: string;
  sidebarFooter?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function AppShell({
  children,
  navItems,
  title = '',
  brandName = 'FactoryOS',
  brandSubtitle,
  sidebarFooter,
  headerRight,
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
          <View className="flex-1 bg-gray-50">{children}</View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 bg-gray-50">
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
              />
            </View>
          </View>
        )}

        <Header
          title={title}
          showMenuToggle
          onMenuPress={() => setMobileMenuOpen(!mobileMenuOpen)}
          rightContent={headerRight}
        />
        <View className="flex-1">{children}</View>

        <SafeAreaView edges={['bottom']} className="bg-white">
          <BottomNav items={navItems} />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
