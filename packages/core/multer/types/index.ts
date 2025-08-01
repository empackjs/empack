import { Readable } from "stream";

export type MulterOptions = {
  limits?: {
    fileSize?: number;
    files?: number;
  };
};

export type MulterFile = {
  filename: string;
  mimetype: string;
  file: Readable;
  toBuffer: () => Promise<Buffer>;
};
