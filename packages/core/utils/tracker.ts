import { Timer } from "./timer";

export function Track(timer?: Timer): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): any => {
    const time = (label: string, fn: () => any) => {
      const t = timer ?? Timer.current();
      const id = t?.start(label) ?? -1;
      try {
        const result = fn();
        return result instanceof Promise
          ? result.finally(() => t?.end(id))
          : (t?.end(id), result);
      } catch (err) {
        t?.end(id);
        throw err;
      }
    };

    if (propertyKey && descriptor) {
      // Method decorator
      const original = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const isStatic = typeof target === "function";
        const className = isStatic
          ? target.name
          : (target.constructor?.name ?? "Function");
        const label = `${className}.${String(propertyKey)}`;
        return time(label, () => original.apply(this, args));
      };
      return descriptor;
    }

    // Class decorator
    for (const name of Object.getOwnPropertyNames(target.prototype)) {
      if (name === "constructor") continue;
      const original = target.prototype[name];
      if (typeof original === "function") {
        target.prototype[name] = function (...args: any[]) {
          const label = `${target.name}.${name}`;
          return time(label, () => original.apply(this, args));
        };
      }
    }
  };
}
