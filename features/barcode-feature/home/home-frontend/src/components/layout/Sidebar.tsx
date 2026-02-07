import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  onPress?: () => void;
  isActive?: boolean;
}

export interface SidebarProps {
  /** Navigation items displayed in the sidebar */
  items: NavItem[];
  /** Whether the sidebar is collapsed (icon-only mode) */
  collapsed?: boolean;
  /** Callback when collapse toggle is pressed */
  onToggleCollapse?: () => void;
  /** App/brand title shown at top */
  title?: string;
  /** Subtitle or tagline */
  subtitle?: string;
  /** Content to render in the footer (e.g. user profile) */
  footer?: React.ReactNode;
}

export function Sidebar({
  items,
  collapsed = false,
  onToggleCollapse,
  title = 'Zipybills',
  subtitle,
  footer,
}: SidebarProps) {
  return (
    <View
      className={`bg-surface h-full border-r border-gray-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <View className="px-4 py-5 border-b border-gray-200">
        <Text className="text-lg font-bold text-primary">
          {collapsed ? title.charAt(0) : title}
        </Text>
        {!collapsed && subtitle && (
          <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
        )}
      </View>

      {/* Navigation Items */}
      <ScrollView className="flex-1 py-2">
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            className={`mx-2 my-0.5 px-3 py-2.5 rounded-lg flex-row items-center ${
              item.isActive
                ? 'bg-primary-50'
                : 'bg-transparent'
            }`}
          >
            {/* Icon placeholder */}
            <View
              className={`w-8 h-8 rounded-md items-center justify-center ${
                item.isActive ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  item.isActive ? 'text-white' : 'text-gray-600'
                }`}
              >
                {item.icon || item.label.charAt(0)}
              </Text>
            </View>
            {!collapsed && (
              <Text
                className={`ml-3 text-sm font-medium ${
                  item.isActive ? 'text-primary' : 'text-gray-700'
                }`}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <Pressable
          onPress={onToggleCollapse}
          className="mx-2 mb-2 px-3 py-2.5 rounded-lg items-center bg-gray-100"
        >
          <Text className="text-xs text-gray-600 font-medium">
            {collapsed ? '→' : '← Collapse'}
          </Text>
        </Pressable>
      )}

      {/* Footer */}
      {footer && (
        <View className="px-4 py-3 border-t border-gray-200">{footer}</View>
      )}
    </View>
  );
}
