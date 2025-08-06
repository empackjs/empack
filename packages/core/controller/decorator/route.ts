import { ParamMetadata, ResponseWith, RouteDefinition } from "../types";
import { EmpackMiddleware } from "../../app";
import {
  BufferResponse,
  FileResponse,
  JsonResponse,
  RedirectResponse,
  ResWith,
} from "../responses";
import { PARAM_METADATA_KEY } from "./param";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";

export const ROUTE_METADATA_KEY = Symbol("empack:route_metadata");
export const ROUTE_METHOD = Symbol("empack:route_method");
export const ROUTE_PATH = Symbol("empack:route_path");

export const Get = createRouteDecorator("get");
export const Post = createRouteDecorator("post");
export const Put = createRouteDecorator("put");
export const Delete = createRouteDecorator("delete");
export const Patch = createRouteDecorator("patch");

function normalizeMultipartBody(reqBody: Record<string, any>) {
  const cleanedBody: Record<string, any> = {};
  let file: any = null;
  const files: any[] = [];

  for (const [key, value] of Object.entries(reqBody)) {
    if (Array.isArray(value)) {
      const fileItems = value.filter((v) => v?.type === "file");
      const nonFileItems = value.filter((v) => v?.type !== "file");

      if (fileItems.length > 0) files.push(...fileItems);
      if (nonFileItems.length > 0) cleanedBody[key] = nonFileItems;

      continue;
    }
    if (value?.type === "file") {
      if (!file) file = value;
      else files.push(value);
      continue;
    }
    cleanedBody[key] = value;
  }

  return {
    body: cleanedBody,
    file,
    files: files.length > 0 ? files : undefined,
  };
}

function applyWithData(reply: FastifyReply, withData: ResponseWith = {}) {
  if (withData.headers) {
    reply.headers(withData.headers);
  }

  if (withData.cookies) {
    for (const cookie of withData.cookies) {
      reply.cookie(cookie.key, cookie.value, cookie.options);
    }
  }
}

function createRouteDecorator(method: RouteDefinition["method"]) {
  return (path: string, ...middleware: EmpackMiddleware[]): MethodDecorator => {
    return (target, propertyKey, descriptor: PropertyDescriptor) => {
      const original = descriptor.value;

      descriptor.value = async function (
        req: FastifyRequest,
        reply: FastifyReply,
      ) {
        try {
          const paramMeta: ParamMetadata[] =
            Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];

          const contentType = req.headers["content-type"] || "";
          const isMultipart = contentType.includes("multipart/form-data");
          const { body, file, files } = isMultipart
            ? normalizeMultipartBody(req.body as any)
            : {};

          const args: any[] = [];
          for (let i = 0; i < original.length; i++) {
            const meta = paramMeta.find((p) => p.index === i);

            if (!meta) {
              args[i] = undefined;
              continue;
            }

            let rawValue: any;
            switch (meta.source) {
              case "body":
                if (isMultipart) {
                  rawValue = body;
                } else {
                  rawValue = req.body;
                }
                break;
              case "query":
                rawValue = req.query;
                break;
              case "param":
                rawValue = req.params;
                break;
              case "req":
                rawValue = req;
                break;
              case "reply":
                rawValue = reply;
                break;
              case "file":
                rawValue = file;
                break;
              case "files":
                rawValue = files;
                break;
              case "multipart":
                if (isMultipart) {
                  rawValue = req.body;
                }
                break;
              case "cookie":
                rawValue = req.cookies;
                break;
              case "header":
                rawValue = req.headers;
                break;
              default:
                rawValue = undefined;
            }

            args[i] = meta.name ? rawValue[meta.name] : rawValue;
          }

          const result = await original.apply(this, args);
          if (result instanceof ResWith) {
            applyWithData(reply, result.getWithData());
          }
          if (result instanceof JsonResponse) {
            return reply.status(result.status).send(result.body);
          }
          if (result instanceof FileResponse) {
            reply.header(
              "Content-Disposition",
              `attachment; filename="${result.fileName}"`,
            );
            return reply.send(fs.createReadStream(result.filePath));
          }
          if (result instanceof BufferResponse) {
            return reply.send(result.data);
          }
          if (result instanceof RedirectResponse) {
            return reply.redirect(result.url, result.status);
          }
          if (result !== undefined) {
            return reply.send(result);
          }
        } catch (err) {
          throw err as Error;
        }
      };

      Reflect.defineMetadata(ROUTE_METHOD, method, target, propertyKey);
      Reflect.defineMetadata(ROUTE_PATH, path, target, propertyKey);

      const routes: RouteDefinition[] =
        Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
      routes.push({
        method,
        path,
        handlerName: propertyKey as string,
        middleware,
      });
      Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    };
  };
}
