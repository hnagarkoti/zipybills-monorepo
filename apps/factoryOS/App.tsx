/**
 * App.tsx – Legacy fallback entry point
 *
 * With Expo Router, the real entry is index.js → expo-router/entry
 * which uses the app/ directory for file-based routing.
 * This file is kept for compatibility but is no longer the main entry.
 */
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-900">
      <Text className="text-white text-lg">Loading FactoryOS...</Text>
    </View>
  );
}
