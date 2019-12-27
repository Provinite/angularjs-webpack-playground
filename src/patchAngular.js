module.exports = function (angular) {
  const angularModule = angular.module.bind(angular);
  const lazyModules = {};
  const declaredModules = {};
  angular.module = function (...args) {
    const [moduleName, dependencies] = args;
    if (dependencies) {
      // register the new module
      const result = angularModule(...args);

      // tag it as declared
      declaredModules[moduleName] = true;
      // process any existing lazy module for this angular module
      if (lazyModules[moduleName]) {
        const lazyModule = lazyModules[moduleName];
        const theNgModule = angularModule(moduleName);
        lazyModule.flushQueue(theNgModule);
        // remove it from the queue
        delete lazyModules[moduleName];
      }
      return result;
    } else {
      if (declaredModules[moduleName]) {
        // module is already declared, forward this call immediately
        return angularModule(...args);
      } else {
        // ensure we have a lazy module representing the desired angularjs module
        if (!lazyModules[moduleName]) {
          lazyModules[moduleName] = new AngularLazyModule(moduleName);
        }
        // return the lazy module to collect registrations over time
        return lazyModules[moduleName];  
      }
    }
  }
}

class AngularLazyModule {
  constructor(moduleId) {
    this.id = moduleId;
    this._queue = [];
    // each of these methods will be added as a chaining method
    const methodNames = [
      "provider",
      "factory",
      "service",
      "value",
      "constant",
      "decorator",
      "animation",
      "filter",
      "controller",
      "directive",
      "component",
      "config",
      "run"
    ];
    for (const methodName of methodNames) {
      this[methodName] = (...args) => this.enqueueCall(methodName, args);
    }
  }

  /**
   * Enqueue a module method call for later execution.
   * @param {string} methodName - The name of the method to execute on the module
   * @param {any[]} args - The arguments for execution
   * @return { this }
   */
  enqueueCall(methodName, args) {
    this._queue.push({ methodName, args });
    return this;
  }

  /**
   * Flush all enqueued registrations on this module. Applies them to the specified real angularjs module.
   * @param {angular.IModule} angularModule 
   */
  flushQueue(angularModule) {
    while (this._queue.length) {
      const call = this._queue.pop();
      angularModule[call.methodName](...call.args);
      console.log(`Deferred execution of angular.module("${this.id}").${call.methodName}("${call.args[0]}")`);
    }
    this._queue = [];
  }
}