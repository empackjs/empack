import "reflect-metadata";
import { Container, Newable } from "inversify";
import { MediatorPipe } from "../mediator/index";
import {
  AppOptions,
  EmpackMiddleware,
  EmpackMiddlewareFunction,
  WsOptions,
} from "./types/index";
import { ContainerModule } from "../di/index";
import { EventMap, MediatorMap } from "../mediator/types/index";
import { IEmpackMiddleware, IEnv } from "./interfaces/index";
import { GuardMiddleware, IWebSocket } from "../controller";
import { RouteDefinition } from "../controller/types";
import { Mediator } from "../mediator/mediator";
import { MEDIATOR_KEY } from "../mediator/decorator";
import {
  CONTROLLER_METADATA,
  GUARD_KEY,
  ROUTE_METADATA_KEY,
  WSCONTROLLER_METADATA,
} from "../controller/decorator";
import { APP_TOKEN } from "../token";
import { MulterOptions } from "../multer/types";
import { MULTER_KEY } from "../multer/decorator";
import fastify, { FastifyBaseLogger, FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import fastifyStatic, { FastifyStaticOptions } from "@fastify/static";
import multipart from "@fastify/multipart";
import { SCHEMA_KEY } from "../controller/decorator/schema";
import {
  TypeBoxTypeProvider,
  TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import websocket from "@fastify/websocket";
import cors, { FastifyCorsOptions } from "@fastify/cors";
import helmet, { FastifyHelmetOptions } from "@fastify/helmet";
import swagger, { SwaggerOptions } from "@fastify/swagger";
import swaggerUI, { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { Env } from "./env";

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
  env!: IEnv<any>;
  serviceContainer: Container;
  options: AppOptions;
  logger: FastifyBaseLogger;

  private constructor(options: AppOptions) {
    options.routePrefix = options.routePrefix ?? "/api";
    this.options = options;
    this.#app = fastify(options)
      .setValidatorCompiler(TypeBoxValidatorCompiler)
      .withTypeProvider<TypeBoxTypeProvider>()
      .register(cookie);
    this.logger = this.#app.log;
    this.#isAuthGuardEnabled = false;
    this.serviceContainer = new Container({
      autobind: true,
    });
    this.serviceContainer.bind(APP_TOKEN.ILogger).toConstantValue(this.logger);
  }

  static createBuilder(options?: AppOptions) {
    return new App(options ?? {});
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
    this.serviceContainer
      .bind<IEnv<any>>(APP_TOKEN.IEnv)
      .toConstantValue(this.env);
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

  loadModules(...modules: ContainerModule[]) {
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

  enableSwagger(options: SwaggerOptions & FastifySwaggerUiOptions) {
    this.#app.register(swagger, options);
    this.#app.register(swaggerUI, options);
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
                const fn = await resolveMiddleware(req.container, m);
                await fn(req, reply);
                if (reply.sent) return;
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

      const prefix = this.options.routePrefix?.replace(/\/+$/, "") ?? "";
      const fullMountPath = `${prefix}/${controllerPath}`
        .replace(/\/+/g, "/")
        .toLowerCase();

      this.#app.register(controllerPlugin, { prefix: fullMountPath });
      this.logger.debug(`${c.name} Mounted at ${fullMountPath}`);
    }

    return this;
  }

  enableWebSocket(controllers: Newable<IWebSocket>[], options?: WsOptions) {
    if (options) {
      options.wsPrefix = options.wsPrefix ?? "/ws";
    }

    this.#app.register(websocket, { errorHandler: options?.errorHandler });

    for (const c of controllers) {
      const path = Reflect.getMetadata(WSCONTROLLER_METADATA.PATH, c);
      if (!path)
        throw new Error(`${c.name} is missing @WsController Decorator`);

      const wsControllerPlugin = async (app: FastifyInstance) => {
        if (this.#isAuthGuardEnabled) {
          const classGuard = Reflect.getMetadata(GUARD_KEY, c);
          const guard: GuardMiddleware = classGuard ?? this.#defaultGuard;
          if (!guard) {
            throw new Error(
              `AuthGuard is enabled, without default guard ${c.name} or ${c.name} must define a @Guard decorator`,
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
        const instance = await this.#createRequestContainer().getAsync(c);
        const { onMessage, onClose, onConnected } = instance;
        app.get(path, { websocket: true }, (socket, req) => {
          const ctx = {
            send: socket.send.bind(instance),
            close: socket.close.bind(instance),
          };

          if (onConnected) {
            onConnected(req, ctx);
          }

          if (onMessage) {
            socket.on("message", (msg) => {
              onMessage(msg, req, ctx);
            });
          }

          if (onClose) {
            socket.on("close", (code, reason) => {
              onClose(code, reason, ctx);
            });
          }
        });
      };

      this.#app.register(wsControllerPlugin, { prefix: options?.wsPrefix });
    }

    return this;
  }

  setMulterDefaults(options?: MulterOptions) {
    this.#multerDefaults = options;
    return this;
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

  useCors(options: FastifyCorsOptions) {
    this.#app.register(cors, options);
    return this;
  }

  useHelmet(options: FastifyHelmetOptions) {
    this.#app.register(helmet, options);
    return this;
  }

  useStatic(options: FastifyStaticOptions) {
    this.#app.register(fastifyStatic, options);
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
}
