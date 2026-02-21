import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight, Home } from 'lucide-react-native';
import { useSemanticColors } from '@zipybills/theme-engine';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onPress?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const sc = useSemanticColors();
  if (items.length === 0) return null;

  return (
    <View className="flex-row items-center px-4 py-2 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-700">
      {/* Home icon as first crumb */}
      <Pressable
        onPress={items[0]?.onPress}
        className="flex-row items-center"
      >
        <Home size={14} color={sc.iconDefault} />
      </Pressable>

      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} className="flex-row items-center">
          <ChevronRight size={12} color={sc.iconMuted} style={{ marginHorizontal: 6 }} />
          {index < items.length - 1 && item.onPress ? (
            <Pressable onPress={item.onPress}>
              <Text className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600">{item.label}</Text>
            </Pressable>
          ) : (
            <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</Text>
          )}
        </View>
      ))}
    </View>
  );
}
