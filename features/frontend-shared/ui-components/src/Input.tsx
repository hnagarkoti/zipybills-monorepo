/**
 * Input – shadcn-rn pattern with NativeWind className
 */
import React from 'react';
import { TextInput, View, Text, type TextInputProps } from 'react-native';
import { cn } from './cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  inputClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('mb-3', className)}>
      {label && (
        <Text className="text-xs text-gray-500 mb-1 font-medium">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white',
          error && 'border-red-500',
          inputClassName,
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-xs text-gray-400 mt-1">{helperText}</Text>
      )}
    </View>
  );
}
