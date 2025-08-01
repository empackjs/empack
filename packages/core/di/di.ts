import { BindingScope, ContainerModule as Module } from "./types";

export abstract class ContainerModule {
  #binder: Module[] = [];

  abstract register(bind: BindingScope): void;

  getBindings(): Module[] {
    return this.#binder;
  }

  #createBinder(): BindingScope {
    return {
      addSingleton: (type, ctor) =>
        this.#binder.push({ scope: "singleton", type, constructor: ctor }),
      addConstant: (type, value) =>
        this.#binder.push({ scope: "constant", type, constructor: value }),
    };
  }

  loadModule() {
    this.register(this.#createBinder());
  }
}
