/**
 * SettingsPage – Main settings hub & layout
 *
 * Used in two ways:
 *   1. As the /settings index page — shows the tab list on mobile,
 *      or side-by-side with default tab on desktop.
 *   2. Via SettingsLayout wrapper — provides the desktop sidebar
 *      when rendering sub-route content (/settings/appearance, etc.)
 *
 * Props:
 *   - onNavigate(path)  — called when user taps a tab (provided by the route file)
 *   - activeTab          — which tab is currently active (derived from pathname)
 *   - children           — content to render in the right panel (from sub-route)
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import {
  Palette, Shield, HardDrive, User, ChevronRight, Settings,
} from 'lucide-react-native';
import { PageHeader } from '@zipybills/ui-components';
import { useAuthStore } from '@zipybills/ui-store';

// ─── Types ────────────────────────────────────

export type SettingsTab = 'appearance' | 'compliance' | 'backup';

interface TabConfig {
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Route path segment (e.g. 'appearance') */
  path: string;
  /** Minimum role required to see this tab */
  minRole?: string[];
  color: string;
  bgColor: string;
}

// ─── Constants ────────────────────────────────

const TABS: TabConfig[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme, colors and display',
    icon: <Palette size={20} />,
    path: '/settings/appearance',
    color: '#8B5CF6',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    description: 'Audit, validation and traceability',
    icon: <Shield size={20} />,
    path: '/settings/compliance',
    minRole: ['ADMIN', 'SUPERVISOR'],
    color: '#F59E0B',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'backup',
    label: 'Backup & Data',
    description: 'Export, restore and manage data',
    icon: <HardDrive size={20} />,
    path: '/settings/backup',
    minRole: ['ADMIN'],
    color: '#10B981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
];

/** Get the visible tabs for a given role */
export function getVisibleTabs(userRole: string): TabConfig[] {
  return TABS.filter((tab) => {
    if (!tab.minRole) return true;
    return tab.minRole.includes(userRole);
  });
}

// ─── Sidebar Tab Button ───────────────────────

function SidebarTab({ tab, isActive, onPress, isLast }: {
  tab: TabConfig; isActive: boolean; onPress: () => void; isLast: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        flex-row items-center px-4 py-3.5 active:opacity-80
        ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}
        ${isActive ? 'bg-gray-50 dark:bg-gray-800' : ''}
      `}
      style={isActive ? { borderLeftWidth: 3, borderLeftColor: tab.color } : { paddingLeft: 19 }}
    >
      <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${tab.bgColor}`}>
        {React.cloneElement(tab.icon as React.ReactElement, { color: tab.color, size: 18 })}
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
          {tab.label}
        </Text>
        <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5" numberOfLines={1}>
          {tab.description}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Profile Card ─────────────────────────────

function ProfileCard({ compact }: { compact?: boolean }) {
  const { user } = useAuthStore();
  const userRole = user?.role ?? 'OPERATOR';

  if (compact) {
    return (
      <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
            <User size={20} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900 dark:text-gray-100" numberOfLines={1}>
              {user?.full_name || user?.username || 'User'}
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {userRole}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6 mt-2">
      <View className="flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
          <User size={24} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {user?.full_name || user?.username || 'User'}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {userRole}
              </Text>
            </View>
            {user?.username && (
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                @{user.username}
              </Text>
            )}
          </View>
        </View>
        <Settings size={18} color="#9CA3AF" />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════
// SettingsLayout – Wraps sub-route content with
// the desktop sidebar. Used by route files.
// ═══════════════════════════════════════════════

export function SettingsLayout({
  activeTab,
  onNavigate,
  children,
}: {
  activeTab: SettingsTab;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuthStore();
  const userRole = user?.role ?? 'OPERATOR';
  const visibleTabs = getVisibleTabs(userRole);

  // ─── DESKTOP: sidebar + content ────────────
  if (isDesktop) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Settings" subtitle="Manage your preferences" />

        <View className="flex-1 flex-row px-6 pb-6" style={{ gap: 24 }}>
          {/* Left Sidebar */}
          <View style={{ width: 280, flexShrink: 0 }}>
            <ProfileCard compact />

            <Text className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
              Preferences
            </Text>
            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {visibleTabs.map((tab, index) => (
                <SidebarTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onPress={() => onNavigate(tab.path)}
                  isLast={index === visibleTabs.length - 1}
                />
              ))}
            </View>

            <View className="items-center mt-6">
              <Text className="text-[10px] text-gray-400 dark:text-gray-600">
                FactoryOS v1.0.0
              </Text>
            </View>
          </View>

          {/* Right Content Panel */}
          <ScrollView
            className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ─── MOBILE: full-screen with back button ──
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <Pressable
          onPress={() => onNavigate('/settings')}
          className="flex-row items-center gap-2 self-start active:opacity-70"
        >
          <ChevronRight
            size={18}
            color="#6B7280"
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Settings
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ maxWidth: 640, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════
// SettingsPage – The /settings index page
// Shows the tab list. On desktop, defaults to first tab.
// ═══════════════════════════════════════════════

export function SettingsPage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuthStore();
  const userRole = user?.role ?? 'OPERATOR';
  const visibleTabs = getVisibleTabs(userRole);

  // Desktop: redirect to first tab immediately
  if (isDesktop && visibleTabs.length > 0) {
    // Use React effect-like approach: navigate on mount
    React.useEffect(() => {
      onNavigate(visibleTabs[0].path);
    }, []);
    return null;
  }

  // ─── MOBILE: Settings list ─────────────────
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <PageHeader title="Settings" subtitle="Manage your preferences" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ maxWidth: 640, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileCard />

        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
          Preferences
        </Text>

        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          {visibleTabs.map((tab, index) => (
            <Pressable
              key={tab.id}
              onPress={() => onNavigate(tab.path)}
              className={`
                flex-row items-center px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800
                ${index > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
              `}
            >
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${tab.bgColor}`}
              >
                {React.cloneElement(tab.icon as React.ReactElement, { color: tab.color })}
              </View>

              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {tab.label}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {tab.description}
                </Text>
              </View>

              <ChevronRight size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        <View className="items-center mt-4 mb-8">
          <Text className="text-xs text-gray-400 dark:text-gray-600">
            FactoryOS v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
