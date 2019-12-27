require("@babel/polyfill");
require("angular");
require("./patchAngular")(angular);

// scss entry point
require("./_base/main.scss");

const requireAll = r => r.keys().forEach(k => {
  if (k.endsWith("app.js")) return;
  r(k);
});


requireAll(require.context(".", true, /\.(js)/));
var myApp = angular.module("myApp", ["myApp.app", "myApp.service"]);

// prepare html templates
const cacheEntries = [];
const templateHtmlContext = require.context(".", true, /\.html/);
templateHtmlContext.keys().forEach(fileName => {
  cacheEntries.push({
    url: fileName.replace(/^\.\//, ""),
    template: templateHtmlContext(fileName)
  });
});
myApp.run(($templateCache) => {
  for (const {url, template} of cacheEntries) {
    $templateCache.put(url, template);
  }
});

angular.bootstrap(document.getElementById("app"), ["myApp"]);
