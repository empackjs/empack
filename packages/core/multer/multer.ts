import { SchemaOptions, Type } from "@sinclair/typebox";

export const FilePart = (options?: SchemaOptions) =>
  Type.Any({
    ...options,
    isFile: true,
  });
