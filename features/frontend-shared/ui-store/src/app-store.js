/**
 * App-wide client state – Zustand
 *
 * Lightweight store for UI-only state that doesn't belong to a
 * single feature (e.g. current section, sidebar, connectivity).
 */
import { create } from 'zustand';
export const useAppStore = create((set) => ({
    activeSection: 'dashboard',
    sidebarOpen: false,
    isOnline: true,
    setActiveSection: (section) => set({ activeSection: section }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setOnline: (online) => set({ isOnline: online }),
}));
