/**
 * Badge – colored label for status, categories, roles
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-transparent border border-gray-300 text-gray-600',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const colorClass = variantStyles[variant];
  const bgClass = colorClass.split(' ').filter((c) => c.startsWith('bg-') || c.startsWith('border')).join(' ');
  const textClass = colorClass.split(' ').filter((c) => c.startsWith('text-')).join(' ');

  return (
    <View className={cn('px-2 py-0.5 rounded-full self-start', bgClass, className)}>
      <Text className={cn('text-xs font-medium', textClass)}>{children}</Text>
    </View>
  );
}
