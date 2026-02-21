/**
 * PayTrackPage – Layout & index page for the PayTrack module.
 *
 * Follows the same pattern as Settings:
 *   - Desktop: sidebar (tab list) + content panel (from sub-route <Slot />)
 *   - Mobile:  index shows module card list; sub-routes show full page
 *
 * Sub-routes:
 *   /paytrack            → index (redirects to /dashboard on desktop)
 *   /paytrack/dashboard  → PayTrackDashboard
 *   /paytrack/materials  → MaterialsPage
 *   /paytrack/projects   → ProjectsPage
 *   /paytrack/vendors    → VendorsPage
 *   /paytrack/payments   → PaymentsPage
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import {
  LayoutDashboard, Package, FolderKanban, Building2, CreditCard,
  ChevronRight, Receipt,
} from 'lucide-react-native';
import { PageHeader } from '@zipybills/ui-components';
import { useAuthStore } from '@zipybills/ui-store';
import { useLocale } from '@zipybills/i18n-engine';

/* ─── Tab Definitions ─────────────────────────── */

export type PayTrackTab = 'dashboard' | 'materials' | 'projects' | 'vendors' | 'payments';

interface TabConfig {
  id: PayTrackTab;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  path: string;
  /** Minimum roles required to see this tab */
  minRole?: string[];
  color: string;
  bgClass: string;
}

const TABS: TabConfig[] = [
  {
    id: 'dashboard',
    labelKey: 'paytrack.tab.dashboard',
    descriptionKey: 'paytrack.desc.dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/paytrack/dashboard',
    minRole: ['ADMIN', 'SUPERVISOR'],
    color: '#2563EB',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'materials',
    labelKey: 'paytrack.tab.materials',
    descriptionKey: 'paytrack.desc.materials',
    icon: <Package size={20} />,
    path: '/paytrack/materials',
    color: '#F59E0B',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'projects',
    labelKey: 'paytrack.tab.projects',
    descriptionKey: 'paytrack.desc.projects',
    icon: <FolderKanban size={20} />,
    path: '/paytrack/projects',
    color: '#8B5CF6',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    id: 'vendors',
    labelKey: 'paytrack.tab.vendors',
    descriptionKey: 'paytrack.desc.vendors',
    icon: <Building2 size={20} />,
    path: '/paytrack/vendors',
    color: '#10B981',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'payments',
    labelKey: 'paytrack.tab.payments',
    descriptionKey: 'paytrack.desc.payments',
    icon: <CreditCard size={20} />,
    path: '/paytrack/payments',
    minRole: ['ADMIN', 'SUPERVISOR'],
    color: '#059669',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
];

/** Get visible tabs for a given role */
export function getVisiblePayTrackTabs(userRole: string): TabConfig[] {
  return TABS.filter((tab) => {
    if (!tab.minRole) return true;
    return tab.minRole.includes(userRole);
  });
}

/* ─── Sidebar Tab Button ──────────────────────── */

function SidebarTab({ tab, isActive, onPress, isLast }: {
  tab: TabConfig; isActive: boolean; onPress: () => void; isLast: boolean;
}) {
  const { t } = useLocale();
  return (
    <Pressable
      onPress={onPress}
      className={`
        flex-row items-center px-4 py-3.5 active:opacity-80
        ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}
        ${isActive ? 'bg-gray-50 dark:bg-gray-800' : ''}
      `}
      style={isActive ? { borderLeftWidth: 3, borderLeftColor: tab.color } : { paddingLeft: 19 }}
    >
      <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${tab.bgClass}`}>
        {React.cloneElement(tab.icon as React.ReactElement<any>, { color: tab.color, size: 18 })}
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
          {t(tab.labelKey) || tab.id}
        </Text>
        <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5" numberOfLines={1}>
          {t(tab.descriptionKey) || ''}
        </Text>
      </View>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════
 * PayTrackLayout – Wraps sub-route content
 * with a desktop sidebar. Used by _layout.tsx.
 * ═══════════════════════════════════════════════ */

export function PayTrackLayout({
  activeTab,
  onNavigate,
  children,
}: {
  activeTab: PayTrackTab;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuthStore();
  const { t } = useLocale();
  const userRole = user?.role ?? 'OPERATOR';
  const visibleTabs = getVisiblePayTrackTabs(userRole);

  // ─── DESKTOP: sidebar + content ─────────
  if (isDesktop) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-950">
        <PageHeader title={t('nav.paytrack') || 'PayTrack'} subtitle={t('paytrack.subtitle') || 'Material tracking & payment management'} />

        <View className="flex-1 flex-row px-6 pb-6" style={{ gap: 24 }}>
          {/* Left Sidebar */}
          <View style={{ width: 260, flexShrink: 0 }}>
            {/* Module badge */}
            <View className="flex-row items-center gap-2 mb-3 px-1">
              <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                <Receipt size={16} color="#2563EB" />
              </View>
              <View>
                <Text className="text-sm font-bold text-gray-900 dark:text-gray-100">PayTrack</Text>
                <Text className="text-[10px] text-gray-400">{userRole}</Text>
              </View>
            </View>

            <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          </View>

          {/* Right Content Panel */}
          <ScrollView
            className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700"
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
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
      <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <Pressable
          onPress={() => onNavigate('/paytrack')}
          className="flex-row items-center gap-2 self-start active:opacity-70"
        >
          <ChevronRight
            size={18}
            color="#6B7280"
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('nav.paytrack') || 'PayTrack'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ maxWidth: 720, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════
 * PayTrackIndexPage – The /paytrack index page
 * Desktop → redirects to first visible tab
 * Mobile  → shows module card list
 * ═══════════════════════════════════════════════ */

export interface PayTrackPageProps {
  onNavigate: (path: string) => void;
}

export function PayTrackPage({ onNavigate }: PayTrackPageProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { t } = useLocale();
  const { user } = useAuthStore();
  const userRole = user?.role ?? 'OPERATOR';
  const visibleTabs = getVisiblePayTrackTabs(userRole);

  // Desktop: redirect to dashboard (or materials for operators)
  if (isDesktop && visibleTabs.length > 0) {
    React.useEffect(() => {
      const defaultTab = visibleTabs[0];
      if (defaultTab) onNavigate(defaultTab.path);
    }, []);
    return null;
  }

  // ─── MOBILE: Module card list ──────────────
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('nav.paytrack') || 'PayTrack'} subtitle={t('paytrack.subtitle') || 'Material tracking & payment management'} />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ maxWidth: 640, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Module hero card */}
        <View className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-blue-600 rounded-2xl p-5 mb-6 mt-2">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <Receipt size={22} color="#ffffff" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">PayTrack</Text>
              <Text className="text-xs text-blue-100">{t('paytrack.subtitle') || 'Material tracking & payment management'}</Text>
            </View>
          </View>
        </View>

        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
          {t('paytrack.modules') || 'Modules'}
        </Text>

        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {visibleTabs.map((tab, index) => (
            <Pressable
              key={tab.id}
              onPress={() => onNavigate(tab.path)}
              className={`
                flex-row items-center px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800
                ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}
              `}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${tab.bgClass}`}>
                {React.cloneElement(tab.icon as React.ReactElement<any>, { color: tab.color })}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t(tab.labelKey) || tab.id}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t(tab.descriptionKey) || ''}
                </Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
