/**
 * OnboardingBanner – Shown globally on every authenticated page
 * when the tenant admin hasn't generated sample data yet.
 *
 * Renders the "Welcome! Get Started Quickly" card with a
 * confirmation modal to seed sample factory + PayTrack data.
 * Uses SSE streaming to show real-time progress during seeding.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView as RNScrollView, Animated, Easing } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@zipybills/ui-store';
import { apiFetch, API_BASE, getAuthToken } from '@zipybills/factory-api-client';
import { useLocale } from '@zipybills/i18n-engine';
import {
  Clock, Users, Sparkles, CheckCircle2, Factory, ClipboardList,
  Truck, Briefcase, Package, CreditCard, Loader2, AlertCircle, X,
} from 'lucide-react-native';

// ─── Isolated spinner component (memo'd to avoid re-render interruptions) ───
const SpinningLoader = React.memo(function SpinningLoader() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={32} color="#6366f1" />
    </Animated.View>
  );
});

// ─── Step config for progress display ────────
const STEP_ICONS: Record<string, { icon: typeof Factory; color: string; bg: string }> = {
  init: { icon: Sparkles, color: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  shifts: { icon: Clock, color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  machines: { icon: Factory, color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  users: { icon: Users, color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  plans: { icon: ClipboardList, color: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  vendors: { icon: Truck, color: '#14b8a6', bg: 'bg-teal-100 dark:bg-teal-900/30' },
  projects: { icon: Briefcase, color: '#0ea5e9', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  materials: { icon: Package, color: '#f43f5e', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  payments: { icon: CreditCard, color: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  finalizing: { icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  done: { icon: CheckCircle2, color: '#10b981', bg: 'bg-green-100 dark:bg-green-900/30' },
  error: { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30' },
};

interface ProgressEvent {
  step: string;
  message: string;
  progress: number;
  created?: Record<string, number>;
  credentials?: Record<string, { username: string; password: string }>;
}

export default function OnboardingBanner() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ created: Record<string, number>; credentials: Record<string, { username: string; password: string }> } | null>(null);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [seedError, setSeedError] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Continuous spin animation for the loader icon — handled by SpinningLoader component

  const { data: setupData } = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => apiFetch('/api/admin/setup-status'),
    enabled: !!user && !user.is_platform_admin && user.role === 'ADMIN',
    refetchInterval: 30_000,
  });

  const animateProgress = useCallback((toValue: number) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setSeedError(false);
    setProgressEvents([]);
    setCurrentProgress(0);
    setCurrentMessage('Starting...');
    progressAnim.setValue(0);

    try {
      const token = getAuthToken();
      const versionedPath = '/api/v1/admin/seed-sample-data';
      const response = await fetch(`${API_BASE}${versionedPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));

            setProgressEvents((prev) => [...prev, event]);
            setCurrentMessage(event.message);
            setCurrentProgress(Math.max(0, event.progress));
            animateProgress(Math.max(0, event.progress) / 100);

            if (event.step === 'done' && event.created && event.credentials) {
              setResult({ created: event.created, credentials: event.credentials });
              queryClient.invalidateQueries();
            }

            if (event.step === 'error') {
              setSeedError(true);
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }
    } catch (err) {
      console.error('Seed SSE failed:', err);
      setSeedError(true);
      setCurrentMessage('Connection failed. Please try again.');
    } finally {
      setSeeding(false);
    }
  }, [queryClient, progressAnim, animateProgress]);

  // ─── Early returns AFTER all hooks ─────
  if (!setupData?.setup || user?.is_platform_admin || user?.role !== 'ADMIN') return null;
  const s = setupData.setup;
  if (!s.needsSetup) return null;
  if (dismissed) return null;

  // ─── Render the progress view inside the modal ─────
  const renderProgressView = () => {
    const completedSteps = progressEvents.filter((e) => e.message.includes('✓'));
    const isComplete = result !== null;
    const hasError = seedError;

    return (
      <View className="p-6">
        {/* Header */}
        <View className="items-center mb-5">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isComplete ? 'bg-green-100 dark:bg-green-900/30' : hasError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
            {isComplete ? (
              <CheckCircle2 size={32} color="#10b981" />
            ) : hasError ? (
              <AlertCircle size={32} color="#ef4444" />
            ) : (
              <SpinningLoader />
            )}
          </View>
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isComplete ? t('onboarding.allSet') : hasError ? 'Something went wrong' : 'Setting up your factory...'}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {currentMessage}
            </Text>
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(currentProgress)}%
            </Text>
          </View>
          <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${hasError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(Math.max(currentProgress, 0), 100)}%`, transitionProperty: 'width', transitionDuration: '400ms' } as any}
            />
          </View>
        </View>

        {/* Step log */}
        <RNScrollView className="mb-4" style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
          <View className="gap-2">
            {progressEvents.map((evt, i) => {
              const stepConfig = STEP_ICONS[evt.step] ?? STEP_ICONS.init!;
              const StepIcon = stepConfig.icon;
              const isDone = evt.message.includes('✓');
              return (
                <View key={i} className="flex-row items-center gap-2.5">
                  <View className={`w-7 h-7 rounded-lg items-center justify-center ${stepConfig.bg}`}>
                    {isDone ? (
                      <CheckCircle2 size={14} color="#10b981" />
                    ) : (
                      <StepIcon size={14} color={stepConfig.color} />
                    )}
                  </View>
                  <Text className={`text-sm flex-1 ${isDone ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {evt.message}
                  </Text>
                </View>
              );
            })}
          </View>
        </RNScrollView>

        {/* Error retry or completion actions */}
        {hasError && !isComplete && (
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => { setShowModal(false); setSeedError(false); setProgressEvents([]); }}
              className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-lg items-center"
            >
              <Text className="text-gray-600 dark:text-gray-400 font-medium">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={handleSeed}
              className="flex-1 bg-indigo-600 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <View className="px-4 pt-3">
        <View className="bg-gradient-to-r rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
          {/* Gradient header strip */}
          <View className="bg-indigo-500 px-4 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Sparkles size={18} color="#fff" />
              <Text className="text-white font-bold text-sm ml-2">{t('onboarding.welcome')}</Text>
            </View>
            <Pressable
              onPress={() => setDismissed(true)}
              hitSlop={8}
              className="w-6 h-6 rounded-full items-center justify-center bg-white/20"
            >
              <X size={14} color="#fff" />
            </Pressable>
          </View>
          <View className="bg-indigo-50 dark:bg-indigo-900/30 p-4">
            <Text className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {t('onboarding.emptyFactory')}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('onboarding.sampleDataDesc')}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowModal(true)}
                className="bg-indigo-600 px-5 py-2.5 rounded-lg flex-row items-center flex-1 justify-center"
              >
                <Sparkles size={14} color="#fff" />
                <Text className="text-white font-semibold text-sm ml-1.5">{t('onboarding.generateSample')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Confirmation / Progress / Result Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-3 sm:p-6">
          <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl" style={{ maxHeight: '92%' }}>
            {/* Show progress view when seeding or after completion/error */}
            {(seeding || result || seedError) ? (
              result ? (
                // Success result
                <RNScrollView>
                  <View className="p-6">
                    <View className="items-center mb-4">
                      <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
                        <CheckCircle2 size={32} color="#10b981" />
                      </View>
                      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('onboarding.allSet')}</Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                        {t('onboarding.sampleCreated')}
                      </Text>
                    </View>

                    {/* Created summary */}
                    <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 gap-2">
                      <View className="flex-row items-center gap-2">
                        <Factory size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.machines} {t('onboarding.machinesLabel')}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.shifts} {t('onboarding.shiftsLabel')}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <ClipboardList size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.plans} {t('onboarding.plansLabel')}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Users size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.users} {t('onboarding.usersLabel')}</Text>
                      </View>
                      {(result.created.vendors > 0 || result.created.projects > 0 || result.created.materials > 0) && (
                        <>
                          <View className="border-t border-gray-200 dark:border-gray-700 my-1" />
                          <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t('onboarding.paytrackSection')}</Text>
                          <View className="flex-row items-center gap-2">
                            <Truck size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.vendors} {t('onboarding.vendorsLabel')}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Briefcase size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.projects} {t('onboarding.projectsLabel')}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Package size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.materials} {t('onboarding.materialsLabel')}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <CreditCard size={14} color="#6b7280" />
                            <Text className="text-sm text-gray-700 dark:text-gray-300">{result.created.payments} {t('onboarding.paymentsLabel')}</Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Credentials */}
                    <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('onboarding.testCredentials')}</Text>
                    <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 gap-3 mb-4">
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
                      onPress={() => { setShowModal(false); }}
                      className="bg-indigo-600 py-3 rounded-lg items-center"
                    >
                      <Text className="text-white font-semibold">{t('onboarding.startExploring')}</Text>
                    </Pressable>
                  </View>
                </RNScrollView>
              ) : (
                // Live progress view
                renderProgressView()
              )
            ) : (
              // Confirmation screen (before seeding starts)
              <View className="p-6">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mb-3">
                    <Sparkles size={32} color="#6366f1" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('onboarding.generateQuestion')}</Text>
                </View>

                <Text className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  {t('onboarding.generateDesc')}
                </Text>

                <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 gap-2.5">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                      <Factory size={16} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.fiveMachines')}</Text>
                      <Text className="text-xs text-gray-500">{t('onboarding.machineDetails')}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center">
                      <Clock size={16} color="#10b981" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.threeShifts')}</Text>
                      <Text className="text-xs text-gray-500">{t('onboarding.shiftDetails')}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
                      <ClipboardList size={16} color="#8b5cf6" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.threeMonths')}</Text>
                      <Text className="text-xs text-gray-500">{t('onboarding.planDetails')}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                      <Users size={16} color="#f59e0b" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.threeUsers')}</Text>
                      <Text className="text-xs text-gray-500">{t('onboarding.userDetails')}</Text>
                    </View>
                  </View>

                  {/* PayTrack section */}
                  <View className="border-t border-gray-200 dark:border-gray-600 my-1 pt-1">
                    <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">{t('onboarding.paytrackSection')}</Text>
                    <View className="gap-2.5">
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 items-center justify-center">
                          <Truck size={16} color="#14b8a6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.sixVendors')}</Text>
                          <Text className="text-xs text-gray-500">{t('onboarding.vendorDetails')}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 items-center justify-center">
                          <Briefcase size={16} color="#0ea5e9" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.fiveProjects')}</Text>
                          <Text className="text-xs text-gray-500">{t('onboarding.projectDetails')}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 items-center justify-center">
                          <Package size={16} color="#f43f5e" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('onboarding.twentyFiveMaterials')}</Text>
                          <Text className="text-xs text-gray-500">{t('onboarding.materialDetails')}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-lg items-center"
                  >
                    <Text className="text-gray-600 dark:text-gray-400 font-medium">{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSeed}
                    className="flex-1 bg-indigo-600 py-3 rounded-lg items-center flex-row justify-center gap-2"
                  >
                    <Sparkles size={16} color="#fff" />
                    <Text className="text-white font-semibold">{t('onboarding.generate')}</Text>
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
