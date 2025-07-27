import { ILogger, ILoggerSymbol, inject, IWebSocket, RawData, WebSocketContext, WsController } from "@empackjs/core";

@WsController("/chat/room/:id")
export class ChatWebSocket implements IWebSocket {
  constructor(@inject(ILoggerSymbol) private logger: ILogger) {}

  onConnected(ctx: WebSocketContext): void | Promise<void> {
    ctx.send(`chat is connected, req:${ctx.req.url}`);
    ctx.send(`pathParams id:${ctx.pathParams.id}`);
    ctx.send(`queryParams token:${ctx.queryParams.get('token')}`)
  }

  onMessage(
    ctx: WebSocketContext,
    data: RawData,
    isBinary: boolean,
  ): void | Promise<void> {
    this.logger.debug(`chat web socket send:${data}`);
    // throw new Error("ws error test");
    ctx.send(`response from server your data:${data}, isBinary:${isBinary}`);
  }
}
