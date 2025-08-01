import "reflect-metadata";
import { Container, Newable } from "inversify";
import http, { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { Socket } from "net";
import cors from "cors";
import bodyParser from "body-parser";
import { MediatorPipe } from "../mediator/index";
import {
  EmpackMiddleware,
  EmpackMiddlewareFunction,
  OpenApiOptions,
  WsAuthResult,
} from "./types/index";
import { Module } from "../di/index";
import { EventMap, MediatorMap } from "../mediator/types/index";
import { IWebSocket } from "../controller/interfaces/index";
import { IEmpackMiddleware, IEnv, ILogger } from "./interfaces/index";
import { match } from "path-to-regexp";
import { GuardMiddleware } from "../controller";
import { RouteDefinition, WebSocketContext } from "../controller/types";
import { Mediator } from "../mediator/mediator";
import { MEDIATOR_KEY } from "../mediator/decorator";
import {
  CONTROLLER_METADATA,
  GUARD_KEY,
  ROUTE_METADATA_KEY,
  ROUTE_METHOD,
  ROUTE_PATH,
  WSCONTROLLER_METADATA,
} from "../controller/decorator";
import { ApiDocOptions } from "../openapi";
import { APIDOC_KEY } from "../openapi/decorator";
import { ApiDocMetaData } from "../openapi/types";
import { generateOpenApiSpec } from "../openapi/openapi";
import swaggerUI from "swagger-ui-express";
import { APP_TOKEN } from "../token";
import { MulterOptions } from "../multer/types";
import { MULTER_KEY } from "../multer/decorator";
import multer from "multer";
import fastify, { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import multipart, { MultipartFile } from "@fastify/multipart";

declare module "fastify" {
  interface FastifyRequest {
    container: Container;
  }
}

function mergeMulterOptions(
  base: MulterOptions | undefined,
  override: MulterOptions | undefined,
): MulterOptions {
  return {
    ...base,
    ...override,
    limits: {
      ...base?.limits,
      ...override?.limits,
    },
  };
}

function splitPath(path: string) {
  return path.split("/").filter(Boolean);
}

function comparePath(a: string, b: string): number {
  const aParts = splitPath(a);
  const bParts = splitPath(b);

  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const aPart = aParts[i] ?? "";
    const bPart = bParts[i] ?? "";

    const isADynamic = aPart.startsWith(":");
    const isBDynamic = bPart.startsWith(":");

    if (isADynamic !== isBDynamic) {
      return isADynamic ? 1 : -1;
    }

    const cmp = aPart.localeCompare(bPart);
    if (cmp !== 0) return cmp;
  }

  return 0;
}

function withWsErrorHandler<T extends (...args: any[]) => Promise<any> | any>(
  handler: T,
  errorHandler: (err: unknown) => Promise<void> | void,
): (...args: Parameters<T>) => Promise<void> {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (err) {
      await errorHandler(err);
    }
  };
}

function isClassConstructor(fn: any): boolean {
  try {
    Reflect.construct(String, [], fn);
    return true;
  } catch {
    return false;
  }
}

async function resolveMiddleware(
  container: Container,
  middleware: EmpackMiddleware,
): Promise<EmpackMiddlewareFunction> {
  if (typeof middleware === "function" && !isClassConstructor(middleware)) {
    return middleware as EmpackMiddlewareFunction;
  }

  const instance = await container.getAsync(
    middleware as Newable<IEmpackMiddleware>,
  );

  if (typeof instance?.use !== "function") {
    throw new Error(`Middleware ${middleware.name} is missing 'use' method.`);
  }

  const resolved = instance;

  if (typeof resolved.use !== "function") {
    throw new Error(
      `Middleware ${middleware.name}.use() did not return a function`,
    );
  }
  return resolved.use.bind(instance);
}

class Env implements IEnv {
  #env = process.env;

  get(key: string): string {
    const value = this.#env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  }

  getOptional(key: string): string | undefined {
    return this.#env[key];
  }
}

class Logger implements ILogger {
  error(err: Error) {
    console.error(err.stack || err.message);
  }

  warn(message: string) {
    console.warn(message);
  }

  info(message: string) {
    console.info(message);
  }

  debug(message: string) {
    console.debug(message);
  }
}

export class AppOptions {
  routerPrefix: string = "/api";
  wsPrefix: string = "";
  setTimeout?: number;
  gracefulShutdownTimeout?: number;
}

export class WsOptions {
  authHandler?: (req: IncomingMessage) => Promise<WsAuthResult> | WsAuthResult;
  onError?: (
    err: any,
    ws: WebSocket,
    req: IncomingMessage,
  ) => void | Promise<void>;
}

export class App {
  #app: FastifyInstance;
  // #server: http.Server;
  #connections: Set<Socket>;
  #mediatorMap: MediatorMap = new Map();
  #eventMap: EventMap = new Map();
  #mediatorPipeLine?: {
    pre?: Newable<MediatorPipe>[];
    post?: Newable<MediatorPipe>[];
  };
  #isAuthGuardEnabled: boolean;
  #defaultGuard?: GuardMiddleware;
  #controllers?: Newable[];
  #swagger?: {
    metaDataFn: () => ApiDocMetaData[];
    options: OpenApiOptions;
  };
  #multerDefaults?: MulterOptions;
  logger: ILogger;
  env!: IEnv;
  serviceContainer: Container;
  options: AppOptions;

  private constructor(options: AppOptions) {
    this.options = options;
    this.#app = fastify().register(cookie);
    this.#isAuthGuardEnabled = false;
    this.#connections = new Set<Socket>();
    this.logger = new Logger();
    this.serviceContainer = new Container({
      autobind: true,
    });
    // this.#server = http.createServer(this.#app);
    this.#bindLogger();
  }

  static createBuilder(fn: (options: AppOptions) => void = () => {}) {
    const options = new AppOptions();
    fn(options);
    return new App(options);
  }

  addSingleton(token: symbol, constructor: Newable) {
    this.serviceContainer.bind(token).to(constructor).inSingletonScope();
    return this;
  }

  addConstant(token: symbol, instance: any) {
    this.serviceContainer.bind(token).toConstantValue(instance);
    return this;
  }

  setDotEnv() {
    this.env = new Env();
    this.serviceContainer.bind<IEnv>(APP_TOKEN.IEnv).toConstantValue(this.env);
    return this;
  }

  setLogger(logger: ILogger) {
    this.logger = logger;
    this.#bindLogger();
    return this;
  }

  #createRequestContainer(): Container {
    const child = new Container({
      parent: this.serviceContainer,
      autobind: true,
    });

    const mediator = new Mediator(
      child,
      this.#mediatorMap,
      this.#eventMap,
      this.#mediatorPipeLine,
    );
    child.bind(APP_TOKEN.ISender).toConstantValue(mediator);
    child.bind(APP_TOKEN.IPublisher).toConstantValue(mediator);

    return child;
  }

  setMediator(
    handlers: Newable[],
    pipeline?: {
      pre?: Newable<MediatorPipe>[];
      post?: Newable<MediatorPipe>[];
    },
  ) {
    loop: for (const handler of handlers) {
      const reqKey = Reflect.getMetadata(MEDIATOR_KEY.handlerFor, handler);
      if (reqKey) {
        this.#mediatorMap.set(reqKey, handler);
        continue loop;
      }
      const eventKey = Reflect.getMetadata(MEDIATOR_KEY.subscribe, handler);
      if (eventKey) {
        const events = this.#eventMap.get(eventKey) ?? [];
        events.push(handler);
        this.#eventMap.set(eventKey, events);
        continue loop;
      }
      throw new Error(
        `Handler ${handler.name} is missing @HandlerFor or @Subscribe`,
      );
    }
    if (pipeline) {
      this.#mediatorPipeLine = pipeline;
    }
    return this;
  }

  loadModules(...modules: Module[]) {
    for (const mod of modules) {
      mod.loadModule();

      for (const entry of mod.getBindings()) {
        const { type, constructor, scope } = entry;
        switch (scope) {
          case "singleton":
            this.addSingleton(type, constructor);
            break;
          case "constant":
            this.addConstant(type, constructor);
            break;
        }
      }
    }
    return this;
  }

  enableSwagger(options: OpenApiOptions) {
    options.sortBy = options.sortBy ?? "route";

    const metaDataFn = () => {
      const apiDocs: ApiDocMetaData[] = [];

      this.#controllers?.forEach((c) => {
        const c_prototype = c.prototype;
        const c_path = Reflect.getMetadata(CONTROLLER_METADATA.PATH, c);

        Object.getOwnPropertyNames(c_prototype).forEach((handlerName) => {
          if (handlerName === "constructor") return;

          const handler = c_prototype[handlerName];
          if (typeof handler !== "function") return;

          const routeMethod: RouteDefinition["method"] = Reflect.getMetadata(
            ROUTE_METHOD,
            c_prototype,
            handlerName,
          );
          const routePath = Reflect.getMetadata(
            ROUTE_PATH,
            c_prototype,
            handlerName,
          );

          if (!routeMethod || !routePath) return;

          const apiDoc: ApiDocOptions =
            Reflect.getMetadata(APIDOC_KEY, c_prototype, handlerName) || {};

          apiDocs.push({
            controllerName: c.name,
            handlerName,
            methodName: routeMethod,
            path:
              `${this.options.routerPrefix}/${c_path}/${routePath}`
                .replace(/\/+/g, "/")
                .replace(/\/$/, "") || "/",
            apiDoc,
          });
        });
      });

      const methodOrder = ["GET", "POST", "PUT", "DELETE"];
      if (options.sortBy === "method") {
        apiDocs.sort((a, b) => {
          const orderA = methodOrder.indexOf(a.methodName.toUpperCase());
          const orderB = methodOrder.indexOf(b.methodName.toUpperCase());
          return orderA - orderB;
        });
      } else if (options.sortBy === "route") {
        apiDocs.sort((a, b) => {
          const pathCmp = comparePath(a.path, b.path);
          if (pathCmp !== 0) return pathCmp;

          const orderA = methodOrder.indexOf(a.methodName.toUpperCase());
          const orderB = methodOrder.indexOf(b.methodName.toUpperCase());
          return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
        });
      }

      return apiDocs;
    };

    this.#swagger = {
      metaDataFn,
      options,
    };
    return this;
  }

  mapController(controllers: Newable<any>[]) {
    this.#controllers = controllers;

    this.#app.addHook("preHandler", async (req) => {
      req.container = this.#createRequestContainer();
    });

    for (const c of controllers) {
      const controllerPath: string = Reflect.getMetadata(
        CONTROLLER_METADATA.PATH,
        c,
      );

      if (!controllerPath) {
        throw new Error(
          `Controller ${c.name} is missing @Controller decorator`,
        );
      }

      const classMiddleware: EmpackMiddleware[] =
        Reflect.getMetadata(CONTROLLER_METADATA.MIDDLEWARE, c) || [];

      const routes: RouteDefinition[] =
        Reflect.getMetadata(ROUTE_METADATA_KEY, c) || [];

      const controllerPlugin = async (app: FastifyInstance) => {
        for (const route of routes) {
          const routePlugin = async (app: FastifyInstance) => {
            if (this.#isAuthGuardEnabled) {
              const methodGuard = Reflect.getMetadata(
                GUARD_KEY,
                c.prototype,
                route.handlerName,
              );
              const classGuard = Reflect.getMetadata(GUARD_KEY, c);
              const guard: GuardMiddleware =
                methodGuard ?? classGuard ?? this.#defaultGuard;
              if (!guard) {
                throw new Error(
                  `AuthGuard is enabled, without default guard ${c.name} or ${c.name}.${route.handlerName} must define a @Guard decorator`,
                );
              }
              if (guard !== "none") {
                app.addHook("preHandler", async (req, reply) => {
                  return (await resolveMiddleware(req.container, guard))(
                    req,
                    reply,
                  );
                });
              }
            }

            const routeMulterOptions: MulterOptions = Reflect.getMetadata(
              MULTER_KEY,
              c.prototype,
              route.handlerName,
            );
            if (routeMulterOptions) {
              const { limits } = mergeMulterOptions(
                this.#multerDefaults,
                routeMulterOptions,
              );
              app.register(multipart, {
                attachFieldsToBody: true,
                limits,
                onFile: () => {},
              });
            }

            app.addHook("preHandler", async (req, reply) => {
              for (const m of [...classMiddleware, ...route.middleware]) {
                return (await resolveMiddleware(req.container, m))(req, reply);
              }
            });

            app[route.method](route.path, async (req, reply) => {
              const instance = await req.container.getAsync(c);
              await instance[route.handlerName](req, reply);
            });
          };
          app.register(routePlugin);
        }
      };

      const prefix = this.options.routerPrefix?.replace(/\/+$/, "") ?? "";
      const fullMountPath = `${prefix}/${controllerPath}`
        .replace(/\/+/g, "/")
        .toLowerCase();

      this.#app.register(controllerPlugin, { prefix: fullMountPath });
      this.logger.debug(`${c.name} Mounted at ${fullMountPath}`);
    }

    return this;
  }

  // enableWebSocket(
  //   controllers: Newable<IWebSocket>[],
  //   fn?: (opt: WsOptions) => void,
  // ) {
  //   const wsMap = new Map<
  //     string,
  //     { controller: Newable<IWebSocket>; matcher: any }
  //   >();
  //   for (const c of controllers) {
  //     const path = Reflect.getMetadata(WSCONTROLLER_METADATA.PATH, c);
  //     if (!path)
  //       throw new Error(`${c.name} is missing @WsController Decorator`);
  //     wsMap.set(path, { controller: c, matcher: match(path) });
  //   }
  //
  //   const options = new WsOptions();
  //   if (fn) fn(options);
  //
  //   const wss = new WebSocketServer({ server: this.#server });
  //
  //   const errorHandler = async (
  //     err: any,
  //     ws: WebSocket,
  //     req: IncomingMessage,
  //   ) => {
  //     this.logger.error(err);
  //     if (options.onError) await options.onError(err, ws, req);
  //     if (ws.readyState === WebSocket.OPEN)
  //       ws.close(1011, "Internal Server Error");
  //   };
  //
  //   wss.on("connection", (ws, req) => {
  //     ws.on("error", (err) => {
  //       this.logger.error(err);
  //       if (ws.readyState === WebSocket.OPEN) {
  //         ws.close(1011, "Internal Server Error");
  //       }
  //     });
  //
  //     const handleConnection = async () => {
  //       const { pathname, searchParams } = new URL(req.url!, `ws://localhost`);
  //       const auth = options.authHandler
  //         ? await options.authHandler(req)
  //         : true;
  //       if (auth !== true) {
  //         if (ws.readyState === WebSocket.OPEN) {
  //           ws.close(auth.code, auth.reason);
  //         }
  //         return;
  //       }
  //
  //       let ctor: Newable<IWebSocket> | undefined;
  //       let pathParams: any;
  //       for (const [, { controller, matcher }] of wsMap) {
  //         const result = matcher(pathname.toLowerCase());
  //         if (result) {
  //           ctor = controller;
  //           pathParams = result.params;
  //           break;
  //         }
  //       }
  //       if (!ctor) {
  //         this.logger.warn(`No WS route matched: ${pathname}`);
  //         if (ws.readyState === WebSocket.OPEN) {
  //           ws.close(1008, "Invalid WebSocket Route");
  //         }
  //         return;
  //       }
  //       const instance = await this.#createRequestContainer().getAsync(ctor);
  //       const { onMessage, onClose, onConnected } = instance;
  //       const ctx: WebSocketContext = {
  //         req,
  //         pathParams,
  //         queryParams: searchParams,
  //         send: (data) => ws.send(data),
  //         close: (code, reason) => ws.close(code, reason),
  //       };
  //       if (onConnected) {
  //         withWsErrorHandler(onConnected.bind(instance, ctx), (err) =>
  //           errorHandler(err, ws, req),
  //         )();
  //       }
  //       if (onMessage) {
  //         ws.on(
  //           "message",
  //           withWsErrorHandler(onMessage.bind(instance, ctx), (err) =>
  //             errorHandler(err, ws, req),
  //           ),
  //         );
  //       }
  //       if (onClose) {
  //         ws.on(
  //           "close",
  //           withWsErrorHandler(onClose.bind(instance, ctx), (err) =>
  //             errorHandler(err, ws, req),
  //           ),
  //         );
  //       }
  //     };
  //
  //     withWsErrorHandler(handleConnection, (err) =>
  //       errorHandler(err, ws, req),
  //     )();
  //   });
  //
  //   return this;
  // }

  setMulterDefaults(options?: MulterOptions) {
    this.#multerDefaults = options;
  }

  useMiddleware(middleware: EmpackMiddlewareFunction) {
    this.#app.addHook("onRequest", middleware);
    return this;
  }

  enableAuthGuard(defaultGuard?: GuardMiddleware) {
    this.#isAuthGuardEnabled = true;
    this.#defaultGuard = defaultGuard;
    return this;
  }

  // useJsonParser(options?: bodyParser.OptionsJson) {
  //   this.#app.use(express.json(options));
  //   return this;
  // }
  //
  // useUrlEncodedParser(
  //   options: bodyParser.OptionsUrlencoded = { extended: true },
  // ) {
  //   this.#app.use(express.urlencoded(options));
  //   return this;
  // }

  // useCors(options: cors.CorsOptions) {
  //   this.#app.use(cors(options));
  //   return this;
  // }

  useStatic(path: string) {
    this.#app.register(fastifyStatic, {
      root: path,
    });
    return this;
  }

  useHeaders(headers: Record<string, string>) {
    this.#app.addHook("onSend", async (_req, reply, payload) => {
      reply.headers(headers);
      return payload;
    });
    return this;
  }

  useExtension(fn: (app: FastifyInstance) => void) {
    fn(this.#app);
    return this;
  }

  run(port?: number) {
    port = port ?? 3000;

    // if (this.#swagger) {
    //   let swaggerPath: string;
    //   const { title, version, path, servers } = this.#swagger.options;
    //   try {
    //     const spec = generateOpenApiSpec(
    //       this.#swagger.metaDataFn(),
    //       title,
    //       version,
    //       servers,
    //     );
    //     swaggerPath = path ?? "/docs";
    //     this.#app.use(swaggerPath, swaggerUI.serve, swaggerUI.setup(spec));
    //     this.logger.info(
    //       `Swagger UI available at http://localhost:${port}${swaggerPath}`,
    //     );
    //   } catch (err) {
    //     this.logger.warn(`Swagger UI failed to initialize ${err}`);
    //   }
    // }

    // if (this.#exceptionHandler) {
    //   this.useMiddleware(this.#useExceptionMiddleware);
    // }
    // if (this.#notFoundHandler) {
    //   this.useMiddleware(this.#useNotFoundMiddleware);
    // }
    //

    this.#app.listen({ port }, (err) => {
      if (err) {
        console.log(err);
      } else {
        this.logger.info(`Listening on port ${port}`);
      }
    });

    // this.#server.on("connection", (conn) => {
    //   this.#connections.add(conn);
    //   conn.on("close", () => {
    //     this.#connections.delete(conn);
    //   });
    // });
    //
    // this.#server.setTimeout(this.options.setTimeout);
    //
    // process.on("SIGINT", this.#gracefulShutdown.bind(this));
    // process.on("SIGTERM", this.#gracefulShutdown.bind(this));
  }

  #bindLogger() {
    this.serviceContainer
      .rebindSync<ILogger>(APP_TOKEN.ILogger)
      .toConstantValue(this.logger);
  }

  // #gracefulShutdown() {
  //   this.logger.info("Starting graceful shutdown...");
  //
  //   this.#server?.close(() => {
  //     this.logger.info("Closed server, exiting process.");
  //     setTimeout(() => {
  //       process.exit(0);
  //     }, 1000);
  //   });
  //
  //   setTimeout(() => {
  //     this.logger.info("Forcing close of connections...");
  //     this.#connections.forEach((conn) => conn.destroy());
  //   }, this.options.gracefulShutdownTimeout ?? 30_000);
  // }
}
