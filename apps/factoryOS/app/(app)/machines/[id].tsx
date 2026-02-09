/**
 * Machine detail route – /machines/:id
 *
 * Placeholder for future machine detail view.
 * Demonstrates dynamic routing with Expo Router.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Factory, ArrowLeft } from 'lucide-react-native';

export default function MachineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center mb-4"
      >
        <ArrowLeft size={18} color="#6b7280" />
        <Text className="text-sm text-gray-500 ml-1">Back to Machines</Text>
      </Pressable>

      <View className="bg-white rounded-xl border border-gray-100 p-6 items-center">
        <View className="w-16 h-16 bg-emerald-50 rounded-2xl items-center justify-center mb-4">
          <Factory size={28} color="#059669" />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-1">Machine #{id}</Text>
        <Text className="text-sm text-gray-500 text-center">
          Detailed machine view will be available here.
          {'\n'}Real-time status, maintenance history, and production metrics.
        </Text>
      </View>
    </View>
  );
}
