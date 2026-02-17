import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Modal, ScrollView as RNScrollView } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardPage } from '@zipybills/factory-dashboard-frontend';
import { useAuthStore } from '@zipybills/ui-store';
import { apiFetch } from '@zipybills/factory-api-client';
import { Clock, Users, Cog, AlertTriangle, ArrowUpCircle, Crown, Sparkles, CheckCircle2, Factory, ClipboardList, X, Copy } from 'lucide-react-native';

/* ─── Trial / Usage Banner ──────────────────── */

function TenantInfoBanner() {
  const user = useAuthStore((s) => s.user);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);

  const { data: account } = useQuery({
    queryKey: ['tenant-account'],
    queryFn: () => apiFetch('/api/auth/account'),
    enabled: !!user && !user.is_platform_admin,
    refetchInterval: 60_000,
  });

  if (!account?.account || user?.is_platform_admin) return null;

  const a = account.account;
  const isTrial = a.status === 'TRIAL';
  const trialDaysLeft = a.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(a.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;
  const userPct = a.max_users > 0 ? Math.round((a.current_users / a.max_users) * 100) : 0;
  const machinePct = a.max_machines > 0 ? Math.round((a.current_machines / a.max_machines) * 100) : 0;
  const usersNearLimit = userPct >= 80;
  const machinesNearLimit = machinePct >= 80;

  return (
    <View className="px-4 pt-4 gap-2">
      {/* Compact Trial Header (when banner dismissed) */}
      {isTrial && trialDaysLeft !== null && trialBannerDismissed && (
        <Pressable
          onPress={() => setTrialBannerDismissed(false)}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 flex-row items-center justify-between active:opacity-80"
        >
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-white/20 items-center justify-center">
              <Clock size={12} color="#fff" />
            </View>
            <Text className="text-white font-semibold text-xs">
              {trialDaysLeft === 0
                ? 'Trial expires today'
                : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in trial`}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-white/20 px-2 py-1 rounded-md">
            <ArrowUpCircle size={12} color="#fff" />
            <Text className="text-white text-[10px] font-bold">UPGRADE</Text>
          </View>
        </Pressable>
      )}

      {/* Full Trial Banner (dismissible) */}
      {isTrial && trialDaysLeft !== null && !trialBannerDismissed && (
        <View
          className={`rounded-xl p-4 flex-row items-center border ${
            trialDaysLeft <= 3
              ? 'bg-red-50 border-red-200'
              : trialDaysLeft <= 7
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
          }`}
        >
          <View
            className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
              trialDaysLeft <= 3 ? 'bg-red-100' : trialDaysLeft <= 7 ? 'bg-amber-100' : 'bg-blue-100'
            }`}
          >
            {trialDaysLeft <= 3 ? (
              <AlertTriangle size={20} color="#dc2626" />
            ) : (
              <Clock size={20} color={trialDaysLeft <= 7 ? '#d97706' : '#2563eb'} />
            )}
          </View>
          <View className="flex-1">
            <Text
              className={`text-sm font-bold ${
                trialDaysLeft <= 3
                  ? 'text-red-800'
                  : trialDaysLeft <= 7
                    ? 'text-amber-800'
                    : 'text-blue-800'
              }`}
            >
              {trialDaysLeft === 0
                ? 'Trial expires today!'
                : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your trial`}
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                trialDaysLeft <= 3 ? 'text-red-600' : trialDaysLeft <= 7 ? 'text-amber-600' : 'text-blue-600'
              }`}
            >
              Upgrade to keep your data and unlock all features
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${
                trialDaysLeft <= 3 ? 'bg-red-600' : 'bg-indigo-600'
              }`}
            >
              <ArrowUpCircle size={14} color="#fff" />
              <Text className="text-xs font-semibold text-white">Upgrade</Text>
            </Pressable>
            <Pressable
              onPress={() => setTrialBannerDismissed(true)}
              className="w-7 h-7 items-center justify-center"
            >
              <X size={18} color={trialDaysLeft <= 3 ? '#991b1b' : trialDaysLeft <= 7 ? '#92400e' : '#1e40af'} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Plan & Usage Strip — only show when limits are relevant */}
      {/* Enterprise with unlimited everything: no strip needed */}
      {/* Other plans: show only when usage is approaching limits (>=60%) */}
      {a.plan !== 'ENTERPRISE' && (usersNearLimit || machinesNearLimit) && (
        <View className="rounded-xl bg-white border border-gray-200 p-3 flex-row items-center gap-4">
          {/* Plan badge */}
          <View className="flex-row items-center gap-1.5">
            <Crown size={14} color="#7c3aed" />
            <Text className="text-xs font-bold text-purple-700">{a.plan}</Text>
          </View>

          {/* Divider */}
          <View className="w-px h-5 bg-gray-200" />

          {/* Users usage — only when near limit */}
          {usersNearLimit && (
            <View className="flex-row items-center gap-1.5 flex-1">
              <Users size={14} color="#dc2626" />
              <Text className="text-xs text-red-600 font-semibold">
                {a.current_users}/{a.max_users} users
              </Text>
              {a.max_users > 0 && (
                <View className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[60px]">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, userPct)}%`,
                      backgroundColor: '#dc2626',
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Machines usage — only when near limit */}
          {machinesNearLimit && (
            <View className="flex-row items-center gap-1.5 flex-1">
              <Cog size={14} color="#dc2626" />
              <Text className="text-xs text-red-600 font-semibold">
                {a.current_machines}/{a.max_machines} machines
              </Text>
              {a.max_machines > 0 && (
                <View className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[60px]">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, machinePct)}%`,
                      backgroundColor: '#dc2626',
                    }}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function DashboardRoute() {
  return (
    <View className="flex-1">
      <TenantInfoBanner />
      <OnboardingBanner />
      <DashboardPage />
    </View>
  );
}

/* ─── Onboarding / Sample Data Banner ───────── */

function OnboardingBanner() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{ created: Record<string, number>; credentials: Record<string, { username: string; password: string }> } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data: setupData } = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => apiFetch('/api/admin/setup-status'),
    enabled: !!user && !user.is_platform_admin && user.role === 'ADMIN',
    refetchInterval: 30_000,
  });

  if (dismissed || !setupData?.setup || user?.is_platform_admin || user?.role !== 'ADMIN') return null;
  // Don't show if factory already has machines, shifts, and plans
  const s = setupData.setup;
  if (s.machines > 0 && s.shifts > 0 && s.plans > 0) return null;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await apiFetch('/api/admin/seed-sample-data', { method: 'POST' });
      if (res.success) {
        setResult({ created: res.created, credentials: res.credentials });
        // Invalidate all queries to refresh data everywhere
        queryClient.invalidateQueries();
      }
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <View className="px-4 pt-3">
        <View className="bg-gradient-to-r rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
          {/* Gradient header strip */}
          <View className="bg-indigo-500 px-4 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-bold text-sm ml-2">Welcome! Get Started Quickly</Text>
            </View>
            <Pressable onPress={() => setDismissed(true)} className="p-1">
              <X size={16} color="#c7d2fe" />
            </Pressable>
          </View>
          <View className="bg-indigo-50 dark:bg-indigo-900/20 p-4">
            <Text className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your factory is empty. Want us to set up sample data so you can explore all features right away?
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              We'll create sample machines, shifts, operators, and 3 months of production plans with realistic data.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowModal(true)}
                className="bg-indigo-600 px-5 py-2.5 rounded-lg flex-row items-center flex-1 justify-center"
              >
                <Sparkles size={14} color="#fff" />
                <Text className="text-white font-semibold text-sm ml-1.5">Generate Sample Data</Text>
              </Pressable>
              <Pressable
                onPress={() => setDismissed(true)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-lg"
              >
                <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium">Skip</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Confirmation / Result Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            {result ? (
              // Success result
              <RNScrollView>
                <View className="p-6">
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
                      <CheckCircle2 size={32} color="#10b981" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">All Set!</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                      Sample data has been created for your factory.
                    </Text>
                  </View>

                  {/* Created summary */}
                  <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <Factory size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.machines} Machines</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Clock size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.shifts} Shifts</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <ClipboardList size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.plans} Production Plans</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Users size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.users} Users</Text>
                    </View>
                  </View>

                  {/* Credentials */}
                  <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Test Credentials</Text>
                  <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 gap-3 mb-4">
                    {Object.entries(result.credentials).map(([role, cred]) => (
                      <View key={role}>
                        <Text className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-0.5">{role}</Text>
                        <Text className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                          {cred.username} / {cred.password}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => { setShowModal(false); setDismissed(true); }}
                    className="bg-indigo-600 py-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-semibold">Start Exploring</Text>
                  </Pressable>
                </View>
              </RNScrollView>
            ) : (
              // Confirmation screen
              <View className="p-6">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mb-3">
                    <Sparkles size={32} color="#6366f1" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">Generate Sample Data?</Text>
                </View>

                <Text className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  This will create realistic factory data to help you explore all features:
                </Text>

                <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 gap-2.5">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                      <Factory size={16} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">5 Machines</Text>
                      <Text className="text-xs text-gray-500">2 CNC, Lathe, Press, Assembly</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center">
                      <Clock size={16} color="#10b981" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">3 Shifts</Text>
                      <Text className="text-xs text-gray-500">Morning, Afternoon, Night</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                      <ClipboardList size={16} color="#8b5cf6" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">3 Months of Plans</Text>
                      <Text className="text-xs text-gray-500">Past 2 months + upcoming month</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                      <Users size={16} color="#f59e0b" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">3 Users</Text>
                      <Text className="text-xs text-gray-500">2 Operators + 1 Supervisor (password: Test@1234)</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-lg items-center"
                  >
                    <Text className="text-gray-600 dark:text-gray-400 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSeed}
                    disabled={seeding}
                    className={`flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2 ${seeding ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                  >
                    {seeding ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text className="text-white font-semibold">Creating...</Text>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} color="#fff" />
                        <Text className="text-white font-semibold">Generate</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
