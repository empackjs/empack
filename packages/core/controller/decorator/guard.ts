import { GuardMiddleware } from "../types";

export const GUARD_KEY = Symbol("empack:guard");

export function Guard(
  guard: GuardMiddleware,
): ClassDecorator & MethodDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    const hasExisting =
      propertyKey !== undefined
        ? Reflect.hasMetadata(GUARD_KEY, target, propertyKey)
        : Reflect.hasMetadata(GUARD_KEY, target);

    if (hasExisting) {
      const targetLabel =
        propertyKey !== undefined
          ? `${target.constructor.name}.${String(propertyKey)}`
          : `${(target as any).name ?? "AnonymousClass"}`;
      throw new Error(
        `Duplicate @Guard() detected on ${targetLabel}. Each method or class can only have one guard.`,
      );
    }

    if (propertyKey) {
      Reflect.defineMetadata(GUARD_KEY, guard, target, propertyKey);
    } else {
      Reflect.defineMetadata(GUARD_KEY, guard, target);
    }
  };
}
