require("@babel/polyfill");
require("angular");
require("./patchAngular")(angular);
require("./_base/main.scss");

const requireAll = r => r.keys().forEach(k => {
  if (k.endsWith("app.js")) return;
  r(k);
});
// requireAll(require.context(".", true, /\.module.js/));
// requireAll(require.context(".", true, /^(.(?!.*\.module\.js$))*\.js$/));
requireAll(require.context(".", true, /\.(js)/));
var myApp = angular.module("myApp", ["myApp.app", "myApp.service"]);
const template = require("./app/app-component.component.html");
myApp.run(function ($templateCache) {
  console.log(template);
  $templateCache.put("app/app-component.component.html", template);
});
angular.bootstrap(document.getElementById("app"), ["myApp"]);
