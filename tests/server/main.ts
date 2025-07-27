import path from "path";
import { controllers, wsControllers } from "./controller";
import { handlers } from "./application/handlers";
import { ScopeTest, ScopeTestSymbol } from "./domain/user/user.root";
import {
  App,
  jwtGuard,
  Logger,
  LOGGER_LEVEL,
  timerMiddleware,
} from "../../packages/core";
import { JwtModule } from "./infra/jwt";

const app = App.createBuilder();

app.setDotEnv(path.join(__dirname, ".env.test"));
const nodeEnv = app.env.get("NODE_ENV");
const jwtSecret = app.env.get("JWT_SECRET");
const accessTokenExpiresIn = parseInt(app.env.get("ACCESSTOKEN_EXPIRES_IN"));
const refreshTokenExpiresIn = parseInt(app.env.get("REFRESHTOKEN_EXPIRES_IN"));
const port = parseInt(app.env.get("PORT"));

app.setLogger(
  new Logger(nodeEnv === "dev" ? LOGGER_LEVEL.DEBUG : LOGGER_LEVEL.INFO),
);
if (nodeEnv === "dev") {
  app.enableSwagger({
    title: "Empack",
    servers: [
      {
        description: "本地端",
        url: `http://localhost:${port}`,
      },
    ],
  });
}
app.enableAuthGuard(jwtGuard(jwtSecret));
app.setMediator(handlers);
app.addRequestScope(ScopeTestSymbol, ScopeTest);
app.loadModules(
  new JwtModule(
    {
      secret: jwtSecret,
      options: {
        expiresIn: accessTokenExpiresIn,
      },
    },
    {
      secret: jwtSecret,
      options: {
        expiresIn: refreshTokenExpiresIn,
      },
    },
  ),
);
app.useCors({
  origin: app.env.get("CORS_ORIGIN"),
  methods: "GET,PUT,PATCH,POST,DELETE",
  credentials: true,
});
app.useJsonParser();
app.useUrlEncodedParser({ extended: true });
app.useMiddleware(timerMiddleware(app.logger));
app.mapController(controllers);
app.enableWebSocket(wsControllers);
app.run(port);
