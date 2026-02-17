import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@zipybills/ui-query';
import { ServerErrorPage } from '@zipybills/ui-components';
import { ThemeProvider, useTheme } from '@zipybills/theme-engine';
import { ComplianceProvider, useComplianceStore } from '@zipybills/ui-store';

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

/**
 * Syncs compliance mode from the compliance store (server-backed)
 * into the theme store so the watermark & theme tokens stay in sync.
 */
function ComplianceThemeSync() {
  const complianceMode = useComplianceStore((s) => s.settings.compliance_mode);
  const isLoaded = useComplianceStore((s) => s.isLoaded);
  const { setComplianceMode } = useTheme();

  useEffect(() => {
    if (isLoaded && complianceMode) {
      setComplianceMode(complianceMode as any);
    }
  }, [complianceMode, isLoaded, setComplianceMode]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <ComplianceProvider>
            <ComplianceThemeSync />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="platform" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </ComplianceProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
