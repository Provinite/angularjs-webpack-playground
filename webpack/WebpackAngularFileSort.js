const webpack = require("webpack");
const ngDeps = require("ng-dependencies");

const PLUGIN_NAME = "AngularFileSort";

/**
 * Webpack plugin that makes implicit angularjs dependencies explicit as module
 * require/imports.
 *
 * Prevents issues with attempting to populate modules with injectables before
 * they are defined.
 */
class WebpackAngularFileSort {

  generateDependencyMap(modules) {
    const ngDependencyMap = {};
    const providers = {};
    for (let i = 0; i < modules.length; i++) {
      const theModule = modules[i];
      let source;
      try {
        source = theModule.originalSource().source();
      } catch (e) {
        source = "";
      }
      // get angularjs dependencies & defined modules
      const deps = ngDeps(source);
      const moduleId = theModule.identifier();
      // populate the dependency and provider maps with newfound module
      ngDependencyMap[moduleId] = {
        webpackModule: theModule,
        requires: deps.dependencies
      };
      for (const providedModule in deps.modules) {
        providers[providedModule] = moduleId;
      }
    }
    /**
     * Get the module (if known) that provides a particular angularjs module.
     * @param {string} ngModule - The name of the angularjs module
     * @return {object | null} The providing webpack module, or null if not found.
     */
    const getProviderModule = ngModule => {
      const providerModuleId = providers[ngModule];
      if (!providerModuleId) {
        return null;
      }
      if (!ngDependencyMap[providerModuleId]) {
        return null;
      }
      return ngDependencyMap[providerModuleId].webpackModule;
    };

    /**
     * Get an array of angularjs module id's that a webpack module depends on
     * @param {string} webpackModuleId
     */
    const getNgModuleDependencies = webpackModuleId => {
      if (!ngDependencyMap[webpackModuleId]) {
        return [];
      }
      return ngDependencyMap[webpackModuleId].requires;
    };

    /**
     * Get an array of `NgDependency` webpack dependencies for a given module.
     */
    const getNgDependencies = webpackModuleId =>
      getNgModuleDependencies(webpackModuleId)
        .map(ngModuleName => {
          const providerModule = getProviderModule(ngModuleName);
          if (providerModule) {
            return new NgDependency(providerModule, ngModuleName);
          } else {
            return null;
          }
        })
        .filter(truthy => truthy);

    return { getNgDependencies };
  }

  /**
   * Apply this plugin to the compiler.
   * @param {webpack.Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      this.handleCompilationCreated(compilation);
      compilation.hooks.finishModules.tap(
        pluginName,
        this.handleFinishModules.bind(this)
      );
    });
  }

  handleCompilationCreated(compilation) {
    this.compilation = compilation;
    // register new dependency template
    compilation.dependencyTemplates.set(
      NgDependency,
      new NgDependency.Template()
    );
  }

  handleFinishModules(modules) {
    const { compilation } = this;
    const logger = compilation.getLogger("AngularFileSort");

    // prep dependency map for lookups
    const { getNgDependencies } = this.generateDependencyMap(modules);

    for (let i = 0; i < modules.length; i++) {
      const dependantModule = modules[i];
      const dependantId = dependantModule.identifier();
      const deps = getNgDependencies(dependantId);
      deps.map(dependency => {
        const providerId = dependency.module.resource;
        const ngModule = dependency.ngModule;

        logger.info(
          `${dependantModule.resource} depends on ${providerId} for angular.module("${ngModule}")`
        );
        // actually add the dependency as a commonJS require
        dependantModule.addDependency(dependency);
      });
    }
  }
}

module.exports = { WebpackAngularFileSort };

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
