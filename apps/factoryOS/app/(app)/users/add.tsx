/**
 * /users/add – Create new user route
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { UserFormPage } from '@zipybills/factory-auth-frontend';

export default function AddUserRoute() {
  const router = useRouter();
  return <UserFormPage mode="create" onBack={() => router.back()} />;
}
