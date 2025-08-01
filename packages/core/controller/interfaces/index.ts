import { FastifyRequest } from "fastify";
import { WebSocketContext } from "../types/index";
import { RawData } from "ws";

export interface IWebSocket {
  onConnected?(
    req: FastifyRequest,
    ctx: WebSocketContext,
  ): void | Promise<void>;

  onMessage?(
    message: RawData,
    req: FastifyRequest,
    ctx: WebSocketContext,
  ): void | Promise<void>;

  onClose?(
    code: number,
    reason: string | Buffer,
    ctx: WebSocketContext,
  ): void | Promise<void>;
}
