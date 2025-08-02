import "reflect-metadata";
import { Container, Newable } from "inversify";
import { IncomingMessage } from "http";
import { WebSocket } from "ws";
import { MediatorPipe } from "../mediator/index";
import {
  EmpackMiddleware,
  EmpackMiddlewareFunction,
  WsAuthResult,
} from "./types/index";
import { Module } from "../di/index";
import { EventMap, MediatorMap } from "../mediator/types/index";
import { IEmpackMiddleware, IEnv, ILogger } from "./interfaces/index";
import { GuardMiddleware } from "../controller";
import { RouteDefinition } from "../controller/types";
import { Mediator } from "../mediator/mediator";
import { MEDIATOR_KEY } from "../mediator/decorator";
import {
  CONTROLLER_METADATA,
  GUARD_KEY,
  ROUTE_METADATA_KEY,
} from "../controller/decorator";
import { APP_TOKEN } from "../token";
import { MulterOptions } from "../multer/types";
import { MULTER_KEY } from "../multer/decorator";
import fastify, { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import multipart from "@fastify/multipart";
import { SCHEMA_KEY } from "../controller/decorator/schema";
import { TypeBoxTypeProvider, TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";

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
  #mediatorMap: MediatorMap = new Map();
  #eventMap: EventMap = new Map();
  #mediatorPipeLine?: {
    pre?: Newable<MediatorPipe>[];
    post?: Newable<MediatorPipe>[];
  };
  #isAuthGuardEnabled: boolean;
  #defaultGuard?: GuardMiddleware;
  #multerDefaults?: MulterOptions;
  logger: ILogger;
  env!: IEnv;
  serviceContainer: Container;
  options: AppOptions;

  private constructor(options: AppOptions) {
    this.options = options;
    this.#app = fastify()
      .setValidatorCompiler(TypeBoxValidatorCompiler)
      .withTypeProvider<TypeBoxTypeProvider>()
      .register(cookie);
    this.#isAuthGuardEnabled = false;
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

  mapController(controllers: Newable<any>[]) {
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
                await (
                  await resolveMiddleware(req.container, m)
                )(req, reply);
              }
            });

            let schema: any = {};
            const schemaMetadata = Reflect.getMetadata(
              SCHEMA_KEY,
              c.prototype,
              route.handlerName,
            );
            if (schemaMetadata) {
              schema = schemaMetadata;
            }

            app.route({
              method: route.method,
              url: route.path,
              schema,
              handler: async (req, reply) => {
                const instance = await req.container.getAsync(c);
                await instance[route.handlerName](req, reply);
              },
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

    this.#app.listen({ port }, (err) => {
      if (err) {
        console.log(err);
      } else {
        this.logger.info(`Listening on port ${port}`);
      }
    });
  }

  #bindLogger() {
    this.serviceContainer
      .rebindSync<ILogger>(APP_TOKEN.ILogger)
      .toConstantValue(this.logger);
  }
}
