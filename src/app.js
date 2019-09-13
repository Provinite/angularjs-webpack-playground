require("@babel/polyfill");
require("angular");

const requireAll = r => r.keys().forEach(k => {
  if (k.endsWith("app.js")) return;
  r(k);
});
// requireAll(require.context(".", true, /\.module.js/));
// requireAll(require.context(".", true, /^(.(?!.*\.module\.js$))*\.js$/));
requireAll(require.context(".", true, /\.js/));
angular.module("myApp", ["myApp.app", "myApp.service"]);
angular.bootstrap(document.getElementById("app"), ["myApp"]);
