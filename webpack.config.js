var path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackAngularFileSort } = require("./webpack/WebpackAngularFileSort");
module.exports = {
  entry: "./src/app.js",
  context: path.resolve(__dirname),
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    new WebpackAngularFileSort()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.(html)$/,
        use: {
          loader: "html-loader",
          options: {
            attrs: [":data-src"]
          }
        }
      }
    ]
  }
};
