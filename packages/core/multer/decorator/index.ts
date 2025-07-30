import { MulterConfig } from "../types";

export const MULTER_KEY = Symbol("empack:multer");

export function UseMultipart(config: MulterConfig): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(MULTER_KEY, config, target, propertyKey);
  };
}
