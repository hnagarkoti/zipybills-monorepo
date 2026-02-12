
Language Translations Prompt
    Context:
    We are building FactoryOS – Hybrid Production Monitoring Platform (SaaS + On-Prem) using Expo + React Native + React Native Web + Node.js, with modular features/* architecture.
    Copilot already has project structure context.

    Task:
    Implement a production-grade, enterprise multilingual (i18n) system as a core platform capability (not a UI helper).

    Languages to support:
    English, Hindi, French, Spanish (extensible for more languages).

    Requirements:

    Modular, feature-scoped translations (features/*/i18n)

    Single codebase support (web + iOS + Android)

    Runtime language switching (no reload)

    Offline-first support (On-Prem)

    Multi-tenant language support (SaaS)

    Tenant/factory default language config

    User language preference

    Role-based language overrides

    Central language registry

    Language resolver engine

    Layered language resolution:

    User → Role → Tenant/Factory → System → English fallback


    Local JSON language bundles (On-Prem)

    API-driven language delivery (SaaS)

    Secure tenant isolation

    Lazy loading + caching

    No CDN dependency

    Deliverables:

    i18n architecture

    Language registry + resolver

    Translation loading strategy

    Folder structure integration

    JSON schema for translations

    Frontend hooks/utilities

    Backend language service integration

    Offline fallback logic

    Admin language control model

    Design Principle:
    This must be a platform-level language system, not a UI library setup.
    Think enterprise platform architecture, not app-level translations.

        Addendum: Theming, Settings, and Compliance

        Theming (gap fill):
        - Platform-level theming system with design tokens in features/frontend-shared/ui-theme.
        - Multi-tenant theme support with tenant/factory defaults and optional user overrides.
        - Theming must be offline-first and on-prem ready (local token bundles).
        - Theme resolution order:
            User preference (if allowed) → Role policy → Tenant/Factory default → System default.
        - Support at minimum: Default, Light, Dark, and System (OS sync).
        - Allow custom enterprise themes per tenant (brand colors, density, typography tokens).
        - No runtime reload; theme switch should be live and cached.

        Settings: user option to change theme
        - Provide an Appearance section in user settings.
        - Options: Default (tenant), Light, Dark, System.
        - User override must be controlled by tenant policy (enable/disable).
        - Role-based restrictions can lock theme (ex: Operator uses high-contrast).
        - Persist choice locally and sync to tenant profile when online.

        Compliance modes: audit-mode and traceability-mode
        - audit-mode: read-only, immutable views with expanded audit metadata and export-ready views.
            Use during internal/external audits, incident reviews, and regulated inspections.
        - traceability-mode: enforces end-to-end lineage display (inputs → process → outputs),
            captures extra events, and requires stricter data integrity checks for every action.
        - Activation:
            Admin toggle per tenant/factory, or auto-enable for specific regulated workflows.
            Can be time-bound (audit window) or always-on (regulated industries).
        - Behavior:
            Adds mandatory audit headers, disables destructive actions, and logs all reads/exports.
            Provides trace IDs, batch/lot lineage, and policy-driven retention rules.

        Real use case guidance (theming)
        - During company registration/onboarding, set a tenant default theme and brand tokens.
        - Admin can later update tenant theme or allow user overrides.
        - Individual users may choose Light/Dark/System if policy allows; otherwise they inherit
            the tenant default with role-specific constraints.