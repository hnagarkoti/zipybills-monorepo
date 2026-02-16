import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Factory } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { login as apiLogin } from '../services/api';
import { setAuthToken } from '@zipybills/factory-api-client';
import { Alert } from '@zipybills/ui-components';
import { colors } from '@zipybills/theme-engine';

interface LoginPageProps {
  onLogin: (user: { user_id: number; username: string; full_name: string; role: string }, token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiLogin(username, password);
      setAuthToken(res.token);
      onLogin(res.user, res.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
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
            <Text className="text-2xl font-bold text-white">FactoryOS</Text>
            <Text className="text-sm text-blue-300/70 mt-1">Smart Manufacturing Platform</Text>
          </View>

          {/* Form */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, backdropFilter: 'blur(10px)' }}>
            {error && (
              <View className="mb-4">
                <Alert variant="error" message={error} onDismiss={() => setError(null)} />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-xs text-blue-200/60 mb-1.5 font-medium tracking-wider">USERNAME</Text>
              <TextInput
                className="rounded-lg px-4 py-3 text-white text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="rgba(148,163,184,0.5)"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="mb-6">
              <Text className="text-xs text-blue-200/60 mb-1.5 font-medium tracking-wider">PASSWORD</Text>
              <TextInput
                className="rounded-lg px-4 py-3 text-white text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="rgba(148,163,184,0.5)"
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#1e40af', '#6b21a8'] : ['#2563eb', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              >
                <Text className="text-white font-semibold text-base">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Powered by */}
          <View className="items-center mt-8">
            <Text className="text-xs text-blue-300/30">Powered by Zipybills</Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
