import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { colors, spacing } from '@zipybills/ui-theme';

import { Text } from './Text';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text variant="label" style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.gray[400]}
        {...props}
      />
      {error && <Text variant="caption" color={colors.error[500]} style={styles.error}>{error}</Text>}
      {helperText && !error && <Text variant="caption" style={styles.helper}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontSize: 16,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  error: {
    marginTop: spacing[1],
  },
  helper: {
    marginTop: spacing[1],
    color: colors.gray[600],
  },
});
