/**
 * /users/:id – Edit user route
 */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserFormPage } from '@zipybills/factory-auth-frontend';

export default function EditUserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = parseInt(id ?? '0', 10);

  return (
    <UserFormPage
      mode="edit"
      userId={userId}
      onBack={() => router.back()}
    />
  );
}
