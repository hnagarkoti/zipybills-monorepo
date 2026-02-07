import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, danger }: SettingsRowProps) {
  return (
    <Pressable className="flex-row items-center px-4 py-3.5">
      <View
        className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${
          danger ? 'bg-red-50' : 'bg-gray-100'
        }`}
      >
        <Text className="text-base">{icon}</Text>
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${
          danger ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {label}
      </Text>
      {value && <Text className="text-sm text-gray-400">{value}</Text>}
      <Text className="text-gray-300 ml-2">›</Text>
    </Pressable>
  );
}

export function SettingsPage() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

        {/* Profile Card */}
        <View className="bg-white rounded-xl p-4 flex-row items-center mb-6 border border-gray-100">
          <View className="w-14 h-14 rounded-full bg-primary items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">H</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Hemant Singh
            </Text>
            <Text className="text-sm text-gray-500">hemant@zipybills.com</Text>
          </View>
          <Text className="text-gray-300 text-xl">›</Text>
        </View>

        {/* General */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          General
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 mb-6">
          <SettingsRow icon="🔔" label="Notifications" value="On" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="🌙" label="Dark Mode" value="Off" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="🌐" label="Language" value="English" />
        </View>

        {/* Scanner */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Scanner
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 mb-6">
          <SettingsRow icon="📷" label="Camera" value="Rear" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="🔊" label="Scan Sound" value="On" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="📐" label="Barcode Types" value="All" />
        </View>

        {/* Data */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          Data
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 mb-6">
          <SettingsRow icon="☁️" label="Sync" value="Auto" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="💾" label="Export Data" />
          <View className="h-px bg-gray-100 mx-4" />
          <SettingsRow icon="🗑️" label="Clear Cache" />
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-xl border border-gray-100 mb-6">
          <SettingsRow icon="🚪" label="Sign Out" danger />
        </View>

        {/* Version */}
        <Text className="text-center text-xs text-gray-400 mt-2 mb-8">
          Zipybills v0.1.0 · Built with Expo
        </Text>
      </View>
    </ScrollView>
  );
}
