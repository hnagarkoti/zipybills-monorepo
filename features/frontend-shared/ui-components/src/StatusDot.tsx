/**
 * StatusDot – colored dot indicator for machine/process status
 */
import React from 'react';
import { View } from 'react-native';
import { cn } from './cn';

export type StatusDotColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue';

export interface StatusDotProps {
  color?: StatusDotColor;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const colorStyles: Record<StatusDotColor, string> = {
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  gray: 'bg-gray-400',
  blue: 'bg-blue-400',
};

const sizeStyles: Record<string, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
};

export function StatusDot({
  color = 'gray',
  size = 'md',
  className,
}: StatusDotProps) {
  return (
    <View
      className={cn(
        'rounded-full',
        colorStyles[color],
        sizeStyles[size],
        className,
      )}
    />
  );
}
