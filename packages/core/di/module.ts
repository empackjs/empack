import { BindingScope, ContainerModule } from "./types";

export abstract class Module {
  #binder: ContainerModule[] = [];

  abstract register(bind: BindingScope): void;

  getBindings(): ContainerModule[] {
    return this.#binder;
  }

  #createBinder(): BindingScope {
    return {
      addSingletonScope: (type, ctor) =>
        this.#binder.push({ scope: "singleton", type, constructor: ctor }),
      addRequestScope: (type, ctor) =>
        this.#binder.push({ scope: "request", type, constructor: ctor }),
      addTransientScope: (type, ctor) =>
        this.#binder.push({ scope: "transient", type, constructor: ctor }),
      addConstant: (type, value) =>
        this.#binder.push({ scope: "constant", type, constructor: value }),
    };
  }

  loadModule() {
    this.register(this.#createBinder());
  }
}
