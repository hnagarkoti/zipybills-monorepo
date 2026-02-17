/**
 * PageHeader – consistent page title + subtitle + actions
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between mb-4', className)}>
      <View>
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text>
        )}
      </View>
      {actions && <View className="flex-row items-center gap-2">{actions}</View>}
    </View>
  );
}
