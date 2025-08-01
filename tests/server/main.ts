import path from "path";
import { App } from "../../packages/core";
import { jwtGuard } from "../../packages/utils/jwt";
import { AuthController } from "./controller/auth.controller";
import { ChatGateway } from "./controller/chat.websocket";
import dotenv from "dotenv";

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
app.enableAuthGuard(jwtGuard("secret"));
app.mapController([AuthController]);
app.enableWebSocket([ChatGateway]);
app.run(parseInt(app.env.get("PORT")));
