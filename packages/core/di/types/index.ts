import { Newable } from "inversify";

export type ContainerScope = "singleton" | "request" | "transient" | "constant";

export type ContainerModule = {
  scope: ContainerScope;
  type: symbol;
  constructor: Newable;
};

export type BindingScope = {
  addSingletonScope(type: symbol, constructor: Newable): void;
  addRequestScope(type: symbol, constructor: Newable): void;
  addTransientScope(type: symbol, constructor: Newable): void;
  addConstant(type: symbol, value: any): void;
};
