/**
 * ServerErrorPage – Industry-grade 500 / runtime error page
 *
 * Professional error display suitable for enterprise/factory environments.
 * Shows error details in development and a clean message in production.
 *
 * Uses expo-linear-gradient for the brand gradient on the primary action
 * button (NativeWind `bg-gradient-to-r` is CSS-only; silently fails on RN).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, statusColors, useSemanticColors } from '@zipybills/theme-engine';

export interface ServerErrorPageProps {
  /** The caught error */
  error?: Error | null;
  /** Called when user taps "Retry" */
  onRetry?: () => void;
  /** Called when user taps "Go Home" */
  onGoHome?: () => void;
}

export function ServerErrorPage({ error, onRetry, onGoHome }: ServerErrorPageProps) {
  const sc = useSemanticColors();
  const [showDetails, setShowDetails] = React.useState(false);
  const isDev = __DEV__;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-gray-950"
      contentContainerClassName="items-center justify-center px-6 py-16 min-h-full"
    >
      {/* Pulsing alert indicator */}
      <View className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-3xl items-center justify-center mb-6 border-2 border-red-200 dark:border-red-800">
        <AlertOctagon size={40} color={statusColors.error} />
      </View>

      {/* Error Code */}
      <Text className="text-6xl font-black text-red-100 dark:text-red-900/30 mb-2">500</Text>

      {/* Heading */}
      <Text className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2 text-center">
        Something Went Wrong
      </Text>

      {/* Description */}
      <Text className="text-sm text-slate-500 dark:text-gray-400 text-center max-w-xs mb-6 leading-5">
        An unexpected error occurred. Our system has logged this incident.
        Please try again or contact your system administrator.
      </Text>

      {/* Downtime Banner */}
      <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-6 flex-row items-center w-full max-w-sm">
        <View className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2" />
        <View className="flex-1">
          <Text className="text-xs font-semibold text-red-700 dark:text-red-400">
            Incident Detected
          </Text>
          <Text className="text-xs text-red-500 dark:text-red-400 mt-0.5">
            {new Date().toLocaleString()} · Auto-recovery in progress
          </Text>
        </View>
      </View>

      {/* Error Details (dev only or expandable) */}
      {isDev && error && (
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl w-full max-w-sm mb-6 overflow-hidden"
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-xs font-semibold text-slate-600 dark:text-gray-300">
              Error Details
            </Text>
            {showDetails ? (
              <ChevronUp size={14} color={sc.textSecondary} />
            ) : (
              <ChevronDown size={14} color={sc.textSecondary} />
            )}
          </View>
          {showDetails && (
            <View className="px-4 pb-3 border-t border-slate-100 dark:border-gray-700 pt-2">
              <Text className="text-xs font-mono text-red-600 mb-1">
                {error.name}: {error.message}
              </Text>
              {error.stack && (
                <Text
                  className="text-xs font-mono text-slate-400 leading-4"
                  numberOfLines={10}
                >
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
          <Pressable onPress={onRetry}>
            <LinearGradient
              colors={['#2563eb', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={16} color={colors.white} />
              <Text className="text-sm font-medium text-white ml-2">Try Again</Text>
            </LinearGradient>
          </Pressable>
        )}
        {onGoHome && (
          <Pressable
            onPress={onGoHome}
            className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-5 py-3 rounded-xl flex-row items-center"
          >
            <Home size={16} color={sc.textSecondary} />
            <Text className="text-sm font-medium text-slate-600 dark:text-gray-300 ml-2">
              Dashboard
            </Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <Text className="text-xs text-slate-300 dark:text-gray-600 mt-12">
        FactoryOS · Production Monitoring Platform
      </Text>
    </ScrollView>
  );
}
