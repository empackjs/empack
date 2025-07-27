import { injectable, injectFromBase } from "inversify";
import { EmpackMiddleware } from "../../app";

export const WSCONTROLLER_METADATA = {
  PATH: Symbol("empack:ws_controller_path"),
};

export const CONTROLLER_METADATA = {
  PATH: Symbol("empack:controller_path"),
  MIDDLEWARE: Symbol("empack:controller_middleware"),
};

export function Controller(
  path: string,
  ...middleware: EmpackMiddleware[]
): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(CONTROLLER_METADATA.PATH, path, target);
    Reflect.defineMetadata(CONTROLLER_METADATA.MIDDLEWARE, middleware, target);
    injectable()(target);
    const baseClass = Object.getPrototypeOf(target.prototype)?.constructor;
    if (baseClass && baseClass !== Object) {
      injectFromBase()(target);
    }
  };
}

export function WsController(path: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(WSCONTROLLER_METADATA.PATH, path, target);
    injectable()(target);
    const baseClass = Object.getPrototypeOf(target.prototype)?.constructor;
    if (baseClass && baseClass !== Object) {
      injectFromBase()(target);
    }
  };
}
