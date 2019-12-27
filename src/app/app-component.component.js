angular.module("myApp.app").component("appComponent", {
  bindings: {},
  controller: function(theService) {
    this.foo = "Foo.Bar";
    theService.doSomething();

    (async () => {
      const res = await Promise.resolve(1);
      console.log(res);
    })();
  },
  controllerAs: "vm",
  templateUrl: "app/app-component.component.html"
});