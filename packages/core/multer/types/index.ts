import { DiskStorageOptions, FileFilterCallback } from "multer";
import { Request } from "express";

export type MulterFile = Express.Multer.File;

export type MulterOptions = {
  storage?: DiskStorageOptions | "memory";
  limits?:
    | {
        fieldNameSize?: number | undefined;
        fieldSize?: number | undefined;
        fields?: number | undefined;
        fileSize?: number | undefined;
        files?: number | undefined;
        parts?: number | undefined;
        headerPairs?: number | undefined;
      }
    | undefined;
  preservePath?: boolean | undefined;
  fileFilter?(
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ): void;
};

export type MultiField = {
  name: string;
  maxCount?: number;
}[];

export type MulterConfig =
  | {
      type: "none";
      options?: MulterOptions;
    }
  | {
      type: "single";
      name: string;
      options?: MulterOptions;
    }
  | {
      type: "array";
      name: string;
      maxCount?: number;
      options?: MulterOptions;
    }
  | {
      type: "fields";
      fields: MultiField;
      options?: MulterOptions;
    };
