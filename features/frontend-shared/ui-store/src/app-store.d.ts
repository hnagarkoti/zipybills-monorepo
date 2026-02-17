type AppSection = 'dashboard' | 'machines' | 'shifts' | 'planning' | 'downtime' | 'reports' | 'users' | 'settings';
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
export declare const useAppStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AppState>>;
export {};
//# sourceMappingURL=app-store.d.ts.map