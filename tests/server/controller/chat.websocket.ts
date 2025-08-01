import {
  FastifyRequest,
  Guard,
  IWebSocket,
  RawData,
  WebSocketContext,
  WsController,
} from "../../../packages/core";

@Guard("none")
@WsController("/chat/:id")
export class ChatGateway implements IWebSocket {
  onMessage(
    message: RawData,
    req: FastifyRequest,
    ctx: WebSocketContext,
  ): void | Promise<void> {

  }
}
