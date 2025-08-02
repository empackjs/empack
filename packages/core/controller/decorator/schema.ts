import { SchemaMetadata } from "../types";

export const SCHEMA_KEY = Symbol("empack:schema_key");

export function Schema(schema: SchemaMetadata): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(SCHEMA_KEY, schema, target, propertyKey);
  };
}
