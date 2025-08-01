import { EmpackMiddleware } from "../../app/types/index";
import { Newable } from "inversify";
import { CookieSerializeOptions as CookieOptions } from "@fastify/cookie";

export type GuardMiddleware = EmpackMiddleware | "none";

export type ResponseWith = {
  cookies?: Cookie[];
  headers?: Record<string, string>;
};

export type Cookie = {
  key: string;
  value: string;
  options: CookieOptions;
};

export type RouteDefinition = {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  handlerName: string;
  middleware: EmpackMiddleware[];
};

export type ParamMetadata = {
  index: number;
  source: ParamSource;
  name?: string;
  fileNames?: string[];
  paramType?: Newable;
};

export type ParamSource =
  | "body"
  | "query"
  | "param"
  | "req"
  | "reply"
  | "file"
  | "files"
  | "multipart"
  | "cookie"
  | "header";

export type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | readonly any[]
  | readonly number[]
  | { valueOf(): ArrayBuffer }
  | { valueOf(): SharedArrayBuffer }
  | { valueOf(): Uint8Array }
  | { valueOf(): readonly number[] }
  | { valueOf(): string }
  | { [Symbol.toPrimitive](hint: string): string };

export type WebSocketContext = {
  send(data: BufferLike, cb?: (err?: Error) => void): void;
  send(
    data: BufferLike,
    options: {
      mask?: boolean | undefined;
      binary?: boolean | undefined;
      compress?: boolean | undefined;
      fin?: boolean | undefined;
    },
    cb?: (err?: Error) => void,
  ): void;
  close(code?: number, data?: string | Buffer): void;
};

export type SchemaMetadata = {
  description?: string;
  tags?: string[];
  summary?: string;
  params?: any;
  querystring?: any;
  body?: any;
  response?: Record<number, any>;
};
