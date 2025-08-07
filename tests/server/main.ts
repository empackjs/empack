import path from "path";
import { App } from "../../packages/core";
import { jwtGuard, JwTokenHelper } from "../../packages/utils/jwt";
import { AuthController } from "./controller/auth.controller";
import { ChatGateway } from "./controller/chat.websocket";
import dotenv from "dotenv";
import { ErrorHandler, NotFoundHandler } from "./contract/error-handling";
import { JWT_TOKEN } from "./jwt";

export type Env = {
  PORT: string;
  DOWNLOAD_PATH: string;
};

dotenv.config({
  path: path.join(__dirname, ".env.example"),
});

const app = App.createBuilder();
app.setDotEnv();
app.enableSwagger({
  routePrefix: "/docs",
  openapi: {
    info: {
      title: "Empack",
      description: "Empack API DOCS",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "local",
      },
    ],
  },
});
app.addConstant(
  JWT_TOKEN,
  new JwTokenHelper({
    secret: "secret",
  }),
);
app.enableAuthGuard(jwtGuard("secret"));
app.mapController([AuthController]);
app.enableWebSocket([ChatGateway]);
app.setErrorHandler(ErrorHandler);
app.setNotFoundHandler(NotFoundHandler);
app.run(parseInt(app.env.get("PORT")));
