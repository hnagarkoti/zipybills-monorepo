# Zipybills Monorepo - Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
├──────────────────────┬──────────────────────────────────────┤
│   Mobile (Expo)      │          Web (Vite)                  │
│   - iOS              │          - Desktop Browser            │
│   - Android          │          - Mobile Browser             │
└──────────────────────┴──────────────────────────────────────┘
                            │
                            │ Uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feature Packages                          │
├─────────────────────┬───────────────────┬───────────────────┤
│  Frontend Shared    │   Core Features   │   Build Shared    │
│  - UI Components    │   - Auth          │   - TS Config     │
│  - Theme            │   - Analytics     │   - Linting       │
│  - Styles           │   - i18n          │   - Testing       │
│                     │   - Feature Flags │                   │
│                     │   - State         │                   │
│                     │   - Utils         │                   │
└─────────────────────┴───────────────────┴───────────────────┘
```

## Design Principles

### 1. Write Once, Deploy Everywhere
- Single codebase for iOS, Android, and Web
- Platform-specific code only when necessary
- Use `.native.tsx` and `.web.tsx` for platform-specific implementations

### 2. Feature-Based Organization
- Features are self-contained packages
- Clear boundaries and dependencies
- Easy to test and maintain

### 3. Type Safety First
- TypeScript everywhere
- Strict type checking
- Shared type definitions

### 4. Scalable State Management
- Zustand for simple, local state
- Redux Toolkit for complex, global state
- TanStack Query for server state

### 5. Developer Experience
- Fast builds with Turborepo
- Hot reloading in development
- Comprehensive tooling (linting, testing, formatting)

## Key Technologies

### Frontend
- **React** 19.0.0 - UI library
- **React Native** 0.76.6 - Mobile framework
- **React Native Web** - Web compatibility
- **Expo** 52.0 - Development platform

### Styling
- **NativeWind** - Tailwind CSS for React Native
- **Tailwind CSS** - Utility-first CSS
- Custom theme system with design tokens

### State Management
- **Zustand** - Lightweight state management
- **Redux Toolkit** - Complex state patterns
- **TanStack Query** - Server state management

### Navigation
- **Expo Router** - File-based routing (Mobile)
- **React Router** 7.x - Web routing

### Internationalization
- **i18next** - Translation framework
- **react-i18next** - React integration
- **expo-localization** - Device locale detection

### Build & Development
- **Turborepo** - Monorepo build system
- **pnpm** - Fast package manager
- **Vite** - Fast web bundler
- **Metro** - React Native bundler

### Code Quality
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing

## Package Architecture

### Apps Layer
Applications that users interact with. These consume features but don't export anything.

**mobile/** - Native mobile application
- File-based routing with Expo Router
- Native components for iOS/Android
- Deep linking support
- Push notifications ready

**web/** - Web application
- React Router for navigation
- React Native Web for component compatibility
- Responsive design
- PWA-ready

### Features Layer
Reusable business logic and UI components.

#### Frontend Shared
**ui-theme/** - Design tokens and theme configuration
- Colors, spacing, typography
- Light/dark mode support
- Platform-agnostic design system

**ui-components/** - Reusable UI components
- Cross-platform components
- Accessible by default
- Customizable with props

**ui-styles/** - Styling utilities
- NativeWind configuration
- Responsive utilities
- Platform detection helpers

#### Core Features
**auth-feature/** - Authentication & authorization
- Login/logout flows
- OAuth integration (Google, Apple)
- JWT token management
- Permission system

**analytics-feature/** - Event tracking
- Provider-agnostic architecture
- Event buffering
- Privacy-compliant

**i18n-feature/** - Internationalization
- Multi-language support
- RTL support ready
- Date/number formatting

**feature-flags/** - Feature flag management
- Remote configuration support
- A/B testing ready
- Gradual rollouts

**state-feature/** - State management
- Redux store setup
- Typed hooks
- Middleware configuration

**utils-feature/** - Shared utilities
- Validation functions
- Formatting helpers
- Common utilities

#### Build Shared
**ts-config/** - TypeScript configurations
- Base, React, React Native, Node configs
- Strict type checking
- Path aliases support

**ts-lint/** - Linting & formatting
- ESLint configuration
- Prettier configuration
- Import sorting

**vitest-config/** - Testing configuration
- Vitest setup
- Coverage configuration
- Test utilities

**test-coverage/** - Coverage aggregation
- Combines coverage from all packages
- Summary reporting

**template-build/** - Feature generator
- CLI tool for scaffolding
- Template-based generation

## Data Flow

### Authentication Flow
```
User Input → Auth Feature → API
              ↓
           Token Storage
              ↓
       Auth State (Zustand)
              ↓
      Protected Components
```

### Feature Flag Flow
```
App Start → Fetch Flags → Feature Flag Store → Components
                                    ↓
                            Conditional Rendering
```

### Analytics Flow
```
User Action → Analytics Event → Provider Buffer → Analytics Service
                                      ↓
                               Local Debug Log
```

### State Management Strategy
```
UI State → Zustand (local, ephemeral)
Server Data → TanStack Query (cached, invalidated)
Global App State → Redux (complex, persisted)
```

## Cross-Platform Strategy

### Platform Detection
```typescript
import { Platform } from 'react-native';

Platform.OS === 'web' // Web browser
Platform.OS === 'ios' // iOS device
Platform.OS === 'android' // Android device
```

### Platform-Specific Files
```
Button.tsx        // Shared implementation
Button.native.tsx // Mobile-specific
Button.web.tsx    // Web-specific
```

### Platform Selection
```typescript
import { platformSelect } from '@zipybills/ui-styles';

const value = platformSelect({
  web: 'Web value',
  native: 'Mobile value',
  ios: 'iOS-specific',
  android: 'Android-specific',
});
```

## Security Considerations

### Authentication
- JWT tokens stored securely (AsyncStorage native, localStorage web)
- Automatic token refresh
- Secure HTTP-only cookies for web (when possible)

### Data Validation
- Input validation on client and server
- Type-safe API contracts
- Sanitization of user input

### Feature Flags
- Never expose sensitive flags to client
- Server-side flag evaluation for critical features

## Performance Optimization

### Code Splitting
- Lazy loading for routes
- Dynamic imports for large features
- Tree-shaking enabled

### Bundle Optimization
- Shared chunks between web pages
- Platform-specific bundles
- Minimal vendor bundles

### Caching Strategy
- TanStack Query for API caching
- Service Worker for web (PWA)
- Persistent storage for offline support

## Scalability

### Horizontal Scaling
- Stateless features
- API-driven architecture
- Microservices-ready

### Monorepo Benefits
- Shared code reduces duplication
- Consistent tooling across projects
- Atomic commits across features
- Easy refactoring

## Testing Strategy

### Unit Tests
- Vitest for business logic
- React Testing Library for components
- 80%+ coverage target

### Integration Tests
- Feature-level integration tests
- API mocking with MSW

### E2E Tests (Future)
- Detox for mobile
- Playwright for web

## Deployment

### Mobile
- EAS Build for iOS/Android
- Over-the-air updates with EAS Update
- App Store / Play Store distribution

### Web
- Static hosting (Vercel, Netlify, S3)
- CDN distribution
- Environment-based builds

## Future Enhancements

1. **Backend Integration**
   - GraphQL or REST API
   - WebSocket for real-time features

2. **Advanced Features**
   - Offline mode
   - Push notifications
   - Biometric authentication

3. **Developer Tools**
   - Storybook for component development
   - Visual regression testing
   - Performance monitoring

4. **Enterprise Features**
   - SSO integration
   - Advanced RBAC
   - Audit logging
   - Compliance tools (GDPR, SOC2)
