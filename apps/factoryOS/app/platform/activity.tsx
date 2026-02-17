import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@zipybills/factory-api-client';
import {
  Activity,
  Search,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

/* ─── Types ──────────────────────────── */
interface AuditLog {
  activity_id: number;
  user_id: number;
  username?: string;
  full_name?: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  tenant_id: number;
  tenant_name?: string;
  ip_address?: string;
  created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  TENANT_SUSPENDED: 'bg-red-100 text-red-700',
  TENANT_ACTIVATED: 'bg-green-100 text-green-700',
  PLAN_CHANGED: 'bg-purple-100 text-purple-700',
  IMPERSONATION_START: 'bg-amber-100 text-amber-800',
  USER_CREATED: 'bg-blue-100 text-blue-700',
  USER_LOGIN: 'bg-gray-100 text-gray-600',
  DEFAULT: 'bg-gray-100 text-gray-600',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  TENANT_SUSPENDED: <AlertTriangle size={14} color="#b91c1c" />,
  TENANT_ACTIVATED: <Shield size={14} color="#15803d" />,
  PLAN_CHANGED: <Activity size={14} color="#7c3aed" />,
  IMPERSONATION_START: <User size={14} color="#92400e" />,
};

export default function ActivityPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const logsQuery = useQuery({
    queryKey: ['platform-audit', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      return apiFetch(`/api/audit/global?${params}`);
    },
  });

  const logs: AuditLog[] = logsQuery.data?.logs ?? [];
  const pagination = logsQuery.data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getColor = (action: string) => SEVERITY_COLORS[action] ?? SEVERITY_COLORS.DEFAULT;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Activity & Audit</Text>
        <Text className="text-sm text-gray-500">
          Global activity log across all tenants — {pagination.total} entries
        </Text>
      </View>

      {/* Search */}
      <View className="bg-white border-b border-gray-200 px-6 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search actions, users, entities..."
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setPage(1);
            }}
            placeholderTextColor="#9ca3af"
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Logs */}
      {logsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {logs.map((log) => {
            const colorCls = getColor(log.action);
            const isExpanded = expandedLog === log.activity_id;

            return (
              <Pressable
                key={log.activity_id}
                onPress={() => setExpandedLog(isExpanded ? null : log.activity_id)}
                className="bg-white rounded-xl border border-gray-200 mb-2 overflow-hidden"
              >
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View
                        className={`w-8 h-8 rounded-lg items-center justify-center ${colorCls.split(' ')[0]}`}
                      >
                        {ACTION_ICONS[log.action] ?? <Activity size={14} color="#6b7280" />}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-0.5">
                          <View className={`px-2 py-0.5 rounded-full ${colorCls.split(' ')[0]}`}>
                            <Text className={`text-xs font-semibold ${colorCls.split(' ')[1]}`}>
                              {log.action.replace(/_/g, ' ')}
                            </Text>
                          </View>
                          {log.tenant_name && (
                            <Text className="text-xs text-gray-400">{log.tenant_name}</Text>
                          )}
                        </View>
                        <Text className="text-sm text-gray-600" numberOfLines={isExpanded ? 0 : 1}>
                          {log.details}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2 ml-3">
                      <Text className="text-xs text-gray-400">{timeAgo(log.created_at)}</Text>
                      {isExpanded ? (
                        <ChevronUp size={14} color="#9ca3af" />
                      ) : (
                        <ChevronDown size={14} color="#9ca3af" />
                      )}
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="mt-3 ml-10 bg-gray-50 rounded-lg p-3 gap-2">
                      <View className="flex-row gap-6">
                        <View>
                          <Text className="text-xs text-gray-400">User ID</Text>
                          <Text className="text-sm font-medium text-gray-700">{log.user_id}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-gray-400">Entity</Text>
                          <Text className="text-sm font-medium text-gray-700">
                            {log.entity_type}
                            {log.entity_id ? ` #${log.entity_id}` : ''}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-gray-400">Tenant ID</Text>
                          <Text className="text-sm font-medium text-gray-700">{log.tenant_id}</Text>
                        </View>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-400">Timestamp</Text>
                        <Text className="text-sm font-medium text-gray-700">
                          {new Date(log.created_at).toLocaleString()}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-400">Full Description</Text>
                        <Text className="text-sm text-gray-700">{log.details}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}

          {logs.length === 0 && (
            <View className="items-center justify-center py-16">
              <Activity size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">No activity logs found</Text>
            </View>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <View className="flex-row items-center justify-center gap-4 py-4">
              <Pressable
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className={`px-4 py-2 rounded-lg ${page <= 1 ? 'bg-gray-100' : 'bg-indigo-600'}`}
              >
                <Text className={`text-sm font-medium ${page <= 1 ? 'text-gray-400' : 'text-white'}`}>
                  Previous
                </Text>
              </Pressable>
              <Text className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </Text>
              <Pressable
                onPress={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className={`px-4 py-2 rounded-lg ${
                  page >= pagination.totalPages ? 'bg-gray-100' : 'bg-indigo-600'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    page >= pagination.totalPages ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Next
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
