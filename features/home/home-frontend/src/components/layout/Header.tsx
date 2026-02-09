import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Menu } from 'lucide-react-native';

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
  return (
    <View className="h-14 bg-white border-b border-gray-200 flex-row items-center px-4">
      {showMenuToggle && (
        <Pressable
          onPress={onMenuPress}
          className="w-10 h-10 rounded-lg items-center justify-center mr-3 bg-gray-100"
        >
          <Menu size={20} color="#374151" />
        </Pressable>
      )}
      <Text className="text-lg font-semibold text-gray-900 flex-1">{title}</Text>
      {rightContent && <View className="flex-row items-center">{rightContent}</View>}
    </View>
  );
}
