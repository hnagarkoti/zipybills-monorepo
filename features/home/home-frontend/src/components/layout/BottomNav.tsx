import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { NavItem } from './Sidebar';

export interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  // Flatten: show parent items only (children are accessible from the parent page on mobile)
  const flatItems = items.filter((item) => !item.children || item.children.length === 0 || true)
    .map(({ children: _children, ...rest }) => rest);

  return (
    <View className="h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-row items-center justify-around px-2">
      {flatItems.slice(0, 5).map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          className="flex-1 items-center justify-center py-1"
        >
          <View
            className={`w-7 h-7 rounded-full items-center justify-center ${
              item.isActive ? 'bg-emerald-500' : 'bg-transparent'
            }`}
          >
            {item.icon ? (
              React.isValidElement(item.icon)
                ? React.cloneElement(item.icon as React.ReactElement<{ size?: number; color?: string }>, {
                    size: 16,
                    color: item.isActive ? '#ffffff' : '#6b7280',
                  })
                : <Text className={`text-xs font-bold ${item.isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{String(item.icon)}</Text>
            ) : (
              <Text className={`text-xs font-bold ${item.isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.label.charAt(0)}
              </Text>
            )}
          </View>
          <Text
            className={`text-xs mt-0.5 ${item.isActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
