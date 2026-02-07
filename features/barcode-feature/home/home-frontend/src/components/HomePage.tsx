import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { AppShell } from './layout/AppShell';
import { ResponsiveGrid } from './layout/ResponsiveGrid';
import type { NavItem } from './layout/Sidebar';
import { ScanPage } from './pages/ScanPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MachinesPage } from './pages/MachinesPage';
import {
  fetchBarcodes,
  fetchDashboard,
  fetchMachines,
  type BarcodeRecord,
  type Machine,
  type DashboardData,
  type ActivityLogEntry,
} from '../services/api';

type PageId = 'home' | 'scan' | 'machines' | 'inventory' | 'reports' | 'settings';

const PAGE_TITLES: Record<PageId, string> = {
  home: 'Dashboard',
  scan: 'Scan',
  machines: 'Machines',
  inventory: 'Inventory',
  reports: 'Reports',
  settings: 'Settings',
};

function DashboardContent() {
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData['status'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [barcodesData, dashboardData, machinesData] = await Promise.allSettled([
        fetchBarcodes(),
        fetchDashboard(),
        fetchMachines(),
      ]);

      if (barcodesData.status === 'fulfilled') setBarcodes(barcodesData.value);
      if (machinesData.status === 'fulfilled') setMachines(machinesData.value);
      if (dashboardData.status === 'fulfilled' && dashboardData.value?.success) {
        setDashboard(dashboardData.value.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 15 seconds for live feel
    refreshTimer.current = setInterval(loadData, 15000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [loadData]);

  const totalBarcodes = dashboard?.totalBarcodes ?? barcodes.length;
  const totalProcessed = dashboard?.totalProcessed ?? 0;
  const completed = dashboard?.completed ?? 0;
  const inProgress = dashboard?.inProgress ?? 0;
  const pending = dashboard?.pending ?? 0;
  const todayBarcodes = dashboard?.todayBarcodes ?? 0;
  const todayScans = dashboard?.todayScans ?? 0;
  const failuresToday = dashboard?.failuresToday ?? 0;
  const avgMinutes = dashboard?.avgProcessingMinutes ?? 0;
  const machineStats = dashboard?.machineStats ?? [];
  const recentActivity: ActivityLogEntry[] = dashboard?.recentActivity ?? [];

  // Completion percentage
  const completionPct = totalBarcodes > 0 ? Math.round((completed / totalBarcodes) * 100) : 0;

  return (
    <ScrollView className="flex-1 p-4">
      {/* Welcome Section */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Welcome back 👋
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Here&apos;s what&apos;s happening with your barcodes today.
            </Text>
          </View>
          <Pressable onPress={loadData} className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <Text className="text-xs text-blue-600 font-medium">🔄 Refresh</Text>
          </Pressable>
        </View>
      </View>

      {/* Connection Status */}
      {error && (
        <Pressable
          onPress={loadData}
          className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200 flex-row items-center"
        >
          <Text className="text-sm text-yellow-700 flex-1">
            ⚠️ Backend offline — showing cached/empty data. Tap to retry.
          </Text>
        </Pressable>
      )}

      {/* Live Status Banner */}
      {!error && !loading && (
        <View className={`rounded-xl p-3 mb-4 flex-row items-center justify-between ${failuresToday > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <View className="flex-row items-center">
            <View className={`w-2.5 h-2.5 rounded-full mr-2 ${failuresToday > 0 ? 'bg-red-400' : 'bg-green-400'}`} />
            <Text className={`text-sm font-medium ${failuresToday > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {failuresToday > 0
                ? `${failuresToday} failure${failuresToday > 1 ? 's' : ''} today — check Reports → Failures`
                : 'System running smoothly ✅'}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">Auto-refreshing</Text>
        </View>
      )}

      {/* Today's Activity Row */}
      <View className="flex-row mb-4 -mx-1">
        <View className="flex-1 mx-1 bg-blue-50 rounded-xl p-3.5">
          <Text className="text-xs text-blue-500 mb-0.5">Today Generated</Text>
          <Text className="text-xl font-bold text-blue-700">{loading ? '...' : todayBarcodes}</Text>
        </View>
        <View className="flex-1 mx-1 bg-green-50 rounded-xl p-3.5">
          <Text className="text-xs text-green-500 mb-0.5">Today Scans</Text>
          <Text className="text-xl font-bold text-green-700">{loading ? '...' : todayScans}</Text>
        </View>
        <View className="flex-1 mx-1 bg-purple-50 rounded-xl p-3.5">
          <Text className="text-xs text-purple-500 mb-0.5">Avg Time</Text>
          <Text className="text-xl font-bold text-purple-700">{loading ? '...' : `${avgMinutes}m`}</Text>
        </View>
      </View>

      {/* Completion Overview */}
      <ResponsiveGrid columns={{ xs: 2, sm: 2, md: 4, lg: 4, xl: 4 }}>
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">Total Barcodes</Text>
          <Text className="text-2xl font-bold text-gray-900">{loading ? '...' : totalBarcodes}</Text>
          <Text className="text-xs text-blue-500 mt-1">{machines?.length ?? 0} machines configured</Text>
        </View>
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">✅ Completed</Text>
          <Text className="text-2xl font-bold text-green-600">{loading ? '...' : completed}</Text>
          <Text className="text-xs text-green-500 mt-1">{completionPct}% completion rate</Text>
        </View>
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">🔄 In Progress</Text>
          <Text className="text-2xl font-bold text-yellow-600">{loading ? '...' : inProgress}</Text>
          <Text className="text-xs text-yellow-500 mt-1">Being processed</Text>
        </View>
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <Text className="text-xs text-gray-500 mb-1">⏳ Pending</Text>
          <Text className="text-2xl font-bold text-gray-600">{loading ? '...' : pending}</Text>
          <Text className="text-xs text-gray-400 mt-1">Waiting for scan</Text>
        </View>
      </ResponsiveGrid>

      {/* Completion Progress Bar */}
      {totalBarcodes > 0 && (
        <View className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900">Overall Completion</Text>
            <Text className="text-sm font-bold text-blue-600">{completionPct}%</Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <View className="flex-row h-full">
              <View className="bg-green-400 h-full" style={{ width: `${completionPct}%` }} />
              {inProgress > 0 && (
                <View className="bg-yellow-400 h-full" style={{ width: `${Math.round((inProgress / totalBarcodes) * 100)}%` }} />
              )}
            </View>
          </View>
          <View className="flex-row mt-2">
            <View className="flex-row items-center mr-4">
              <View className="w-2.5 h-2.5 rounded-full bg-green-400 mr-1" />
              <Text className="text-xs text-gray-500">Completed</Text>
            </View>
            <View className="flex-row items-center mr-4">
              <View className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-1" />
              <Text className="text-xs text-gray-500">In Progress</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-1" />
              <Text className="text-xs text-gray-500">Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* Machine Utilization */}
      {machineStats.length > 0 && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Machine Utilization
          </Text>
          <View className="bg-white rounded-xl border border-gray-100 p-4">
            {machineStats.map((stat, i) => {
              const machine = machines.find((m) => m.machine_id === stat.machine_id);
              const maxCount = Math.max(...machineStats.map((s) => s.count), 1);
              const widthPct = Math.round((stat.count / maxCount) * 100);
              return (
                <View key={stat.machine_id} className={`${i > 0 ? 'mt-3' : ''}`}>
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center">
                      <Text className="text-sm font-medium text-gray-700">
                        {machine?.can_generate_barcode ? '🔧' : '📱'}{' '}
                        {stat.machine_name || machine?.machine_name || `Machine ${stat.machine_id}`}
                      </Text>
                      <View className="bg-gray-100 rounded px-1.5 py-0.5 ml-2">
                        <Text className="text-xs text-gray-500">{stat.machine_code || machine?.machine_code}</Text>
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-gray-900">
                      {stat.count} scans
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <View className="mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Recent Activity
          </Text>
          <View className="bg-white rounded-xl border border-gray-100">
            {recentActivity.slice(0, 10).map((activity, i) => (
              <View
                key={activity.log_id}
                className={`flex-row items-center px-4 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <View className={`w-2 h-2 rounded-full mr-3 ${activity.status === 'SUCCESS' ? 'bg-green-400' : 'bg-red-400'}`} />
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-gray-700">{activity.action}</Text>
                    {activity.machine_id && (
                      <Text className="text-xs text-gray-400 ml-2">
                        🏭 M{activity.machine_id}
                      </Text>
                    )}
                  </View>
                  {activity.barcode && (
                    <Text className="text-xs text-gray-400 font-mono" numberOfLines={1}>{activity.barcode}</Text>
                  )}
                  {activity.error_message && (
                    <Text className="text-xs text-red-500">{activity.error_message}</Text>
                  )}
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Barcodes */}
      <View className="mt-4 mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">
            Recent Barcodes
          </Text>
        </View>
        <View className="bg-white rounded-xl border border-gray-100">
          {barcodes.length === 0 ? (
            <View className="px-4 py-8 items-center">
              <Text className="text-gray-400 text-sm">
                {loading ? 'Loading...' : 'No barcodes yet. Generate some from the Scan page!'}
              </Text>
            </View>
          ) : (
            barcodes.slice(0, 10).map((barcode, i) => (
              <View
                key={barcode.barcode_id || i}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  i > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-2 h-2 rounded-full mr-3 ${
                      barcode.status === 'ACTIVE'
                        ? 'bg-green-400'
                        : barcode.status === 'COMPLETED'
                        ? 'bg-blue-400'
                        : 'bg-gray-300'
                    }`}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">
                      {barcode.barcode}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      Machine {barcode.generated_by_machine} • {barcode.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-400">
                  {new Date(barcode.generated_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function renderPage(pageId: PageId) {
  switch (pageId) {
    case 'scan':
      return <ScanPage />;
    case 'machines':
      return <MachinesPage />;
    case 'inventory':
      return <InventoryPage />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'home':
    default:
      return <DashboardContent />;
  }
}

export function HomePage() {
  const [activePage, setActivePage] = useState<PageId>('home');

  const navItems: NavItem[] = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: '🏠', isActive: activePage === 'home', onPress: () => setActivePage('home') },
      { id: 'scan', label: 'Scan', icon: '📷', isActive: activePage === 'scan', onPress: () => setActivePage('scan') },
      { id: 'machines', label: 'Machines', icon: '🏭', isActive: activePage === 'machines', onPress: () => setActivePage('machines') },
      { id: 'inventory', label: 'Inventory', icon: '📦', isActive: activePage === 'inventory', onPress: () => setActivePage('inventory') },
      { id: 'reports', label: 'Reports', icon: '📊', isActive: activePage === 'reports', onPress: () => setActivePage('reports') },
      { id: 'settings', label: 'Settings', icon: '⚙️', isActive: activePage === 'settings', onPress: () => setActivePage('settings') },
    ],
    [activePage],
  );

  return (
    <AppShell
      navItems={navItems}
      title={PAGE_TITLES[activePage]}
      brandName="Zipybills"
      brandSubtitle="Barcode Scanner"
      headerRight={
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
          <Text className="text-white text-xs font-bold">H</Text>
        </View>
      }
    >
      {renderPage(activePage)}
    </AppShell>
  );
}

