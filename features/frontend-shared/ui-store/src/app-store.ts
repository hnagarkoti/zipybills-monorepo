/**
 * App-wide client state – Zustand
 *
 * Lightweight store for UI-only state that doesn't belong to a
 * single feature (e.g. current section, sidebar, connectivity).
 */
import { create } from 'zustand';

type AppSection =
  | 'dashboard'
  | 'machines'
  | 'shifts'
  | 'planning'
  | 'downtime'
  | 'reports'
  | 'users'
  | 'settings';

export interface AppState {
  /** Currently active section/tab */
  activeSection: AppSection;
  /** Whether the sidebar / drawer is open (tablet / web) */
  sidebarOpen: boolean;
  /** Network connectivity flag */
  isOnline: boolean;

  setActiveSection: (section: AppSection) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  sidebarOpen: false,
  isOnline: true,

  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setOnline: (online) => set({ isOnline: online }),
}));
