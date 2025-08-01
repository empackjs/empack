import { App } from "../../packages/core";
import { jwtGuard } from "../../packages/utils/jwt";
import { AuthController } from "./controller/auth.controller";

const app = App.createBuilder((opt) => {
  opt.routerPrefix = "/api";
});
// app.enableAuthGuard(jwtGuard(jwtSecret));
// app.setMediator(handlers);
app.enableAuthGuard(jwtGuard("jfoidsjfoisjfiojifoj"));
app.mapController([AuthController]);
app.run();
