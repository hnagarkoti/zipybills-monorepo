import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NavItem } from './Sidebar';

export interface BottomNavProps {
  /** Navigation items for the bottom bar */
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <View className="h-16 bg-white border-t border-gray-200 flex-row items-center justify-around px-2 pb-safe-bottom">
      {items.slice(0, 5).map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          className="flex-1 items-center justify-center py-1"
        >
          {/* Icon placeholder */}
          <View
            className={`w-7 h-7 rounded-full items-center justify-center ${
              item.isActive ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                item.isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              {item.icon || item.label.charAt(0)}
            </Text>
          </View>
          <Text
            className={`text-xs mt-0.5 ${
              item.isActive ? 'text-primary font-medium' : 'text-gray-500'
            }`}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
