/**
 * @zipybills/factory-paytrack-frontend
 *
 * Public API for the PayTrack feature module.
 * Apps import from this barrel file to compose the paytrack UI.
 */

// Layout + Index page (settings-like sidebar pattern)
export { PayTrackPage, PayTrackLayout, getVisiblePayTrackTabs, type PayTrackPageProps, type PayTrackTab } from './components/PayTrackPage';

// Individual sub-pages (each mapped to a route)
export { PayTrackDashboard } from './components/PayTrackDashboard';
export { MaterialsPage } from './components/MaterialsPage';
export { ProjectsPage } from './components/ProjectsPage';
export { VendorsPage } from './components/VendorsPage';
export { PaymentsPage } from './components/PaymentsPage';

// Re-export formatted helpers for use in other packages
export { formatCurrency, formatDate, formatDateTime } from './hooks/usePayTrack';
