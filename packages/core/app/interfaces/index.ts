import { FastifyRequest } from "fastify";
import { EmpackResponses } from "../../controller";

export interface IEnv<T> {
  get(key: keyof T): string;
  getOptional(key: keyof T): string | undefined;
}

export interface IEmpackMiddleware {
  use(
    req: FastifyRequest,
  ): void | Promise<void> | EmpackResponses | Promise<EmpackResponses>;
}
