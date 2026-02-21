import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { DashboardPage } from '@zipybills/factory-dashboard-frontend';
import { useAuthStore } from '@zipybills/ui-store';
import { apiFetch } from '@zipybills/factory-api-client';
import { useLocale } from '@zipybills/i18n-engine';
import { Clock, Users, Cog, AlertTriangle, ArrowUpCircle, Crown, X } from 'lucide-react-native';

/* ─── Trial / Usage Banner ──────────────────── */

function TenantInfoBanner() {
  const user = useAuthStore((s) => s.user);
  const { t } = useLocale();
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
                ? t('trial.expiresToday')
                : `${trialDaysLeft} ${trialDaysLeft !== 1 ? t('trial.daysLeft') : t('trial.dayLeft')}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-white/20 px-2 py-1 rounded-md">
            <ArrowUpCircle size={12} color="#fff" />
            <Text className="text-white text-[10px] font-bold">{t('trial.upgrade').toUpperCase()}</Text>
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
                ? t('trial.expiresTodayBang')
                : `${trialDaysLeft} ${trialDaysLeft !== 1 ? t('trial.daysLeftInTrial') : t('trial.dayLeftInTrial')}`}
            </Text>
            <Text
              className={`text-xs mt-0.5 ${
                trialDaysLeft <= 3 ? 'text-red-600' : trialDaysLeft <= 7 ? 'text-amber-600' : 'text-blue-600'
              }`}
            >
              {t('trial.upgradeDesc')}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${
                trialDaysLeft <= 3 ? 'bg-red-600' : 'bg-indigo-600'
              }`}
            >
              <ArrowUpCircle size={14} color="#fff" />
              <Text className="text-xs font-semibold text-white">{t('trial.upgrade')}</Text>
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
                {a.current_users}/{a.max_users} {t('trial.users')}
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
                {a.current_machines}/{a.max_machines} {t('trial.machines')}
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
      <DashboardPage />
    </View>
  );
}
