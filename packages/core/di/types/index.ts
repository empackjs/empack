import { Newable } from "inversify";

export type ContainerScope = "singleton" | "request" | "transient" | "constant";

export type ContainerModule = {
  scope: ContainerScope;
  type: symbol;
  constructor: Newable;
};

export type BindingScope = {
  addSingleton(token: symbol, constructor: Newable): void;
  addConstant(token: symbol, value: any): void;
};
