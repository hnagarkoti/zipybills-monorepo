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
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  red: 'bg-red-50',
  yellow: 'bg-yellow-50',
  purple: 'bg-purple-50',
  gray: 'bg-gray-50',
  emerald: 'bg-emerald-50',
};

const textColors: Record<StatCardColor, string> = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  red: 'text-red-700',
  yellow: 'text-yellow-700',
  purple: 'text-purple-700',
  gray: 'text-gray-700',
  emerald: 'text-emerald-700',
};

const labelColors: Record<StatCardColor, string> = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  purple: 'text-purple-500',
  gray: 'text-gray-500',
  emerald: 'text-emerald-500',
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
    <View className={cn(bgColors[color], 'rounded-xl p-4 border border-gray-100', className)}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className={cn('text-xs font-medium', labelColors[color])}>{label}</Text>
        {icon}
      </View>
      <Text className={cn('text-2xl font-bold', textColors[color])}>{value}</Text>
      {subtitle && (
        <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>
      )}
    </View>
  );
}
