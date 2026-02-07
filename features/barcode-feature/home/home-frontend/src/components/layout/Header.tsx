import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface HeaderProps {
  /** Title displayed in the header */
  title?: string;
  /** Whether to show the menu toggle button (for mobile sidebar) */
  showMenuToggle?: boolean;
  /** Callback when menu button is pressed */
  onMenuPress?: () => void;
  /** Content rendered on the right side (e.g. avatar, notifications) */
  rightContent?: React.ReactNode;
}

export function Header({
  title = '',
  showMenuToggle = false,
  onMenuPress,
  rightContent,
}: HeaderProps) {
  return (
    <View className="h-14 bg-white border-b border-gray-200 flex-row items-center px-4">
      {/* Menu Toggle (mobile) */}
      {showMenuToggle && (
        <Pressable
          onPress={onMenuPress}
          className="w-10 h-10 rounded-lg items-center justify-center mr-3 bg-gray-100"
        >
          <Text className="text-lg text-gray-700">☰</Text>
        </Pressable>
      )}

      {/* Title */}
      <Text className="text-lg font-semibold text-gray-900 flex-1">
        {title}
      </Text>

      {/* Right Actions */}
      {rightContent && <View className="flex-row items-center">{rightContent}</View>}
    </View>
  );
}
