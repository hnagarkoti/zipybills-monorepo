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

// Exclude non-factoryOS service runtimes and interfaces from bundling
config.resolver.blockList = [
  /eslint\.config\.(js|mjs|cjs)$/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /vitest\.config\.(ts|js)$/,
  /jest\.config\.(ts|js)$/,
  /node-logger\.(ts|js)$/,
  /service-interface/,
  /service-runtime/,
  // Exclude barcode-feature frontends to avoid conflicts
  /barcode-feature/,
];

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
];

const sharedModulePaths = {};
for (const mod of sharedModules) {
  sharedModulePaths[mod] = path.resolve(monorepoRoot, 'node_modules', mod);
}

nativeWindConfig.resolver.extraNodeModules = {
  ...nativeWindConfig.resolver.extraNodeModules,
  ...sharedModulePaths,
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
  // For exact shared module imports, return the pre-resolved path directly
  if (resolvedSharedModules[moduleName]) {
    return { type: 'sourceFile', filePath: resolvedSharedModules[moduleName] };
  }

  // For sub-path imports (e.g. 'react/jsx-runtime')
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

  // Use withNativeWind's resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
