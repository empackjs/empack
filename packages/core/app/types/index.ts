import { IEmpackMiddleware } from "../interfaces";
import type { WebSocket } from "ws";
import { Newable } from "inversify";
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from "fastify";
import { EmpackResponses } from "../../controller";

export type EmpackMiddlewareFunction = (
  req: FastifyRequest,
) => void | Promise<void> | EmpackResponses | Promise<EmpackResponses>;

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

export type EventHook =
  | "onRequest"
  | "preParsing"
  | "preValidation"
  | "preHandler"
  | "preSerialization"
  | "onSend"
  | "onResponse";

export type EventHandler = (
  req: FastifyRequest,
  reply: FastifyReply,
) => void | Promise<void>;
