import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { UsersPage } from '@zipybills/factory-auth-frontend';

export default function UsersRoute() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Increment refreshKey every time this screen comes into focus
  // (initial mount, back-press from Add/Edit, etc.) so UsersPage
  // always shows the latest list without requiring a full page reload.
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1);
    }, []),
  );

  return (
    <UsersPage
      refreshTrigger={refreshKey}
      onAddUser={() => router.push('/users/add' as never)}
      onEditUser={(userId) => router.push(`/users/${userId}` as never)}
    />
  );
}
