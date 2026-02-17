/**
 * StatCard – metric display card (shadcn-rn pattern)
 *
 * Extracted from DashboardPage to be reusable across all features.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';

export type StatCardColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'emerald';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: StatCardColor;
  icon?: React.ReactNode;
  className?: string;
}

const bgColors: Record<StatCardColor, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20',
  green: 'bg-green-50 dark:bg-green-900/20',
  red: 'bg-red-50 dark:bg-red-900/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
  purple: 'bg-purple-50 dark:bg-purple-900/20',
  gray: 'bg-gray-50 dark:bg-gray-800',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
};

const textColors: Record<StatCardColor, string> = {
  blue: 'text-blue-700 dark:text-blue-400',
  green: 'text-green-700 dark:text-green-400',
  red: 'text-red-700 dark:text-red-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  purple: 'text-purple-700 dark:text-purple-400',
  gray: 'text-gray-700 dark:text-gray-300',
  emerald: 'text-emerald-700 dark:text-emerald-400',
};

const labelColors: Record<StatCardColor, string> = {
  blue: 'text-blue-500 dark:text-blue-400',
  green: 'text-green-500 dark:text-green-400',
  red: 'text-red-500 dark:text-red-400',
  yellow: 'text-yellow-500 dark:text-yellow-400',
  purple: 'text-purple-500 dark:text-purple-400',
  gray: 'text-gray-500 dark:text-gray-400',
  emerald: 'text-emerald-500 dark:text-emerald-400',
};

export function StatCard({
  label,
  value,
  subtitle,
  color = 'gray',
  icon,
  className,
}: StatCardProps) {
  return (
    <View className={cn(bgColors[color], 'rounded-xl p-4 border border-gray-100 dark:border-gray-800', className)}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className={cn('text-xs font-medium', labelColors[color])}>{label}</Text>
        {icon}
      </View>
      <Text className={cn('text-2xl font-bold', textColors[color])}>{value}</Text>
      {subtitle && (
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</Text>
      )}
    </View>
  );
}
