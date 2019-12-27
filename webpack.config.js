var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const globImporter = require("node-sass-glob-importer");

// Build features:
// - Source Maps
// - Dev Server
// - Load all JS (app.js + require.context)
// - Ignore order for angularjs purposes (patchAngular.js)
// - Sass parsing (including globs)
// - AngularJS template handling!
// - TODO: Env var access
// - ngAnnotate

module.exports = {
  entry: "./src/app.js",
  context: path.resolve(__dirname),
  mode: "development",
  devtool: "inline-source-map",
  devServer: {},
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          { loader: "ng-annotate-loader" },
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"]
            }
          }
        ]
      },
      {
        test: /\.(html)$/,
        use: {
          loader: "html-loader",
          options: {
            attrs: [":data-src"]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // creates <style> nodes
          "style-loader",

          // processes css into commonJS modules
          "css-loader",

          // sass preprocessor
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                // the sasss glob importer is used because doing a glob `@import` more closely mimics
                // the existing web-client build process. This is required for our global SCSS vars
                // to be available in dependent parsing contexts. If our scss files are updated to use
                // proper `@import`s, and we don't need to do one massive SCSS run, we can probably
                // get rid fo this.
                importer: globImporter()
              }
            }
          }
        ]
      }
    ]
  }
};
