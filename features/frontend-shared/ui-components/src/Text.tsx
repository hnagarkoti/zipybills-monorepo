/**
 * Typography – shadcn-rn pattern with NativeWind className
 */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from './cn';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  body: 'text-base text-gray-700',
  caption: 'text-sm text-gray-500',
  label: 'text-xs text-gray-500 font-medium',
};

export function Typography({ variant = 'body', className, ...props }: TextProps) {
  return (
    <RNText className={cn(variantStyles[variant], className)} {...props} />
  );
}

/** @deprecated Use Typography instead */
export const Text = Typography;
