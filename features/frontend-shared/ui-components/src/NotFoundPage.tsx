/**
 * NotFoundPage – Industry-grade 404 page
 *
 * Themed for factory/production environments with a clean,
 * professional appearance suitable for enterprise use.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SearchX, ArrowLeft, Home } from 'lucide-react-native';

export interface NotFoundPageProps {
  /** Called when user taps "Go Home" */
  onGoHome?: () => void;
  /** Called when user taps "Go Back" */
  onGoBack?: () => void;
}

export function NotFoundPage({ onGoHome, onGoBack }: NotFoundPageProps) {
  return (
    <View className="flex-1 bg-slate-50 items-center justify-center px-6">
      {/* Visual */}
      <View className="w-24 h-24 bg-slate-100 rounded-3xl items-center justify-center mb-6 border-2 border-dashed border-slate-300">
        <SearchX size={40} color="#94a3b8" />
      </View>

      {/* Error Code */}
      <Text className="text-6xl font-black text-slate-200 mb-2">404</Text>

      {/* Heading */}
      <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
        Page Not Found
      </Text>

      {/* Description */}
      <Text className="text-sm text-slate-500 text-center max-w-xs mb-8 leading-5">
        The resource you're looking for doesn't exist or has been moved.
        Check the URL or navigate back to the dashboard.
      </Text>

      {/* Status Indicator */}
      <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 flex-row items-center">
        <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
        <Text className="text-xs text-amber-700 font-medium">
          System Status: All services operational
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        {onGoBack && (
          <Pressable
            onPress={onGoBack}
            className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex-row items-center"
          >
            <ArrowLeft size={16} color="#475569" />
            <Text className="text-sm font-medium text-slate-600 ml-2">Go Back</Text>
          </Pressable>
        )}
        {onGoHome && (
          <Pressable
            onPress={onGoHome}
            className="bg-emerald-500 px-5 py-3 rounded-xl flex-row items-center"
          >
            <Home size={16} color="#ffffff" />
            <Text className="text-sm font-medium text-white ml-2">Dashboard</Text>
          </Pressable>
        )}
      </View>

      {/* Footer */}
      <Text className="text-xs text-slate-300 mt-12">
        FactoryOS · Production Monitoring Platform
      </Text>
    </View>
  );
}
