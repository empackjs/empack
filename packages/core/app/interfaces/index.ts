import { NextFunction, Request, Response } from "express";
import {
  EmpackExceptionMiddlewareFunction,
  EmpackMiddlewareFunction,
} from "../types";

export interface ILogger {
  error(message: Error): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}

export interface IEnv {
  get(key: string): string;
  getOptional(key: string): string | undefined;
}

export interface IEmpackMiddleware {
  use(): EmpackMiddlewareFunction | Promise<EmpackMiddlewareFunction>;
}

export interface IEmpackExceptionMiddleware {
  use(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ):
    | EmpackExceptionMiddlewareFunction
    | Promise<EmpackExceptionMiddlewareFunction>;
}
