export interface AuthUser {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    /** H1: Tenant context from JWT */
    tenant_id?: number;
    /** H3: Plan awareness for UI restrictions */
    plan?: string;
    /** Tenant display name */
    tenant_name?: string;
    /** Fine-grained permissions from RBAC */
    permissions?: string[];
    /** True if this user is the platform super-admin */
    is_platform_admin?: boolean;
    /** Access scope: PLATFORM for super admin, TENANT for tenant users */
    scope?: 'PLATFORM' | 'TENANT';
    /** Trial expiry date (ISO string) */
    trial_ends_at?: string;
    /** Tenant account status: ACTIVE, TRIAL, SUSPENDED, etc. */
    tenant_status?: string;
    /** Plan limits */
    max_users?: number;
    max_machines?: number;
}
export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: AuthUser, token: string) => void;
    logout: () => void;
    /** H1: Update tenant metadata after login */
    setTenantInfo: (info: {
        tenant_id?: number;
        plan?: string;
        tenant_name?: string;
    }) => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "setState" | "persist"> & {
    setState(partial: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>), replace?: false | undefined): unknown;
    setState(state: AuthState | ((state: AuthState) => AuthState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, unknown, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, unknown, unknown>>;
    };
}>;
//# sourceMappingURL=auth-store.d.ts.map