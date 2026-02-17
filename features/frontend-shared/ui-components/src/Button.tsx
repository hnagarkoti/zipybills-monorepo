/**
 * Button – shadcn-rn pattern with NativeWind className
 *
 * Variants: primary | secondary | outline | ghost | destructive
 * Sizes: sm | md | lg
 *
 * Primary variant uses expo-linear-gradient for the blue→purple brand gradient.
 * NativeWind's `bg-gradient-to-r` is CSS-only and silently fails on RN.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

/* Brand gradient (matches marketing-site "Start Free Trial") */
const BRAND_GRADIENT: [string, string] = ['#2563eb', '#9333ea'];

/* Non-primary variant NativeWind classes */
const variantStyles: Record<Exclude<ButtonVariant, 'primary'>, string> = {
  secondary: 'bg-slate-700 active:bg-slate-800 dark:bg-slate-600 dark:active:bg-slate-700',
  outline:
    'bg-transparent border border-gray-300 active:bg-gray-50 dark:border-gray-600 dark:active:bg-gray-800',
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

/* NativeWind size classes (non-primary) */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-md',
  md: 'px-4 py-2.5 rounded-lg',
  lg: 'px-6 py-3.5 rounded-xl',
};

/* RN style sizes for LinearGradient container (primary) */
const gradientSizeStyles: Record<ButtonSize, StyleProp<ViewStyle>> = {
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'outline' || variant === 'ghost' ? '#374151' : '#ffffff'}
      size="small"
    />
  ) : (
    <Text
      className={cn('font-semibold', variantTextStyles[variant], sizeTextStyles[size], textClassName)}
    >
      {children}
    </Text>
  );

  /* ── Primary: native linear gradient ── */
  if (variant === 'primary') {
    return (
      <Pressable
        disabled={isDisabled}
        className={cn(isDisabled && 'opacity-50', className)}
        {...props}
      >
        <LinearGradient
          colors={BRAND_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={gradientSizeStyles[size]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  /* ── Other variants: NativeWind className ── */
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
      {content}
    </Pressable>
  );
}
