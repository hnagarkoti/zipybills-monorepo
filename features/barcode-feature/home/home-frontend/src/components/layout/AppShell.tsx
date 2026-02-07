import React, { useState } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

/** Breakpoint (px) at which we switch from mobile to desktop layout */
const DESKTOP_BREAKPOINT = 1024;

export interface AppShellProps {
  /** Main content to render in the body area */
  children: React.ReactNode;
  /** Navigation items shared between sidebar and bottom nav */
  navItems: NavItem[];
  /** Page title shown in the header */
  title?: string;
  /** Brand / app name shown in the sidebar */
  brandName?: string;
  /** Brand subtitle */
  brandSubtitle?: string;
  /** Content for sidebar footer (e.g. user avatar) */
  sidebarFooter?: React.ReactNode;
  /** Content for header right side (e.g. notifications) */
  headerRight?: React.ReactNode;
}

export function AppShell({
  children,
  navItems,
  title = '',
  brandName = 'Zipybills',
  brandSubtitle,
  sidebarFooter,
  headerRight,
}: AppShellProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const isWeb = Platform.OS === 'web';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop web: sidebar + header + content
  if (isDesktop && isWeb) {
    return (
      <View className="flex-1 flex-row bg-background">
        {/* Sidebar */}
        <Sidebar
          items={navItems}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={brandName}
          subtitle={brandSubtitle}
          footer={sidebarFooter}
        />

        {/* Main Area */}
        <View className="flex-1">
          <Header
            title={title}
            rightContent={headerRight}
          />
          <View className="flex-1 bg-background">{children}</View>
        </View>
      </View>
    );
  }

  // Mobile / tablet: SafeAreaView + header + content + bottom nav
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <View className="absolute top-0 left-0 right-0 bottom-0 z-50 flex-row">
            {/* Backdrop */}
            <View
              className="absolute top-0 left-0 right-0 bottom-0 bg-black/40"
              onTouchEnd={() => setMobileMenuOpen(false)}
            />
            {/* Sidebar panel */}
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

        {/* Header */}
        <Header
          title={title}
          showMenuToggle
          onMenuPress={() => setMobileMenuOpen(!mobileMenuOpen)}
          rightContent={headerRight}
        />

        {/* Main Content */}
        <View className="flex-1">{children}</View>

        {/* Bottom Navigation */}
        <SafeAreaView edges={['bottom']} className="bg-white">
          <BottomNav items={navItems} />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
