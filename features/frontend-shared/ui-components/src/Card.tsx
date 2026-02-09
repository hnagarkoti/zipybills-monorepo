/**
 * Card – shadcn-rn pattern with NativeWind className
 *
 * Composable: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 */
import React from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { cn } from './cn';

/* ─── Card ──────────────────────────────────── */
export interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('bg-white rounded-xl border border-gray-100 p-4', className)} {...props}>
      {children}
    </View>
  );
}

/* ─── CardHeader ────────────────────────────── */
export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('mb-3', className)} {...props}>
      {children}
    </View>
  );
}

/* ─── CardTitle ─────────────────────────────── */
export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <Text className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </Text>
  );
}

/* ─── CardDescription ───────────────────────── */
export function CardDescription({ className, children }: CardTitleProps) {
  return (
    <Text className={cn('text-sm text-gray-500 mt-0.5', className)}>
      {children}
    </Text>
  );
}

/* ─── CardContent ───────────────────────────── */
export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('', className)} {...props}>
      {children}
    </View>
  );
}

/* ─── CardFooter ────────────────────────────── */
export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <View className={cn('flex-row gap-2 mt-3 pt-3 border-t border-gray-50', className)} {...props}>
      {children}
    </View>
  );
}
