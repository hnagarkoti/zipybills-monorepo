/**
 * users/_layout – Stack layout for nested user routes
 *
 * Renders /users (list), /users/add (create), /users/:id (edit)
 * using Expo Router's Stack with no visible header (AppShell handles it).
 */
import { Stack } from 'expo-router';

export default function UsersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
