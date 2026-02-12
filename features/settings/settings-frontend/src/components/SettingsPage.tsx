/**
 * SettingsPage – Main settings container
 *
 * Tabbed layout with sections:
 *   - Appearance (theme, font, accessibility)
 *   - Compliance (audit / validation / traceability modes)
 *
 * Future sections: Notifications, Language, Privacy, About
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Palette, Shield, Bell, Globe } from 'lucide-react-native';
import { PageHeader } from '@zipybills/ui-components';
import { useAuthStore } from '@zipybills/ui-store';
import { AppearanceSettings } from './AppearanceSettings';
import { ComplianceSettings } from './ComplianceSettings';

// ─── Types ────────────────────────────────────

type SettingsTab = 'appearance' | 'compliance';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  /** Minimum role required to see this tab */
  minRole?: string[];
}

// ─── Constants ────────────────────────────────

const ICON_SIZE = 16;

const TABS: TabConfig[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette size={ICON_SIZE} />,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: <Shield size={ICON_SIZE} />,
    minRole: ['ADMIN', 'SUPERVISOR'],
  },
];

// ─── Component ────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { user } = useAuthStore();
  const userRole = user?.role ?? 'OPERATOR';

  // Filter tabs by role
  const visibleTabs = TABS.filter((tab) => {
    if (!tab.minRole) return true;
    return tab.minRole.includes(userRole);
  });

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSettings allowUserOverride />;
      case 'compliance':
        return <ComplianceSettings userRole={userRole} />;
      default:
        return null;
    }
  }, [activeTab, userRole]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your appearance and platform preferences"
      />

      <View className="flex-1 flex-row">
        {/* ─── Sidebar Tabs (desktop) / Top Tabs (mobile) ─── */}
        <View className="w-full md:w-56 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:bg-transparent">
          <View className="flex-row md:flex-col p-2 gap-1">
            {visibleTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`
                    flex-row items-center px-3 py-2.5 rounded-lg flex-1 md:flex-none
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900'
                      : 'bg-transparent'
                    }
                  `}
                >
                  <View className="mr-2">
                    {React.cloneElement(tab.icon as React.ReactElement, {
                      color: isActive ? '#007AFF' : '#6B7280',
                    })}
                  </View>
                  <Text
                    className={`
                      text-sm font-medium
                      ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}
                    `}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ─── Content Area ────────────────────── */}
        <ScrollView
          className="flex-1 p-4 md:p-6"
          contentContainerStyle={{ maxWidth: 720 }}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>
      </View>
    </View>
  );
}
