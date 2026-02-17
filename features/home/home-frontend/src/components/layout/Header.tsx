import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useSemanticColors } from '@zipybills/theme-engine';

export interface HeaderProps {
  title?: string;
  showMenuToggle?: boolean;
  onMenuPress?: () => void;
  rightContent?: React.ReactNode;
}

export function Header({
  title = '',
  showMenuToggle = false,
  onMenuPress,
  rightContent,
}: HeaderProps) {
  const sc = useSemanticColors();
  return (
    <View className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-row items-center px-4">
      {showMenuToggle && (
        <Pressable
          onPress={onMenuPress}
          className="w-10 h-10 rounded-lg items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800"
        >
          <Menu size={20} color={sc.textPrimary} />
        </Pressable>
      )}
      <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{title}</Text>
      {rightContent && <View className="flex-row items-center">{rightContent}</View>}
    </View>
  );
}
