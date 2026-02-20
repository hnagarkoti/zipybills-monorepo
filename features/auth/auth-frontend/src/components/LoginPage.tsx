import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Factory, ArrowLeft, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { login as apiLogin } from '../services/api';
import { setAuthToken } from '@zipybills/factory-api-client';
import { Alert } from '@zipybills/ui-components';
import { colors } from '@zipybills/theme-engine';
import { useLocale } from '@zipybills/i18n-engine';

interface LoginPageProps {
  onLogin: (user: { user_id: number; username: string; full_name: string; role: string }, token: string) => void;
}

type Step = 'workspace' | 'credentials';

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>('workspace');
  const [workspaceId, setWorkspaceId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkspaceContinue = () => {
    const trimmed = workspaceId.trim().toLowerCase();
    if (!trimmed) {
      setError(t('auth.requiredWorkspace'));
      return;
    }
    setWorkspaceId(trimmed);
    setError(null);
    setStep('credentials');
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t('auth.requiredFields'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiLogin(username, password, workspaceId);
      setAuthToken(res.token);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.loginFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('workspace');
    setError(null);
    setUsername('');
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#1e1b4b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Decorative blobs */}
        <View style={{ position: 'absolute', top: '10%', left: '-10%', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(37,99,235,0.15)' }} />
        <View style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(147,51,234,0.12)' }} />

        <View className="w-full max-w-sm px-6">
          {/* Logo */}
          <View className="items-center mb-8">
            <LinearGradient
              colors={['#2563eb', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
            >
              <Factory size={32} color={colors.white} />
            </LinearGradient>
            <Text className="text-2xl font-bold text-white">{t('common.appName')}</Text>
            <Text className="text-sm text-blue-300/70 mt-1">{t('common.tagline')}</Text>
          </View>

          {/* Form */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, backdropFilter: 'blur(10px)' }}>
            {/* Step header */}
            {step === 'credentials' && (
              <Pressable onPress={handleBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <ArrowLeft size={16} color="rgba(147,197,253,0.7)" />
                <Text style={{ color: 'rgba(147,197,253,0.7)', fontSize: 13, marginLeft: 4 }}>{t('common.back')}</Text>
              </Pressable>
            )}

            {error && (
              <View className="mb-4">
                <Alert variant="error" message={error} onDismiss={() => setError(null)} />
              </View>
            )}

            {step === 'workspace' ? (
              <>
                {/* Step 1: Workspace ID */}
                <View className="mb-2">
                  <Text className="text-white text-base font-semibold mb-1">{t('auth.signInToWorkspace')}</Text>
                  <Text className="text-blue-200/50 text-xs mb-4">{t('auth.enterWorkspaceId')}</Text>
                </View>
                <View className="mb-6">
                  <Text className="text-xs text-blue-200/60 mb-1.5 font-medium tracking-wider">{t('auth.workspaceId').toUpperCase()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                    <Building2 size={16} color="rgba(148,163,184,0.5)" style={{ marginLeft: 14 }} />
                    <TextInput
                      style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 12, color: '#fff', fontSize: 14 }}
                      value={workspaceId}
                      onChangeText={setWorkspaceId}
                      placeholder={t('auth.workspaceIdPlaceholder')}
                      placeholderTextColor="rgba(148,163,184,0.5)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onSubmitEditing={handleWorkspaceContinue}
                      returnKeyType="next"
                    />
                  </View>
                  <Text className="text-xs text-blue-200/30 mt-1.5">{t('auth.workspaceIdHint')}</Text>
                </View>
                <Pressable onPress={handleWorkspaceContinue}>
                  <LinearGradient
                    colors={['#2563eb', '#9333ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                  >
                    <Text className="text-white font-semibold text-base">{t('auth.continue')}</Text>
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                {/* Step 2: Credentials */}
                {/* Workspace badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37,99,235,0.15)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 16 }}>
                  <Building2 size={13} color="rgba(147,197,253,0.8)" />
                  <Text style={{ color: 'rgba(147,197,253,0.8)', fontSize: 12, marginLeft: 6, fontWeight: '600' }}>{workspaceId}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-xs text-blue-200/60 mb-1.5 font-medium tracking-wider">{t('auth.username').toUpperCase()}</Text>
                  <TextInput
                    className="rounded-lg px-4 py-3 text-white text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('auth.usernamePlaceholder')}
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-xs text-blue-200/60 mb-1.5 font-medium tracking-wider">{t('auth.password').toUpperCase()}</Text>
                  <TextInput
                    className="rounded-lg px-4 py-3 text-white text-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="rgba(148,163,184,0.5)"
                    secureTextEntry
                    onSubmitEditing={handleLogin}
                  />
                </View>

                <Pressable onPress={handleLogin} disabled={loading}>
                  <LinearGradient
                    colors={loading ? ['#1e40af', '#6b21a8'] : ['#2563eb', '#9333ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                  >
                    <Text className="text-white font-semibold text-base">
                      {loading ? t('auth.signingIn') : t('auth.signIn')}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>

          {/* Powered by */}
          <View className="items-center mt-8">
            <Text className="text-xs text-blue-300/30">{t('common.poweredBy')}</Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
