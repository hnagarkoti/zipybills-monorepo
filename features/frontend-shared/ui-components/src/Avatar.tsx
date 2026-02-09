/**
 * Avatar – user initials circle
 */
import React from 'react';
import { View, Text } from 'react-native';
import { cn } from './cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const s = sizeStyles[size];

  return (
    <View
      className={cn(
        'rounded-full bg-emerald-100 items-center justify-center',
        s.container,
        className,
      )}
    >
      <Text className={cn('font-semibold text-emerald-700', s.text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
