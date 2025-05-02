const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Use MD5 for hashing (Webpack 4 compatible)
      webpackConfig.output.hashFunction = "md5";
      // Add Buffer polyfill
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        buffer: require.resolve("buffer/"),
      };
      // Add plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.LoaderOptionsPlugin({
          options: {
            ignoreWarnings: [/Failed to parse source map/],
          },
        })
      );
      // Update devServer
      webpackConfig.devServer = {
        ...webpackConfig.devServer,
        onBeforeSetupMiddleware: undefined,
        onAfterSetupMiddleware: undefined,
        setupMiddlewares: (middlewares, devServer) => {
          return middlewares;
        },
      };
      webpackConfig.devtool = false;
      return webpackConfig;
    },
  },
};