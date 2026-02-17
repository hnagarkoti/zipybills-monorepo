import React from 'react';
import { useRouter } from 'expo-router';
import { UsersPage } from '@zipybills/factory-auth-frontend';

export default function UsersRoute() {
  const router = useRouter();
  return (
    <UsersPage
      onAddUser={() => router.push('/users/add' as never)}
      onEditUser={(userId) => router.push(`/users/${userId}` as never)}
    />
  );
}
