import { IEmpackMiddleware } from "../interfaces";
import { Newable } from "inversify";
import { FastifyReply, FastifyRequest } from "fastify";

export type HandlerResult = {
  statusCode?: number;
  body?: any;
};

export type EmpackMiddlewareFunction = (
  req: FastifyRequest,
  reply: FastifyReply,
) => void | Promise<void>;

export type WsAuthResult = true | { code: number; reason: string | Buffer };

export type EmpackMiddleware =
  | EmpackMiddlewareFunction
  | Newable<IEmpackMiddleware>;

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
