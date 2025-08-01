import { FastifyReply, FastifyRequest } from "fastify";

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
  use(req: FastifyRequest, reply: FastifyReply): void | Promise<void>;
}
