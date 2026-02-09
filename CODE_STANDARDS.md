# ZipyBills – Code Standards & Engineering Guidelines

> **Version:** 2.0.0 · **Applies to:** All packages under `@zipybills/*`

---

## Table of Contents

1. [File & Module Size Limits](#1-file--module-size-limits)
2. [Function Standards](#2-function-standards)
3. [Naming Conventions](#3-naming-conventions)
4. [Folder & Package Structure](#4-folder--package-structure)
5. [TypeScript Rules](#5-typescript-rules)
6. [React & React Native](#6-react--react-native)
7. [State Management](#7-state-management)
8. [Icons & Assets](#8-icons--assets)
9. [Styling (NativeWind)](#9-styling-nativewind)
10. [Shared UI Components](#10-shared-ui-components)
11. [API & Data Fetching](#11-api--data-fetching)
12. [Error Handling](#12-error-handling)
13. [Testing](#13-testing)
14. [Git & Commit Conventions](#14-git--commit-conventions)
15. [Pull Request Guidelines](#15-pull-request-guidelines)
16. [SaaS Product Standards](#16-saas-product-standards)
17. [ESLint Enforcement Summary](#17-eslint-enforcement-summary)
18. [Shared Packages Reference](#18-shared-packages-reference)

---

## 1. File & Module Size Limits

| Metric | Limit | ESLint Rule |
| --- | --- | --- |
| Lines per file | **≤ 300** | `max-lines` |
| Lines per function | **≤ 80** | `max-lines-per-function` |
| Parameters per function | **≤ 4** | `max-params` |
| Cyclomatic complexity | **≤ 15** | `complexity` |

**When a file exceeds 300 lines:**

1. Extract helper functions into a `utils/` folder alongside the component.
2. Extract sub-components into their own files.
3. Move shared logic into a feature's `shared/` package or `frontend-shared/`.

---

## 2. Function Standards

- **Small & focused**: Each function does ONE thing.
- **Max 80 lines** including blank lines and comments.
- **Max 4 parameters**: Group related params into an object/interface.
- **Pure functions preferred**: No side-effects where possible.
- **Named exports only**: `export function doThing()` — never `export default`.

```typescript
// ✅ Good — small, typed, single-purpose
export function calculateEfficiency(produced: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((produced / target) * 100);
}

// ❌ Bad — too many params, mixed concerns
export default function processData(a, b, c, d, e, format) { ... }
```

---

## 3. Naming Conventions

### Files & Folders

| Item | Convention | Example |
| --- | --- | --- |
| Component files | PascalCase | `DashboardPage.tsx` |
| Hook files | camelCase with `use` prefix | `useAuthStore.ts` |
| Utility files | kebab-case | `date-helpers.ts` |
| Service files | kebab-case | `api.ts`, `api-client.ts` |
| Type files | kebab-case | `types.ts` |
| Test files | same name + `.test` | `api.test.ts` |
| Package folders | kebab-case | `auth-frontend/` |

### Code Identifiers

| Item | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `StatCard`, `PageHeader` |
| Functions | camelCase | `fetchDashboard`, `handleSave` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Types & Interfaces | PascalCase | `AuthUser`, `MachineStatus` |
| Enums | PascalCase + UPPER members | `Role.ADMIN` |
| Boolean vars | `is/has/should` prefix | `isActive`, `hasPermission` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleDelete` |
| API functions | `fetch/create/update/delete` prefix | `fetchMachines`, `createUser` |

---

## 4. Folder & Package Structure

### Monorepo Layout

```
zipybills/
├── apps/              # Deployable applications (Expo apps)
├── features/          # Domain features (each = independent package)
│   ├── {feature}/
│   │   ├── {feature}-service-interface/   # Types, DTOs, contracts
│   │   ├── {feature}-service-runtime/     # Express routes, DB queries
│   │   └── {feature}-frontend/            # React Native components
│   ├── frontend-shared/    # Cross-feature frontend packages
│   │   ├── ui-components/  # Reusable UI components
│   │   ├── ui-query/       # React Query provider + keys
│   │   ├── ui-store/       # Zustand stores
│   │   ├── ui-styles/      # NativeWind utilities
│   │   └── ui-theme/       # Theme tokens
│   └── build-shared/       # Build tooling (ESLint, TS config, etc.)
├── tools/             # Developer tooling
└── templates/         # Package scaffolding templates
```

### Feature Package Anatomy

```
{feature}-frontend/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts            # Barrel export
    ├── components/         # Page & presentational components
    ├── hooks/              # Feature-specific hooks
    ├── services/           # API functions for this feature
    └── types/              # Feature-specific types (if needed)
```

### Backend Service Package

```
{feature}-service-runtime/
├── src/
│   ├── index.ts        # Entry point (Express router)
│   ├── routes/         # Express routes
│   ├── controllers/    # Business logic
│   ├── services/       # Data access layer
│   ├── middleware/      # Custom middleware
│   └── types/          # TypeScript types
├── package.json
└── tsconfig.json
```

---

## 5. TypeScript Rules

- **Strict mode always**: `strict: true` in `tsconfig.base.json`.
- **No `any`**: Use `unknown` and narrow with type guards.
- **No `as` type assertions** unless absolutely necessary (add `// eslint-disable` comment with reason).
- **`noUncheckedIndexedAccess: true`**: Array/record access returns `T | undefined`.
- **Explicit return types** on exported functions.
- **Interface over type alias** for object shapes (unless union/intersection needed).

```typescript
// ✅ Good
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
}

// ❌ Bad
catch (err: any) {
  setError(err.message);
}
```

---

## 6. React & React Native

### Component Rules

- One component per file (small helpers in same file OK if < 20 lines).
- Use **functional components** only — no class components.
- Props interface named `{Component}Props`, exported.
- Destructure props in function signature.
- Memoize expensive computations with `useMemo`.
- Memoize callbacks with `useCallback` when passed as props.

### Hooks

- Custom hooks always start with `use`.
- Hooks must live in `hooks/` directory or in a shared package.
- No business logic inside `useEffect` — extract to functions.

### Component Sizing Guideline

| Component Type | Max Lines | Notes |
| --- | --- | --- |
| Page component | 250 | Break into sub-components if larger |
| Presentational component | 100 | Pure rendering, no API calls |
| Shared UI component | 80 | Single responsibility |
| Custom hook | 60 | Extract helpers if complex |

---

## 7. State Management

### Stack

| Concern | Tool | Package |
| --- | --- | --- |
| Server state (API data) | **TanStack React Query** | `@zipybills/ui-query` |
| Client state (UI, auth) | **Zustand** | `@zipybills/ui-store` |
| Form state | **Local `useState`** | Built-in React |

### Banned Libraries

- ❌ **Redux** / `@reduxjs/toolkit` / `react-redux`
- ❌ **MobX**
- ❌ **Context API for global state** (use Zustand instead)

### React Query Conventions

- All query keys via `queryKeys` factory from `@zipybills/ui-query`.
- `staleTime: 30_000` (30s) default.
- `refetchInterval` for real-time data (e.g., dashboard).
- Wrap app root with `<QueryProvider>`.

### Zustand Conventions

- One store per domain: `useAuthStore`, `useAppStore`.
- Stores live in `@zipybills/ui-store`.
- Use selectors for granular subscriptions: `useAuthStore((s) => s.user)`.

---

## 8. Icons & Assets

### Icon Library

- ✅ **Only** use `lucide-react-native` for all icons.
- ❌ **Banned**: `@expo/vector-icons`, `react-native-vector-icons`, emoji strings.

### Usage Pattern

```tsx
import { Factory, AlertTriangle, Plus } from 'lucide-react-native';

<Factory size={16} color="#059669" />
<AlertTriangle size={14} color="#dc2626" />
```

### Rules

- Always provide explicit `size` and `color` props.
- Use hex colors from the design system, not Tailwind class names.
- Never use emoji (👑🔧⚠️) as UI icons — always lucide components.

---

## 9. Styling (NativeWind)

- All styling via **NativeWind `className`** props — no inline `style` objects except for dynamic values (e.g., `width: \`${pct}%\``).
- Tailwind classes in `className`, never in JavaScript template strings for static styles.
- Use the `cn()` utility from `@zipybills/ui-components` for conditional classes.
- Import `global.css` in the root layout file.

```tsx
// ✅ Good
<View className={cn('rounded-lg p-4', isActive && 'bg-green-50')} />

// ❌ Bad
<View style={{ borderRadius: 8, padding: 16, backgroundColor: isActive ? '#f0fdf4' : undefined }} />
```

---

## 10. Shared UI Components

All reusable UI lives in `@zipybills/ui-components`. Follow the **shadcn-rn pattern**:

### Available Components

| Component | Purpose |
| --- | --- |
| `Button` | 5 variants: default, secondary, outline, destructive, ghost |
| `Card` | Composable card with Header, Content, Footer |
| `Input` | Styled text input |
| `Text` | Typography wrapper |
| `Badge` | Status/role/category labels (uses `children`, not `label`) |
| `StatusDot` | Colored dot indicator (uses `color` prop) |
| `Alert` | Error, warning, success, info alerts |
| `Avatar` | User avatar with fallback initials |
| `Loading` | Spinner with optional message |
| `EmptyState` | Icon + title + description for empty lists |
| `PageHeader` | Page title, subtitle, action buttons (uses `actions` prop) |
| `StatCard` | Metric display card |
| `ProgressBar` | Horizontal progress indicator (height: `'sm'`, `'md'`, `'lg'`) |
| `IconButton` | Pressable icon wrapper |
| `Divider` | Horizontal separator |

### Rules

- **Always check shared components first** before building inline.
- New shared components must follow the same pattern: typed props, `cn()` utility, `className` passthrough.
- Export from barrel `index.ts`.

---

## 11. API & Data Fetching

### REST API Conventions

- Base URL via `API_BASE_URL` from `@zipybills/factory-api-client`.
- Auth token sent via `Authorization: Bearer <token>` header.
- All API functions in feature's `services/api.ts`.
- Function naming: `fetch*`, `create*`, `update*`, `delete*`.

### Response Handling

```typescript
export async function fetchMachines(): Promise<Machine[]> {
  const res = await apiGet<Machine[]>('/api/machines');
  return res;
}
```

### Error Shape

All API errors should return:
```json
{ "error": "Human-readable message" }
```

---

## 12. Error Handling

- **Never** use `catch (err: any)` — always `catch (err: unknown)`.
- Narrow with `err instanceof Error ? err.message : 'Unknown error'`.
- Display errors via shared `<Alert variant="error" />` component.
- Log errors with `@zipybills/logger` in backend services.
- Never expose stack traces to users.

---

## 13. Testing

### Structure

- Tests live next to source: `src/__tests__/` or `src/*.test.ts`.
- Use **Vitest** as the test runner.
- Name pattern: `{module}.test.ts` or `{Component}.test.tsx`.

### Coverage Targets

| Metric | Minimum |
| --- | --- |
| Line coverage | 70% |
| Branch coverage | 60% |
| Function coverage | 80% |

### Test Types

| Type | Scope | Tool |
| --- | --- | --- |
| Unit tests | Functions, utilities | Vitest |
| Component tests | UI components | Vitest + React Testing Library |
| Integration tests | API routes | Vitest + Supertest |
| Smoke tests | Full app boot | Custom scripts |

---

## 14. Git & Commit Conventions

### Branch Naming

```
feature/{ticket}-short-description
bugfix/{ticket}-short-description
hotfix/{ticket}-short-description
chore/{ticket}-short-description
```

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`, `ci`, `build`

**Scope:** Feature or package name: `auth`, `machines`, `ui-components`, `api-gateway`

**Examples:**

```
feat(dashboard): add real-time refresh with React Query
fix(auth): handle unknown error type in login catch block
refactor(ui-components): extract Badge variants to separate map
chore(build): add lucide-react-native to catalog
docs: create CODE_STANDARDS.md
```

### Rules

- **One logical change per commit**.
- Max 72 characters for subject line.
- Use imperative mood: "add feature" not "added feature".
- Reference ticket/issue in footer: `Closes #123`.

---

## 15. Pull Request Guidelines

### PR Title

Same format as commit: `feat(scope): description`

### PR Template Checklist

- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings (`pnpm lint`)
- [ ] All new functions have explicit return types
- [ ] No `any` types introduced (or justified with comment)
- [ ] Shared components used where applicable
- [ ] Icons from `lucide-react-native` only
- [ ] Error handling uses `catch (err: unknown)` pattern
- [ ] Tests added/updated for changed logic
- [ ] File stays under 300 lines
- [ ] Functions stay under 80 lines

### Review Standards

- Minimum **1 approval** required.
- CI must pass (lint + typecheck + tests).
- No force-push after review started.

---

## 16. SaaS Product Standards

### Security

- All routes require JWT authentication (except login/register).
- Passwords hashed with **bcryptjs** (salt rounds ≥ 10).
- API rate limiting on sensitive endpoints.
- No secrets in client bundles — use environment variables.
- CORS configured for known origins only.

### Performance

- API responses < 200ms for standard queries.
- Dashboard auto-refresh via `refetchInterval` (10s default).
- Use pagination for list endpoints returning > 50 items.
- Lazy-load heavy features.

### Reliability

- Graceful error states on every page (loading, error, empty).
- Offline-friendly: show last-known data via React Query cache.
- Activity logging for all write operations (create/update/delete).
- Database transactions for multi-table operations.

### Multi-Tenancy Readiness

- All tables have `factory_id` or `tenant_id` column.
- API middleware filters by tenant context.
- No hard-coded factory/tenant references.

### Accessibility

- All interactive elements must be `Pressable` (not `TouchableOpacity`).
- Provide `accessibilityLabel` on icon-only buttons.
- Color is not the only indicator — pair with icons or text.

### Internationalization Readiness

- User-facing strings should be extractable (i18n-ready).
- Use `@zipybills/i18n-feature` for translations when expanding.
- Avoid concatenating translated strings.

### Logging & Monitoring

- Structured logging via `@zipybills/logger`.
- Log levels: `debug`, `info`, `warn`, `error`.
- Include `correlationId` for request tracing.
- Never log passwords, tokens, or PII.

---

## 17. ESLint Enforcement Summary

All rules are enforced in `features/build-shared/ts-lint/eslint.config.js`:

```javascript
{
  'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
  'max-params': ['warn', 4],
  'complexity': ['warn', 15],
  'no-restricted-imports': ['error', {
    paths: [
      { name: '@expo/vector-icons', message: 'Use lucide-react-native instead.' },
      { name: 'redux', message: 'Use Zustand for state management.' },
      { name: '@reduxjs/toolkit', message: 'Use Zustand for state management.' },
      { name: 'react-redux', message: 'Use Zustand for state management.' },
    ],
  }],
}
```

---

## 18. Shared Packages Reference

### @zipybills/eslint-config
**Location:** `features/build-shared/eslint-config/`

| Config | Target |
| --- | --- |
| `@zipybills/eslint-config` (base) | All TypeScript packages |
| `@zipybills/eslint-config/react` | React/Vite frontends |
| `@zipybills/eslint-config/node` | Node.js backend services |

### @zipybills/prettier-config
**Location:** `features/build-shared/prettier-config/`

Print width 100, 2-space tabs, single quotes, trailing commas ES5, LF endings.

### @zipybills/ts-config
**Location:** `features/build-shared/ts-config/`

Base, React, and Node configs. Extends with `"extends": "@zipybills/ts-config/react"`.

### @zipybills/logger
**Location:** `features/logger/`

Browser + Node.js dual implementation, auto-detection, child loggers, structured output.

### @zipybills/ui-components
**Location:** `features/frontend-shared/ui-components/`

15+ NativeWind + shadcn-rn pattern components (see Section 10).

### @zipybills/ui-query
**Location:** `features/frontend-shared/ui-query/`

React Query `QueryProvider`, `queryClient` config (staleTime 30s, gcTime 5min, retry 2), and centralized `queryKeys` factory.

### @zipybills/ui-store
**Location:** `features/frontend-shared/ui-store/`

Zustand stores: `useAuthStore` (user, token, login/logout), `useAppStore` (activeSection, sidebarOpen, isOnline).

---

## Quick Reference Card

```
✅ DO                              ❌ DON'T
─────────────────────────────────  ─────────────────────────────────
lucide-react-native icons          Emoji strings or @expo/vector-icons
catch (err: unknown)               catch (err: any)
Zustand + React Query              Redux or Context for global state
NativeWind className               Inline style objects
Shared UI components               Inline one-off styled Views
Named exports                      Default exports
< 300 lines per file               Monolithic 500+ line files
< 80 lines per function            100+ line monster functions
Types & interfaces                 any / unknown without narrowing
Conventional commits               Vague "fixed stuff" messages
Badge with children                Badge with label prop
PageHeader with actions prop       PageHeader with action prop
StatusDot with color prop          StatusDot with status prop
ProgressBar height "sm"|"md"|"lg"  ProgressBar height as number
```

---

_Last updated: 2025_
