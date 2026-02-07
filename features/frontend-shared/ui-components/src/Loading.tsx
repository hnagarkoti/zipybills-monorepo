import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, spacing } from '@zipybills/ui-theme';

import { Text } from './Text';

export interface LoadingProps extends ViewProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <ActivityIndicator size={size} color={colors.primary[600]} />
      {message && (
        <Text variant="body" style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  message: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
});
