import { RawData } from "ws";
import { WebSocketContext } from "../types/index";

export interface IWebSocket {
  onConnected?(ctx: WebSocketContext): void | Promise<void>;

  onMessage?(
    ctx: WebSocketContext,
    data: RawData,
    isBinary: boolean,
  ): void | Promise<void>;

  onClose?(
    ctx: WebSocketContext,
    code: number,
    reason: string | Buffer,
  ): void | Promise<void>;
}
