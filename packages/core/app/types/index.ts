import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import { IEmpackExceptionMiddleware, IEmpackMiddleware } from "../interfaces";
import { Newable } from "inversify";

export type HandlerResult = {
  statusCode?: number;
  body?: any;
};

export type EmpackMiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type EmpackExceptionMiddlewareFunction = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type ExceptionHandler = (
  err: Error,
  req: Request,
) => HandlerResult | void;

export type NotFoundHandler = (req: Request) => HandlerResult | void;

export type WsAuthResult = true | { code: number; reason: string | Buffer };

export type EmpackMiddleware =
  | RequestHandler
  | EmpackMiddlewareFunction
  | Newable<IEmpackMiddleware>;

export type EmpackExceptionMiddleware =
  | ErrorRequestHandler
  | EmpackExceptionMiddlewareFunction
  | Newable<IEmpackExceptionMiddleware>;

export type OpenApiOptions = {
  title?: string;
  version?: string;
  path?: string;
  sortBy?: "method" | "route";
  servers?: {
    description?: string;
    url: string;
  }[];
};
