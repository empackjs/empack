import { IEmpackMiddleware } from "../interfaces";
import type { WebSocket } from "ws";
import { Newable } from "inversify";
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from "fastify";

export type EmpackMiddlewareFunction = (
  req: FastifyRequest,
  reply: FastifyReply,
) => void | Promise<void>;

export type EmpackMiddleware =
  | EmpackMiddlewareFunction
  | Newable<IEmpackMiddleware>;

export type AppOptions = FastifyServerOptions & { routePrefix?: string };

export type WsOptions = {
  wsPrefix: string;
  errorHandler?: (
    this: FastifyInstance,
    error: Error,
    socket: WebSocket,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void;
};
