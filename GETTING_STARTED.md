# Getting Started with Zipybills Monorepo

This guide will help you set up and start developing in the Zipybills monorepo.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** 10.23.0 or higher
- **Git**
- **Xcode** (for iOS development, Mac only)
- **Android Studio** (for Android development)

## Installation

### 1. Install Dependencies

```bash
cd zipybills
pnpm install
```

This will install all dependencies across all packages in the monorepo.

### 2. Build Shared Packages

```bash
pnpm build
```

This builds all packages that other packages depend on.

## Development

### Run All Apps in Development Mode

```bash
pnpm dev
```

### Run Specific Apps

#### Mobile App (Expo)
```bash
# Start Expo dev server
pnpm mobile

# Or from mobile app directory
cd apps/mobile
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

#### Web App
```bash
# Start web dev server
pnpm web

# Or from web app directory
cd apps/web
pnpm dev
```

The web app will be available at `http://localhost:3000`

## Code Quality

### Linting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
cd features/your-feature
pnpm test:watch
```

### Type Checking

```bash
# Type check all packages
turbo run typecheck
```

## Creating New Features

Use the feature generator to scaffold new features:

```bash
pnpm generate-feature
```

Follow the prompts:
1. Enter feature name (e.g., `billing-feature`)
2. Select category (`frontend-shared`, `backend-shared`, or custom)

The generator will:
- Create a new feature directory with the template structure
- Set up package.json, tsconfig.json, and basic files
- Configure proper naming with `@zipybills/` scope

## Project Structure

```
zipybills/
├── apps/                    # Applications
│   ├── mobile/              # Expo mobile app
│   └── web/                 # Web app (React + RN Web)
├── features/                # Feature packages
│   ├── build-shared/        # Build tools
│   ├── frontend-shared/     # UI components & theming
│   ├── auth-feature/        # Authentication
│   ├── analytics-feature/   # Analytics
│   ├── i18n-feature/        # Internationalization
│   ├── feature-flags/       # Feature flags
│   ├── state-feature/       # State management
│   └── utils-feature/       # Utilities
├── templates/               # Feature templates
│   └── template-feature/    # Base template
├── package.json             # Root package config
├── pnpm-workspace.yaml      # pnpm workspace config
└── turbo.json              # Turborepo config
```

## Package Management

### Adding Dependencies

```bash
# Add to root
pnpm add -w <package>

# Add to specific package
pnpm add <package> --filter @zipybills/feature-name

# Add from catalog
# Edit pnpm-workspace.yaml catalog section first, then
pnpm add <package>@catalog: --filter @zipybills/feature-name
```

### Linking Local Packages

Local packages are automatically linked. Reference them in package.json:

```json
{
  "dependencies": {
    "@zipybills/ui-components": "workspace:*"
  }
}
```

## Common Tasks

### Adding a New Screen/Page

#### Mobile (Expo Router)
1. Create file in `apps/mobile/app/`
2. File-based routing automatically picks it up

```tsx
// apps/mobile/app/new-screen.tsx
export default function NewScreen() {
  return <View>...</View>;
}
```

#### Web
1. Create component in `apps/web/src/pages/`
2. Add route in `apps/web/src/App.tsx`

```tsx
// apps/web/src/pages/NewPage.tsx
export default function NewPage() {
  return <View>...</View>;
}

// Add to App.tsx
<Route path="/new" element={<NewPage />} />
```

### Adding Translation Keys

Edit locale files in `features/i18n-feature/src/locales/`:

```json
// en.json
{
  "your_key": "Your translation"
}
```

Use in components:
```tsx
const { t } = useTranslation();
<Text>{t('your_key')}</Text>
```

### Adding Feature Flags

```tsx
import { useFeatureEnabled } from '@zipybills/feature-flags';

function MyComponent() {
  const isNewFeatureEnabled = useFeatureEnabled('new_feature');
  
  if (isNewFeatureEnabled) {
    return <NewFeature />;
  }
  return <OldFeature />;
}
```

### Adding Analytics Events

```tsx
import { useAnalytics } from '@zipybills/analytics-feature';

function MyComponent() {
  const { track } = useAnalytics();
  
  const handleClick = () => {
    track({ name: 'button_clicked', properties: { button: 'submit' } });
  };
}
```

## Building for Production

### Mobile

```bash
cd apps/mobile

# Build for iOS
pnpm build:ios

# Build for Android
pnpm build:android
```

You'll need to configure EAS Build in `apps/mobile/eas.json`

### Web

```bash
cd apps/web
pnpm build

# Preview build
pnpm preview
```

Output will be in `apps/web/dist/`

## Troubleshooting

### Clear All Caches

```bash
# Clear Turborepo cache
rm -rf .turbo

# Clear pnpm cache
pnpm store prune

# Clear all node_modules
pnpm clean
pnpm install
```

### Metro Cache (Mobile)

```bash
cd apps/mobile
npx expo start --clear
```

### Type Errors

```bash
# Rebuild TypeScript projects
turbo run build --force
```

## CI/CD

The monorepo is configured to work with CI/CD pipelines:

```bash
# CI pipeline example
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

## Best Practices

1. **Keep features independent** - Features should not depend on app-specific code
2. **Use workspace dependencies** - Always use `workspace:*` for internal packages
3. **Write tests** - Every feature should have tests
4. **Document your code** - Add JSDoc comments for public APIs
5. **Follow naming conventions** - Use `@zipybills/` scope for all packages
6. **Platform-specific code** - Use `.native.tsx` and `.web.tsx` extensions
7. **Shared state** - Use Zustand for simple state, Redux for complex flows
8. **Type safety** - Enable strict TypeScript checks

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [Turborepo](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [NativeWind](https://www.nativewind.dev/)

## Support

For questions or issues, please refer to:
- Project documentation in `/docs`
- Feature-specific READMEs
- Team communication channels
