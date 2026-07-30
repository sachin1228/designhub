const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Expo Router needs this to locate the app directory in a monorepo/workspace.
// Set it after getDefaultConfig so it isn't overwritten by Expo's own detection.
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = "app";
}

// Watch all files in the monorepo so shared packages resolve correctly.
config.watchFolders = [monorepoRoot];

// Resolve packages from both the app's own node_modules and the root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
