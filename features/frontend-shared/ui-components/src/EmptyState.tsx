/**
 * EmptyState – placeholder for empty lists/screens
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center py-12 px-6', className)}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-gray-500 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-400 mt-1 text-center max-w-xs">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-4">
          <Button variant="primary" size="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}
