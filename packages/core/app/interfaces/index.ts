import { FastifyReply, FastifyRequest } from "fastify";

export interface IEnv<T> {
  get(key: keyof T): string;
  getOptional(key: keyof T): string | undefined;
}

export interface IEmpackMiddleware {
  use(req: FastifyRequest, reply: FastifyReply): void | Promise<void>;
}
