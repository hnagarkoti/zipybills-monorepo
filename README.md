# Zipybills Monorepo

A modern, cross-platform SaaS billing application built with React Native, Expo, and React Native Web.

## 🚀 Features

- **Cross-Platform**: Write once, deploy everywhere (iOS, Android, Web)
- **Modern Stack**: Expo, React Native, React Native Web
- **Type Safety**: Full TypeScript support
- **State Management**: Redux Toolkit + Zustand
- **Internationalization**: Multi-language support with i18next
- **Feature Flags**: Remote configuration for feature toggles
- **Analytics**: Configurable analytics integration
- **Authentication**: Secure auth with OAuth support
- **Theming**: Dark mode and custom themes
- **Responsive**: Mobile-first design with Tailwind CSS (NativeWind)

## 📦 Project Structure

```
zipybills/
├── apps/
│   ├── mobile/          # Expo app (iOS & Android)
│   └── web/             # Web app (Expo Web + Next.js)
├── features/
│   ├── build-shared/    # Build tools, linting, configs
│   ├── frontend-shared/ # UI components, theming, styles
│   ├── auth-feature/    # Authentication & authorization
│   ├── analytics-feature/ # Analytics integration
│   ├── i18n-feature/    # Internationalization
│   ├── feature-flags/   # Feature flag management
│   ├── state-feature/   # State management (Redux/Zustand)
│   └── utils-feature/   # Shared utilities
├── templates/
│   └── template-feature/ # Feature template generator
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Expo ~52.0.0
- **UI**: React Native + React Native Web
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router
- **State**: Redux Toolkit + Zustand
- **Server State**: TanStack Query
- **i18n**: i18next + react-i18next
- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Testing**: Vitest + React Native Testing Library

## 📋 Prerequisites

- Node.js 18+
- pnpm 10.23.0+
- Expo CLI
- iOS Simulator (Mac) or Android Studio

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Run mobile app
pnpm mobile

# Run web app
pnpm web
```

### Generate New Feature

```bash
pnpm generate-feature
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm combine-coverage
```

## 🔍 Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 📱 Platform-Specific Code

Use platform-specific extensions when needed:

- `*.native.tsx` - Mobile only (iOS & Android)
- `*.web.tsx` - Web only
- `*.tsx` - Shared across all platforms

Example:
```typescript
// storage.native.tsx
export const storage = AsyncStorage;

// storage.web.tsx
export const storage = localStorage;
```

## 🎨 Theming

The app supports custom themes and dark mode out of the box. Theme tokens are defined in `features/frontend-shared/ui-theme`.

## 🌍 Internationalization

Add translations in `features/i18n-feature/locales/`:
- `en.json` - English
- `es.json` - Spanish
- `fr.json` - French

## 🚦 Feature Flags

Feature flags are managed remotely and can be configured in `features/feature-flags`.

## 📊 Analytics

Analytics events are tracked across all platforms. Configure providers in `features/analytics-feature`.

## 🔐 Authentication

The auth feature supports:
- Email/Password
- OAuth (Google, Apple)
- Magic Links
- Multi-device sessions

## 🏗️ Building for Production

```bash
# Build all packages
pnpm build

# Build mobile apps
cd apps/mobile
pnpm build:ios
pnpm build:android

# Build web app
cd apps/web
pnpm build
```

## 📚 Documentation

- [Feature Development Guide](./docs/FEATURE_DEVELOPMENT.md)
- [Platform Strategy](./docs/PLATFORM_STRATEGY.md)
- [State Management](./docs/STATE_MANAGEMENT.md)
- [Styling Guide](./docs/STYLING_GUIDE.md)

## 🤝 Contributing

1. Create a new feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

UNLICENSED - Private project
