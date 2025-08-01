import { MulterOptions } from "../types";

export const MULTER_KEY = Symbol("empack:multer");

export function UseMultipart(config?: MulterOptions): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      MULTER_KEY,
      { ...config, flag: true },
      target,
      propertyKey,
    );
  };
}
