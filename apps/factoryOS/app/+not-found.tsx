/**
 * +not-found – Expo Router 404 handler
 *
 * Catches all unmatched routes and shows an industry-grade
 * "Page Not Found" screen.
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { NotFoundPage } from '@zipybills/ui-components';

export default function NotFound() {
  const router = useRouter();

  return (
    <NotFoundPage
      onGoBack={() => router.back()}
      onGoHome={() => router.replace('/dashboard')}
    />
  );
}
