/**
 * ServerErrorPage – Industry-grade 500 / runtime error page
 *
 * Professional error display suitable for enterprise/factory environments.
 * Shows error details in development and a clean message in production.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react-native';

export interface ServerErrorPageProps {
  /** The caught error */
  error?: Error | null;
  /** Called when user taps "Retry" */
  onRetry?: () => void;
  /** Called when user taps "Go Home" */
  onGoHome?: () => void;
}

export function ServerErrorPage({ error, onRetry, onGoHome }: ServerErrorPageProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const isDev = __DEV__;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="items-center justify-center px-6 py-16 min-h-full"
    >
      {/* Pulsing alert indicator */}
      <View className="w-24 h-24 bg-red-50 rounded-3xl items-center justify-center mb-6 border-2 border-red-200">
        <AlertOctagon size={40} color="#ef4444" />
      </View>

      {/* Error Code */}
      <Text className="text-6xl font-black text-red-100 mb-2">500</Text>

      {/* Heading */}
      <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
        Something Went Wrong
      </Text>

      {/* Description */}
      <Text className="text-sm text-slate-500 text-center max-w-xs mb-6 leading-5">
        An unexpected error occurred. Our system has logged this incident.
        Please try again or contact your system administrator.
      </Text>

      {/* Downtime Banner */}
      <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex-row items-center w-full max-w-sm">
        <View className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2" />
        <View className="flex-1">
          <Text className="text-xs font-semibold text-red-700">Incident Detected</Text>
          <Text className="text-xs text-red-500 mt-0.5">
            {new Date().toLocaleString()} · Auto-recovery in progress
          </Text>
        </View>
      </View>

      {/* Error Details (dev only or expandable) */}
      {isDev && error && (
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          className="bg-white border border-slate-200 rounded-xl w-full max-w-sm mb-6 overflow-hidden"
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-xs font-semibold text-slate-600">Error Details</Text>
            {showDetails
              ? <ChevronUp size={14} color="#64748b" />
              : <ChevronDown size={14} color="#64748b" />}
          </View>
          {showDetails && (
            <View className="px-4 pb-3 border-t border-slate-100 pt-2">
              <Text className="text-xs font-mono text-red-600 mb-1">{error.name}: {error.message}</Text>
              {error.stack && (
                <Text className="text-xs font-mono text-slate-400 leading-4" numberOfLines={10}>
                  {error.stack}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      )}

      {/* Actions */}
      <View className="flex-row gap-3">
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-emerald-500 px-5 py-3 rounded-xl flex-row items-center"
          >
            <RefreshCw size={16} color="#ffffff" />
            <Text className="text-sm font-medium text-white ml-2">Try Again</Text>
          </Pressable>
        )}
        {onGoHome && (
          <Pressable
            onPress={onGoHome}
            className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex-row items-center"
          >
            <Home size={16} color="#475569" />
            <Text className="text-sm font-medium text-slate-600 ml-2">Dashboard</Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <Text className="text-xs text-slate-300 mt-12">
        FactoryOS · Production Monitoring Platform
      </Text>
    </ScrollView>
  );
}
