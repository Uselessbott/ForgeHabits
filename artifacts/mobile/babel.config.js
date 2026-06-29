module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      "@babel/plugin-proposal-private-methods",
      "@babel/plugin-proposal-class-properties",
    ],
  };
};
