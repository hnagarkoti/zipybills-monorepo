import React from 'react';
import { ProjectsPage } from '@zipybills/factory-paytrack-frontend';
import { useAuthStore } from '@zipybills/ui-store';

export default function PayTrackProjectsRoute() {
  const { user } = useAuthStore();
  return <ProjectsPage userRole={user?.role ?? 'OPERATOR'} />;
}
