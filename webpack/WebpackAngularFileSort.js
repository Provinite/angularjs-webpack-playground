const webpack = require("webpack");
const { NgDependencyMap } = require("./NgDependencyMap");
const { NgDependency } = require("./NgDependency");

const PLUGIN_NAME = "AngularFileSort";

/**
 * Webpack plugin that makes implicit angularjs dependencies explicit as module
 * require/imports.
 *
 * Prevents issues with attempting to populate modules with injectables before
 * they are defined.
 */
class WebpackAngularFileSort {

  constructor() {
    this.handleCompilationCreated = this.handleCompilationCreated.bind(this);
    this.handleFinishModules = this.handleFinishModules.bind(this);
  }

  generateDependencyMap(modules) {
    return new NgDependencyMap(modules);
  }

  /**
   * Apply this plugin to the compiler.
   * @param {webpack.Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, this.handleCompilationCreated);
  }

  handleCompilationCreated(compilation) {
    this.compilation = compilation;
    // register new dependency template
    compilation.dependencyTemplates.set(
      NgDependency,
      new NgDependency.Template()
    );
    // register finishModules hook
    compilation.hooks.finishModules.tap(
      PLUGIN_NAME,
      this.handleFinishModules
    );
  }

  handleFinishModules(modules) {
    const { compilation } = this;
    const logger = compilation.getLogger(PLUGIN_NAME);

    // prep dependency map for lookups
    const dependencyMap = this.generateDependencyMap(modules);

    for (let i = 0; i < modules.length; i++) {
      const dependantModule = modules[i];
      const dependantId = dependantModule.identifier();
      const deps = dependencyMap.getNgWebpackDependencies(dependantId);
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
