export { HomePage } from './components/HomePage';

// Layout components
export {
  AppShell,
  Sidebar,
  Header,
  BottomNav,
  ResponsiveGrid,
} from './components/layout';
export type {
  AppShellProps,
  SidebarProps,
  HeaderProps,
  BottomNavProps,
  ResponsiveGridProps,
  NavItem,
} from './components/layout';

// Page components
export { ScanPage } from './components/pages/ScanPage';
export { InventoryPage } from './components/pages/InventoryPage';
export { ReportsPage } from './components/pages/ReportsPage';
export { SettingsPage } from './components/pages/SettingsPage';

// API services
export {
  fetchMachines,
  generateBarcode,
  fetchBarcodes,
  fetchBarcodeDetails,
  scanBarcode,
  fetchDashboard,
  resetDatabase,
} from './services/api';
export type {
  Machine,
  BarcodeRecord,
  MachineDataRecord,
  ScanResult,
  DashboardData,
} from './services/api';
