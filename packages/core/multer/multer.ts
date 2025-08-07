import { SchemaOptions, Type } from "@sinclair/typebox";

export const FileType = (options?: SchemaOptions) =>
  Type.Any({
    ...options,
    isFile: true,
  });
