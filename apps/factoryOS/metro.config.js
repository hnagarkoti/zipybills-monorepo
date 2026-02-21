const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo (merge with Expo defaults)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Exclude non-factoryOS service runtimes from bundling
// NOTE: service-interface IS allowed (contains typed SDK API clients for frontend)
config.resolver.blockList = [
  /eslint\.config\.(js|mjs|cjs)$/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /vitest\.config\.(ts|js)$/,
  /jest\.config\.(ts|js)$/,
  /node-logger\.(ts|js)$/,
  /service-runtime/,
  // Exclude barcode-feature frontends to avoid conflicts
  /barcode-feature/,
];

// ─── pnpm workspace package resolution ────────
// pnpm symlinks workspace packages inside each consumer's node_modules,
// but Metro doesn't always follow pnpm symlinks reliably.
// Map every workspace package consumed by the frontend so Metro can
// resolve them by absolute path.
const workspacePackages = {
  // Service-interface SDK packages (frontend API clients)
  '@zipybills/factory-auth-service-interface':      path.resolve(monorepoRoot, 'features/auth/auth-service/service-interface'),
  '@zipybills/factory-machines-service-interface':   path.resolve(monorepoRoot, 'features/machines/machines-service/service-interface'),
  '@zipybills/factory-shifts-service-interface':     path.resolve(monorepoRoot, 'features/shifts/shifts-service/service-interface'),
  '@zipybills/factory-planning-service-interface':   path.resolve(monorepoRoot, 'features/planning/planning-service/service-interface'),
  '@zipybills/factory-downtime-service-interface':   path.resolve(monorepoRoot, 'features/downtime/downtime-service/service-interface'),
  '@zipybills/factory-dashboard-service-interface':  path.resolve(monorepoRoot, 'features/dashboard/dashboard-service/service-interface'),
  '@zipybills/factory-reports-service-interface':    path.resolve(monorepoRoot, 'features/reports/reports-service/service-interface'),
  // Shared packages
  '@zipybills/factory-feature-registry':             path.resolve(monorepoRoot, 'features/shared/feature-registry'),
  '@zipybills/factory-api-client':                   path.resolve(monorepoRoot, 'features/shared/api-client'),
  '@zipybills/factory-home-frontend':                path.resolve(monorepoRoot, 'features/home/home-frontend'),
  '@zipybills/factory-auth-frontend':                path.resolve(monorepoRoot, 'features/auth/auth-frontend'),
  '@zipybills/factory-machines-frontend':            path.resolve(monorepoRoot, 'features/machines/machines-frontend'),
  '@zipybills/factory-shifts-frontend':              path.resolve(monorepoRoot, 'features/shifts/shifts-frontend'),
  '@zipybills/factory-planning-frontend':            path.resolve(monorepoRoot, 'features/planning/planning-frontend'),
  '@zipybills/factory-downtime-frontend':            path.resolve(monorepoRoot, 'features/downtime/downtime-frontend'),
  '@zipybills/factory-dashboard-frontend':           path.resolve(monorepoRoot, 'features/dashboard/dashboard-frontend'),
  '@zipybills/factory-reports-frontend':             path.resolve(monorepoRoot, 'features/reports/reports-frontend'),
  '@zipybills/ui-components':                        path.resolve(monorepoRoot, 'features/frontend-shared/ui-components'),
  '@zipybills/ui-theme':                             path.resolve(monorepoRoot, 'features/frontend-shared/ui-theme'),
  '@zipybills/ui-store':                             path.resolve(monorepoRoot, 'features/frontend-shared/ui-store'),
  '@zipybills/ui-query':                             path.resolve(monorepoRoot, 'features/frontend-shared/ui-query'),
};

// Apply NativeWind
const nativeWindConfig = withNativeWind(config, {
  input: './global.css',
  configPath: './tailwind.config.js',
});

// Force single-instance resolution for critical packages
const sharedModules = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'react-native-css-interop',
  'nativewind',
  'react-native-safe-area-context',
  'zustand',
];

const sharedModulePaths = {};
for (const mod of sharedModules) {
  sharedModulePaths[mod] = path.resolve(monorepoRoot, 'node_modules', mod);
}

nativeWindConfig.resolver.extraNodeModules = {
  ...nativeWindConfig.resolver.extraNodeModules,
  ...sharedModulePaths,
  ...workspacePackages,
};

// Pre-resolve shared modules to absolute paths
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');
const resolvedSharedModules = {};
for (const mod of sharedModules) {
  try {
    resolvedSharedModules[mod] = require.resolve(mod, { paths: [rootNodeModules] });
  } catch {
    // Module may not be installed — skip
  }
}

const originalResolveRequest = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // ── 1. Shared module resolution (single-instance) ──
  if (resolvedSharedModules[moduleName]) {
    return { type: 'sourceFile', filePath: resolvedSharedModules[moduleName] };
  }
  for (const mod of sharedModules) {
    if (moduleName.startsWith(mod + '/')) {
      try {
        const resolved = require.resolve(moduleName, { paths: [rootNodeModules] });
        return { type: 'sourceFile', filePath: resolved };
      } catch {
        break;
      }
    }
  }

  // ── 2. @zipybills workspace package resolution ──
  if (moduleName.startsWith('@zipybills/')) {
    // Exact match — e.g. '@zipybills/factory-machines-service-interface'
    if (workspacePackages[moduleName]) {
      const pkgDir = workspacePackages[moduleName];
      try {
        const pkgJson = require(path.join(pkgDir, 'package.json'));
        const entry = (pkgJson.exports && pkgJson.exports['.']) || pkgJson.main || 'src/index.ts';
        const entryFile = path.resolve(pkgDir, entry);
        return { type: 'sourceFile', filePath: entryFile };
      } catch {
        return { type: 'sourceFile', filePath: path.resolve(pkgDir, 'src/index.ts') };
      }
    }

    // Subpath match — e.g. '@zipybills/factory-feature-registry/react'
    // Find the longest matching package prefix
    for (const [pkg, pkgDir] of Object.entries(workspacePackages)) {
      if (moduleName.startsWith(pkg + '/')) {
        const subpath = './' + moduleName.slice(pkg.length + 1);
        try {
          const pkgJson = require(path.join(pkgDir, 'package.json'));
          if (pkgJson.exports && pkgJson.exports[subpath]) {
            const entry = pkgJson.exports[subpath];
            return { type: 'sourceFile', filePath: path.resolve(pkgDir, entry) };
          }
        } catch { /* fall through */ }
        // Convention fallback: src/{subpath}.ts(x)
        const sub = moduleName.slice(pkg.length + 1);
        const candidates = [
          path.resolve(pkgDir, 'src', sub + '.tsx'),
          path.resolve(pkgDir, 'src', sub + '.ts'),
          path.resolve(pkgDir, 'src', sub, 'index.tsx'),
          path.resolve(pkgDir, 'src', sub, 'index.ts'),
        ];
        const fs = require('fs');
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            return { type: 'sourceFile', filePath: c };
          }
        }
      }
    }
  }

  // ── 3. Default / NativeWind resolver ──
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
