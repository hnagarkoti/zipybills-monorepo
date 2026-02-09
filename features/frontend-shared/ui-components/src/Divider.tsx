/**
 * Divider – horizontal rule
 */
import React from 'react';
import { View } from 'react-native';
import { cn } from './cn';

export interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return <View className={cn('h-px bg-gray-200 my-3', className)} />;
}
