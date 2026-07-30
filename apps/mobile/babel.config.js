module.exports = function (api) {
  api.cache(true);

  // Inline EXPO_ROUTER_APP_ROOT as a literal string at Babel transform time.
  // This is required for expo-router's require.context() call in a monorepo/
  // workspace setup where Metro worker processes may not inherit the env var
  // set by metro.config.js or .env.
  const appRoot = process.env.EXPO_ROUTER_APP_ROOT || "app";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Replace process.env.EXPO_ROUTER_APP_ROOT with the literal string value
      // so Metro's require.context() receives a compile-time constant.
      function inlineExpoRouterAppRoot() {
        return {
          visitor: {
            MemberExpression(path) {
              if (
                path.node.object?.type === "MemberExpression" &&
                path.node.object.object?.name === "process" &&
                path.node.object.property?.name === "env" &&
                path.node.property?.name === "EXPO_ROUTER_APP_ROOT"
              ) {
                path.replaceWith({
                  type: "StringLiteral",
                  value: appRoot,
                });
              }
            },
          },
        };
      },
    ],
  };
};
