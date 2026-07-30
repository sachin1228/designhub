const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Required for expo-router in a monorepo/workspace setup.
// Without this, Metro can't resolve EXPO_ROUTER_APP_ROOT and bundling fails
// with "First argument of `require.context` should be a string".
process.env.EXPO_ROUTER_APP_ROOT = "app";

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo so shared packages resolve correctly.
config.watchFolders = [monorepoRoot];

// Resolve packages from both the app's own node_modules and the root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
