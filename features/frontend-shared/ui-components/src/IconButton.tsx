/**
 * IconButton – pressable icon with optional tooltip
 */
import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from './cn';

export type IconButtonVariant = 'default' | 'primary' | 'ghost' | 'destructive';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends PressableProps {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-gray-100 active:bg-gray-200 dark:bg-gray-800 dark:active:bg-gray-700',
  primary: 'bg-emerald-50 active:bg-emerald-100 dark:bg-emerald-900/30 dark:active:bg-emerald-800/40',
  ghost: 'bg-transparent active:bg-gray-100 dark:active:bg-gray-800',
  destructive: 'bg-red-50 active:bg-red-100 dark:bg-red-900/30 dark:active:bg-red-800/40',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export function IconButton({
  variant = 'default',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-lg',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
}
