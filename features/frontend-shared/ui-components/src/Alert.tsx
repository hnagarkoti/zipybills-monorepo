/**
 * Alert – feedback banners for success, error, warning, info
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from './cn';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string }> = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

export function Alert({
  variant = 'info',
  title,
  message,
  onDismiss,
  className,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <View className={cn('rounded-lg p-3 border', styles.bg, styles.border, className)}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          {title && (
            <Text className={cn('text-sm font-semibold mb-0.5', styles.text)}>{title}</Text>
          )}
          <Text className={cn('text-sm', styles.text)}>{message}</Text>
        </View>
        {onDismiss && (
          <Pressable onPress={onDismiss} className="ml-2 p-1">
            <Text className={cn('text-sm', styles.text)}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
