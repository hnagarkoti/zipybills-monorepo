/**
 * NotFoundPage – Industry-grade 404 page
 *
 * Themed for factory/production environments with a clean,
 * professional appearance suitable for enterprise use.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SearchX, ArrowLeft, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, useSemanticColors } from '@zipybills/theme-engine';

export interface NotFoundPageProps {
  /** Called when user taps "Go Home" */
  onGoHome?: () => void;
  /** Called when user taps "Go Back" */
  onGoBack?: () => void;
}

export function NotFoundPage({ onGoHome, onGoBack }: NotFoundPageProps) {
  const sc = useSemanticColors();
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center px-6">
      {/* Visual */}
      <View className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl items-center justify-center mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <SearchX size={40} color={sc.iconMuted} />
      </View>

      {/* Error Code */}
      <Text className="text-6xl font-black text-slate-200 dark:text-gray-700 mb-2">404</Text>

      {/* Heading */}
      <Text className="text-xl font-bold text-slate-800 dark:text-gray-100 mb-2 text-center">
        Page Not Found
      </Text>

      {/* Description */}
      <Text className="text-sm text-slate-500 dark:text-gray-400 text-center max-w-xs mb-8 leading-5">
        The resource you're looking for doesn't exist or has been moved.
        Check the URL or navigate back to the dashboard.
      </Text>

      {/* Status Indicator */}
      <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-8 flex-row items-center">
        <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
        <Text className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          System Status: All services operational
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        {onGoBack && (
          <Pressable
            onPress={onGoBack}
            className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 px-5 py-3 rounded-xl flex-row items-center"
          >
            <ArrowLeft size={16} color={sc.textSecondary} />
            <Text className="text-sm font-medium text-slate-600 dark:text-gray-300 ml-2">Go Back</Text>
          </Pressable>
        )}
        {onGoHome && (
          <Pressable onPress={onGoHome}>
            <LinearGradient
              colors={['#2563eb', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <Home size={16} color={colors.white} />
              <Text className="text-sm font-medium text-white ml-2">Dashboard</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <Text className="text-xs text-slate-300 dark:text-gray-600 mt-12">
        FactoryOS · Production Monitoring Platform
      </Text>
    </View>
  );
}
