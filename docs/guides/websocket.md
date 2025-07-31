# WebSocket

Empack provides native support for WebSocket controllers with structured lifecycle hooks and dependency injection. 
It allows you to manage WebSocket connections just like HTTP controllers—with strong typing, scoped DI, and path-based routing.

## Basic Setup

To enable WebSocket support, pass your controllers to `app.enableWebSocket()`:

```ts
app.enableWebSocket([ChatGateway]);
```

Optionally, you can provide an authentication handler or global error handler via:

```ts
app.enableWebSocket([ChatGateway], (options) => {
  options.authHandler = async (req) => {
    const token = new URL(req.url!, "http://localhost").searchParams.get("token");
    if (!token || token !== "valid") {
      return { code: 4001, reason: "Unauthorized" };
    }
    return true;
  };

  options.onError = async (err, ws, req) => {
    console.error("WS Error:", err);
  };
});
```

## Define a WebSocket Controller

Use `@WsController(path)` to define a WebSocket endpoint:

```ts
@WsController("/ws/chat/:roomId")
export class ChatGateway implements IWebSocket {
  onConnected(ctx: WebSocketContext) {
    // this will try to get query value `/ws/chat/:roomId?token=value`
    const token = ctx.queryParams.get("token") 
    console.log("Client connected to room", ctx.pathParams.roomId);
  }

  onMessage(ctx: WebSocketContext, data: RawData) {
    const msg = data.toString();
    ctx.send(`You said: ${msg}`);
  }

  onClose(ctx: WebSocketContext, code: number, reason: string) {
    console.log("Client disconnected:", code, reason.toString());
  }
}
```

### `WebSocketContext` fields:

| Field         | Description                              |
| ------------- | ---------------------------------------- |
| `req`         | The original HTTP upgrade request        |
| `pathParams`  | Parameters from the `@WsController` path |
| `queryParams` | URL query string as `URLSearchParams`    |
| `send()`      | Send data to the client                  |
| `close()`     | Close connection with code and reason    |

## Lifecycle Hooks

Implement any of the following hooks in your controller:

| Method        | Description                      |
| ------------- | -------------------------------- |
| `onConnected` | Called when client connects      |
| `onMessage`   | Called on each incoming message  |
| `onClose`     | Called when the socket is closed |

All methods are optional and support async.

## Optional Auth Guard

WebSocket connections can use authHandler to perform per-connection authorization (e.g., token validation). 
If the auth handler returns anything other than `true`, the connection will be rejected:

```ts
options.authHandler = async (req) => {
  // Return { code, reason } to reject
  return { code: 4003, reason: "Forbidden" };
};
```

## Notes

* WebSocket controllers are **request-scoped**, meaning each connection has its own isolated DI container.
* You can inject services using constructor injection, just like with HTTP controllers.
* Routes are matched using the same logic as HTTP `(/ws/chat/:roomId)`.
* Unmatched connections will be rejected with code `1008`.
