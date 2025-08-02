import { App } from "../../packages/core";
import { jwtGuard } from "../../packages/utils/jwt";
import { AuthController } from "./controller/auth.controller";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

const app = App.createBuilder((opt) => {
  opt.routerPrefix = "/api";
});

app.useExtension(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "My API",
        description: "這是 API 文件",
        version: "1.0.0",
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: "/docs",
  });

  await fastify.ready();
});

app.enableAuthGuard(jwtGuard("secret"));
app.mapController([AuthController]);
app.run();
