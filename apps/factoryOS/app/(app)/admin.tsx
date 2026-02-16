/**
 * Admin route – /admin
 *
 * Renders the Admin Panel page (Phase 2).
 * Restricted to ADMIN role via route config + backend middleware.
 */
import React from 'react';
import { AdminPage } from '@zipybills/factory-admin-frontend';

export default function AdminRoute() {
  return <AdminPage />;
}
