const webpack = require("webpack");
/**
 * Webpack dependency. Used to depend on a module that provides an angularjs
 * module via `window.angular.module("someModule", [...deps])`
 */
class NgDependency extends webpack.Dependency {
  /**
   * Create a new NgDependency targetting a webpack module for an angularjs
   * module.
   * @param {any} theModule - The webpack module
   * @param {string} ngModule  - The name of the angularjs module
   */
  constructor(theModule, ngModule) {
    super();
    /** @member {string} - The request path for the module */
    this.request = theModule.request;
    /** @member {any} - The webpack module to import */
    this.module = theModule;
    /**
     * @member {string} - The name of the angularjs module that is provided by
     *  this dependency. Used for logging/debugging.
     */
    this.ngModule = ngModule;
  }
}

/**
 * Webpack dependency template produces a module import/require for
 * `NgDependency` dependencies. Prepends the import at the beginning of the file.
 */
NgDependency.Template = class NgDependencyTemplate {
  /**
   *
   * @param {NgDependency} dep - The dependency to apply
   * @param {import("webpack-source").Source} source - The source to apply the
   *  dependency to
   * @param {TODO} runtime - Webpack runtime // TODO: determine type
   */
  apply(dep, source, runtime) {
    source.insert(
      0,
      // generates something like `__webpack_require__(. . .)`
      runtime.moduleExports({
        request: dep.request,
        module: dep.module
      }) + ";"
    );
  }
};

module.exports = { NgDependency };