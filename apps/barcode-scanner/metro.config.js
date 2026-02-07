const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Exclude certain files from bundling
config.resolver.blockList = [
  /eslint\.config\.(js|mjs|cjs)$/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /vitest\.config\.(ts|js)$/,
  /jest\.config\.(ts|js)$/,
  /node-logger\.(ts|js)$/,
  /service-interface/,
  /barcode-machines-frontend/,
  /barcode-scanning-frontend/,
  /service-runtime/,
];

// Apply NativeWind FIRST, then fix resolution after
const nativeWindConfig = withNativeWind(config, {
  input: './global.css',
  configPath: './tailwind.config.js',
});

// Force single-instance resolution for critical packages AFTER withNativeWind
// This prevents "Invalid hook call" errors in pnpm monorepos where
// react-native-css-interop resolves a different copy of React
const sharedModules = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'react-native-css-interop',
  'nativewind',
  'react-native-safe-area-context',
  'expo-camera',
];

const sharedModulePaths = {};
for (const mod of sharedModules) {
  sharedModulePaths[mod] = path.resolve(monorepoRoot, 'node_modules', mod);
}

// Merge extraNodeModules (don't overwrite what withNativeWind may have set)
nativeWindConfig.resolver.extraNodeModules = {
  ...nativeWindConfig.resolver.extraNodeModules,
  ...sharedModulePaths,
};

// Pre-resolve shared modules to absolute paths at config time.
// This is critical in pnpm hoisted monorepos where nested node_modules/react
// copies can exist inside react-native-css-interop, react-native-reanimated, etc.
// Using require.resolve with explicit paths guarantees we always get the root copy.
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
  // For exact shared module imports (e.g. 'react'), return the pre-resolved path directly
  if (resolvedSharedModules[moduleName]) {
    return { type: 'sourceFile', filePath: resolvedSharedModules[moduleName] };
  }

  // For sub-path imports (e.g. 'react/jsx-runtime', 'react-native/Libraries/...')
  for (const mod of sharedModules) {
    if (moduleName.startsWith(mod + '/')) {
      try {
        const resolved = require.resolve(moduleName, { paths: [rootNodeModules] });
        return { type: 'sourceFile', filePath: resolved };
      } catch {
        // Fall through to default resolver if sub-path doesn't resolve
        break;
      }
    }
  }

  // Use withNativeWind's resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
