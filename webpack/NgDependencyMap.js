class ngDependencyMap {
  /**
   * Create a map of all ng dependencies amongst the provided webpack modules
   * @param {import("webpack").Module[]} modules
   */
  constructor(modules) {
    /** 
     * @private
     * @member
     * Object mapping webpack module id's to an object with
     *  `webpackModule` - The webpack module itself
     *  `requires` - An array of required angularjs module id's
     */
    this.dependencyMap = {};
    /**
     * @private
     * @member {[moduleId: string]: string}
     * Object mapping angularjs module ids to webpack module ids
     */
    this.providerMap = {};

    for (let i = 0; i < modules.length; i++) {
      const theModule = modules[i];
      const deps = this._getNgDeps(theModule);
      const moduleId = theModule.identifier();
      // populate the dependency and provider maps with newfound module
      this.dependencyMap[moduleId] = {
        webpackModule: theModule,
        requires: deps.dependencies
      };
      for (const providedModule in deps.modules) {
        this.providerMap[providedModule] = moduleId;
      }
    }
  }

  /**
   * @private
   * @param {*} theModule 
   */
  _getNgDeps(theModule) {
    try {
      source = theModule.originalSource().source();
    } catch (e) {
      source = "";
    }
    // get angularjs dependencies & defined modules
    return ngDeps(source);
  }

  /**
   * Get the module (if known) that provides a particular angularjs module.
   * @param {string} ngModule - The name of the angularjs module
   * @return {object | null} The providing webpack module, or null if not found.
   */
  getProviderModule(ngModule) {
    const providerModuleId = this.providerMap[ngModule];
    if (!providerModuleId) {
      return null;
    }
    if (!this.dependencyMap[providerModuleId]) {
      return null;
    }
    return this.dependencyMap[providerModuleId].webpackModule;
  }

  /**
   * Get an array of angularjs module id's that a webpack module depends on
   * @param {string} webpackModuleId - The id of the webpack module to fetch
   *  dependencies for.
   * @return {string[]} An array of angularjs module id's that the specified
   *  webpack module depends upon.
   */
  getNgModuleDependencies(webpackModuleId) {
    if (!this.dependencyMap[webpackModuleId]) {
      return [];
    }
    return this.dependencyMap[webpackModuleId].requires;
  }

  /**
   * Get an array of `NgDependency` webpack dependencies for a given module.
   * @param {string} webpackModuleId - The id of the webpack module to create
   *  dependencies for.
   */
  getNgWebpackDependencies(webpackModuleId) {
    return this.getNgModuleDependencies(webpackModuleId)
      .map(ngModuleName => {
        const providerModule = getProviderModule(ngModuleName);
        if (providerModule) {
          return new NgDependency(providerModule, ngModuleName);
        } else {
          return null;
        }
      })
      .filter(truthy => truthy);
  }
}
