# WebSocket

Empack provides native support for WebSocket controllers with structured lifecycle hooks and dependency injection. 
It allows you to manage WebSocket connections just like HTTP controllers—with strong typing, scoped DI, and path-based routing.

## Basic Setup

To enable WebSocket support, pass your controllers to `app.enableWebSocket()`:

```ts
app.enableWebSocket([ChatGateway]);
```

## Define a WebSocket Controller

Use `@WsController(path)` to define a WebSocket endpoint:

```ts
@WsController("/ws/chat/:roomId")
export class ChatGateway implements IWebSocket {
  onMessage(message: RawData, req: FastifyRequest, ctx: WebSocketContext) {
    const msg = message.toString();
    ctx.send(`You said: ${msg}`);
  }

  onClose(code: number, reason: string | Buffer, ctx: WebSocketContext) {
    console.log("Client disconnected:", code, reason.toString());
  }
}
```

## Lifecycle Hooks

Implement any of the following hooks in your controller:

| Method        | Description                      |
| ------------- | -------------------------------- |
| `onConnected` | Called when client connects      |
| `onMessage`   | Called on each incoming message  |
| `onClose`     | Called when the socket is closed |

All methods are optional and support async.

## Custom Guards per WebSocket Controller

Empack allows you to override or specify guards on a per-controller — including for WebSocket controllers.
Just like HTTP controllers, WebSocket controllers support guards via decorators, giving you full flexibility and control.

```ts
@Guard(JwtAuth)
@WsController("/chat")
export class ChatController {
    //your websocket
}
```

## Notes

* WebSocket controllers are **request-scoped**, meaning each connection has its own isolated DI container.
* You can inject services using constructor injection, just like with HTTP controllers.
* Routes are matched using the same logic as HTTP `(/ws/chat/:roomId)`.



