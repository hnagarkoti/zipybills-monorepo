/**
 * Loading – spinner with optional message
 */
import React from 'react';
import { ActivityIndicator, View, Text, type ViewProps } from 'react-native';
import { cn } from './cn';
import { colors } from '@zipybills/theme-engine';

export interface LoadingProps extends ViewProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export function Loading({
  message = 'Loading...',
  size = 'large',
  className,
  ...props
}: LoadingProps) {
  return (
    <View className={cn('flex-1 items-center justify-center p-8', className)} {...props}>
      <ActivityIndicator size={size} color={colors.emerald[500]} />
      {message && (
        <Text className="text-sm text-gray-400 dark:text-gray-500 mt-3">{message}</Text>
      )}
    </View>
  );
}
