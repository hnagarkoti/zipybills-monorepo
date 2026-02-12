/**
 * ProgressBar – horizontal progress indicator
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';

export type ProgressBarColor = 'green' | 'yellow' | 'red' | 'blue' | 'emerald';

export interface ProgressBarProps {
  value: number;       // 0–100
  color?: ProgressBarColor;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles: Record<ProgressBarColor, string> = {
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
};

const heightStyles: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  color = 'emerald',
  showLabel = false,
  height = 'md',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View className={cn('w-full', className)}>
      <View className={cn('bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', heightStyles[height])}>
        <View
          className={cn('h-full rounded-full', colorStyles[color])}
          style={{ width: `${clamped}%` }}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{clamped}%</Text>
      )}
    </View>
  );
}
