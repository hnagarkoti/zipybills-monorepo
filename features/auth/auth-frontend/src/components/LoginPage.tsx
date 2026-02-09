import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Factory } from 'lucide-react-native';
import { login as apiLogin } from '../services/api';
import { setAuthToken } from '@zipybills/factory-api-client';
import { Alert } from '@zipybills/ui-components';

interface LoginPageProps {
  onLogin: (user: { user_id: number; username: string; full_name: string; role: string }) => void;
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
      onLogin(res.user);
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
      className="flex-1 bg-slate-900 items-center justify-center"
    >
      <View className="w-full max-w-sm px-6">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-emerald-500 rounded-2xl items-center justify-center mb-4">
            <Factory size={32} color="#ffffff" />
          </View>
          <Text className="text-2xl font-bold text-white">FactoryOS</Text>
          <Text className="text-sm text-slate-400 mt-1">Production Monitoring System</Text>
        </View>

        {/* Form */}
        <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          {error && (
            <View className="mb-4">
              <Alert variant="error" message={error} onDismiss={() => setError(null)} />
            </View>
          )}

          <View className="mb-4">
            <Text className="text-xs text-slate-400 mb-1.5 font-medium">USERNAME</Text>
            <TextInput
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs text-slate-400 mb-1.5 font-medium">PASSWORD</Text>
            <TextInput
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-sm"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`py-3.5 rounded-lg items-center ${loading ? 'bg-emerald-700' : 'bg-emerald-500'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>

        {/* Default credentials hint */}
        <View className="items-center mt-6">
          <Text className="text-xs text-slate-500">Default: admin / admin123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
