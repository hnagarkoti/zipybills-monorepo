import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@zipybills/ui-query';
import { ServerErrorPage } from '@zipybills/ui-components';

/**
 * Expo Router ErrorBoundary – catches unhandled JS errors
 * at the root level and shows a production-grade error page.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <ServerErrorPage
      error={error}
      onRetry={retry}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
