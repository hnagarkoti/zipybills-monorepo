/**
 * Button – shadcn-rn pattern with NativeWind className
 *
 * Variants: primary | secondary | outline | ghost | destructive
 * Sizes: sm | md | lg
 */
import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 active:bg-emerald-600',
  secondary: 'bg-slate-700 active:bg-slate-800 dark:bg-slate-600 dark:active:bg-slate-700',
  outline: 'bg-transparent border border-gray-300 active:bg-gray-50 dark:border-gray-600 dark:active:bg-gray-800',
  ghost: 'bg-transparent active:bg-gray-100 dark:active:bg-gray-800',
  destructive: 'bg-red-500 active:bg-red-600',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-gray-700 dark:text-gray-300',
  ghost: 'text-gray-700 dark:text-gray-300',
  destructive: 'text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-md',
  md: 'px-4 py-2.5 rounded-lg',
  lg: 'px-6 py-3.5 rounded-xl',
};

const sizeTextStyles: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50',
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? '#374151' : '#ffffff'}
          size="small"
        />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            variantTextStyles[variant],
            sizeTextStyles[size],
            textClassName,
          )}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
