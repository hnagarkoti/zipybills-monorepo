import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  Megaphone,
  Plus,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface Announcement {
  announcement_id: number;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  target_tenants: number[];
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  created_by: number;
}

const SEVERITY_CONFIG = {
  INFO: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: <Info size={16} color="#1d4ed8" />,
  },
  WARNING: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: <AlertTriangle size={16} color="#92400e" />,
  },
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: <AlertCircle size={16} color="#b91c1c" />,
  },
};

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');

  const announcementsQuery = useQuery({
    queryKey: ['platform-announcements'],
    queryFn: () => apiFetch('/api/super-admin/announcements'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; message: string; severity: string }) =>
      apiFetch('/api/super-admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      setShowCreate(false);
      setTitle('');
      setMessage('');
      setSeverity('INFO');
      Alert.alert('Success', 'Announcement published.');
    },
    onError: () => Alert.alert('Error', 'Failed to create announcement.'),
  });

  const announcements: Announcement[] = announcementsQuery.data?.announcements ?? [];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">Announcements</Text>
            <Text className="text-sm text-gray-500">Broadcast messages to tenants</Text>
          </View>
          <Pressable
            onPress={() => setShowCreate(true)}
            className="flex-row items-center gap-2 bg-indigo-600 px-4 py-2.5 rounded-lg"
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white font-medium text-sm">New</Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      {announcementsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {announcements.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity] ?? SEVERITY_CONFIG.INFO;
            const isExpired = a.expires_at && new Date(a.expires_at) < new Date();

            return (
              <View
                key={a.announcement_id}
                className={`rounded-xl border mb-3 overflow-hidden ${cfg.bg} ${cfg.border} ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      {cfg.icon}
                      <Text className={`text-base font-semibold ${cfg.text}`}>{a.title}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {isExpired ? (
                        <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                          <Text className="text-xs text-gray-500">Expired</Text>
                        </View>
                      ) : (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-xs text-green-700">Active</Text>
                        </View>
                      )}
                      <View className={`px-2 py-0.5 rounded-full ${cfg.bg}`}>
                        <Text className={`text-xs font-semibold ${cfg.text}`}>{a.severity}</Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-sm text-gray-700 mb-3">{a.message}</Text>

                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} color="#6b7280" />
                      <Text className="text-xs text-gray-500">{timeAgo(a.created_at)}</Text>
                    </View>
                    {a.target_tenants && a.target_tenants.length > 0 && (
                      <Text className="text-xs text-gray-500">
                        Targeted: {a.target_tenants.length} tenants
                      </Text>
                    )}
                    {a.expires_at && (
                      <Text className="text-xs text-gray-500">
                        Expires: {new Date(a.expires_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {announcements.length === 0 && (
            <View className="items-center justify-center py-16">
              <Megaphone size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-base">No announcements yet</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Create one to broadcast to your tenants
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
        <Pressable
          onPress={() => setShowCreate(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Pressable onPress={() => {}} className="bg-white rounded-2xl w-[440px] p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900">New Announcement</Text>
              <Pressable onPress={() => setShowCreate(false)}>
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* Title */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Title</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              placeholder="Announcement title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9ca3af"
              returnKeyType="next"
              blurOnSubmit={false}
            />

            {/* Message */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Message</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 mb-4"
              placeholder="Announcement message..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
              placeholderTextColor="#9ca3af"
            />

            {/* Severity */}
            <Text className="text-sm font-medium text-gray-700 mb-2">Severity</Text>
            <View className="flex-row gap-2 mb-6">
              {(['INFO', 'WARNING', 'CRITICAL'] as const).map((s) => {
                const cfg = SEVERITY_CONFIG[s];
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSeverity(s)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                      severity === s
                        ? `${cfg.bg} ${cfg.border}`
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {cfg.icon}
                    <Text
                      className={`text-sm font-medium ${
                        severity === s ? cfg.text : 'text-gray-600'
                      }`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-lg items-center"
              >
                <Text className="text-sm font-medium text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!title.trim() || !message.trim()) {
                    Alert.alert('Validation', 'Title and message are required.');
                    return;
                  }
                  createMutation.mutate({ title, message, severity });
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-2.5 bg-indigo-600 rounded-lg items-center"
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-medium text-white">Publish</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
