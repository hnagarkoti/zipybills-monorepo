import React from 'react';
import { useRouter } from 'expo-router';
import { PayTrackPage } from '@zipybills/factory-paytrack-frontend';

export default function PayTrackRoute() {
  const router = useRouter();
  const handleNavigate = (path: string) => router.push(path as never);
  return <PayTrackPage onNavigate={handleNavigate} />;
}
