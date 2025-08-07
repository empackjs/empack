import "reflect-metadata";
import { Container, Newable } from "inversify";
import { MediatorPipe } from "../mediator/index";
import {
  AppOptions,
  EmpackMiddleware,
  EmpackMiddlewareFunction,
  EventHandler,
  EventHook,
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
  resolveResponses,
  ROUTE_METADATA_KEY,
  WSCONTROLLER_METADATA,
} from "../controller/decorator";
import { APP_TOKEN } from "../token";
import { MulterOptions } from "../multer/types";
import { MULTER_KEY } from "../multer/decorator";
import fastify, {
  FastifyBaseLogger,
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
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

function castToType(value: string, type: string): any {
  try {
    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      case "array":
      case "object":
        return JSON.parse(value);
      case "string":
      default:
        return value;
    }
  } catch {
    return value;
  }
}

function normalizeMultipartDataBySchema(
  data: Record<string, any>,
  schema: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const propSchema = schema[key];

    if (!propSchema) {
      result[key] = value;
      continue;
    }

    const isFile = propSchema.isFile;
    if (isFile) {
      result[key] = value;
      continue;
    }

    if (propSchema.type === "array") {
      const items = Array.isArray(value) ? value : [value];
      result[key] = items.map((item) => {
        if (item?.value != null && propSchema.items?.type) {
          return castToType(item.value, propSchema.items.type);
        }
        return item;
      });
      continue;
    }

    if (typeof value === "object" && "value" in value) {
      result[key] = castToType(value.value, propSchema.type);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function normalizeMultipartProperties(properties: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, value] of Object.entries(properties)) {
    if ((value as any).type === "array") {
      const items = (value as any).items;
      if (items?.isFile) {
        items.type = "string";
        items.format = "binary";
      }
    } else {
      if ((value as any)?.isFile) {
        (value as any).type = "string";
        (value as any).format = "binary";
      }
    }
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
  #appMiddleware: EmpackMiddleware[] = [];
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
                  const guardResult = (
                    await resolveMiddleware(req.container, guard)
                  )(req);
                  return await resolveResponses(guardResult, reply);
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

              app.addHook("preValidation", async (req) => {
                req.body = normalizeMultipartDataBySchema(
                  req.body as any,
                  (req.routeOptions.schema?.body as any).properties,
                );
              });
            }

            app.addHook("preHandler", async (req, reply) => {
              for (const m of [
                ...this.#appMiddleware,
                ...classMiddleware,
                ...route.middleware,
              ]) {
                const fn = await resolveMiddleware(req.container, m);
                const middlewareResult = await fn(req);
                await resolveResponses(middlewareResult, reply);
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
              if (routeMulterOptions && schema.body?.properties) {
                normalizeMultipartProperties(schema.body.properties);
                schema.consumes = ["multipart/form-data"];
              } else {
                schema.consumes = ["application/json"];
              }
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
              `AuthGuard is enabled, without default guard ${c.name} must define a @Guard decorator`,
            );
          }
          if (guard !== "none") {
            app.addHook("preHandler", async (req, reply) => {
              const guardResult = (
                await resolveMiddleware(req.container, guard)
              )(req);
              return await resolveResponses(guardResult, reply);
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

  useMiddleware(middleware: EmpackMiddleware) {
    this.#appMiddleware.push(middleware);
    return this;
  }

  addHook(event: EventHook, handler: EventHandler) {
    this.#app.addHook(event, handler);
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

  setErrorHandler(
    handler: (
      err: FastifyError,
      req: FastifyRequest,
      reply: FastifyReply,
    ) => void | Promise<void>,
  ) {
    this.#app.setErrorHandler(handler);
    return this;
  }

  setNotFoundHandler(
    handler: (req: FastifyRequest, reply: FastifyReply) => void | Promise<void>,
  ) {
    this.#app.setNotFoundHandler(handler);
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
