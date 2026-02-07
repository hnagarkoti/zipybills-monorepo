import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomePage } from '@zipybills/factory-home-frontend';

export default function App() {
  return (
    <SafeAreaProvider>
      <HomePage />
    </SafeAreaProvider>
  );
}
