import { NextFunction, Request, Response } from "express";
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

export const ROUTE_METADATA_KEY = Symbol("empack:route_metadata");
export const ROUTE_METHOD = Symbol("empack:route_method");
export const ROUTE_PATH = Symbol("empack:route_path");

export const Get = createRouteDecorator("get");
export const Post = createRouteDecorator("post");
export const Put = createRouteDecorator("put");
export const Delete = createRouteDecorator("delete");
export const Patch = createRouteDecorator("patch");

function applyWithData(res: Response, withData: ResponseWith = {}) {
  if (withData.headers) {
    for (const [key, value] of Object.entries(withData.headers)) {
      res.setHeader(key, value);
    }
  }

  if (withData.cookies) {
    for (const cookie of withData.cookies) {
      res.cookie(cookie.key, cookie.value, cookie.options);
    }
  }
}

function createRouteDecorator(method: RouteDefinition["method"]) {
  return (path: string, ...middleware: EmpackMiddleware[]): MethodDecorator => {
    return (target, propertyKey, descriptor: PropertyDescriptor) => {
      const original = descriptor.value;

      descriptor.value = async function (
        req: Request,
        res: Response,
        next: NextFunction,
      ) {
        try {
          const paramMeta: ParamMetadata[] =
            Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) || [];

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
                rawValue = req.body;
                break;
              case "query":
                rawValue = req.query;
                break;
              case "param":
                rawValue = req.params;
                break;
              case "locals":
                rawValue = res.locals;
                break;
              case "req":
                rawValue = req;
                break;
              case "res":
                rawValue = res;
                break;
              case "files":
                rawValue = req.files;
                break;
              case "file":
                rawValue = req.file;
                break;
              case "multipart":
                rawValue = {
                  ...req.body,
                };

                meta.fileNames?.forEach((name) => {
                  let value: any;
                  if (Array.isArray(req.files)) {
                    value = req.files.filter((f) => f.fieldname === name);
                  } else if (req.files && typeof req.files === "object") {
                    value = req.files[name];
                  } else if (req.file?.fieldname === name) {
                    value = req.file;
                  }
                  rawValue[name] = value;
                });

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
          if (res.headersSent) return;
          if (!result) {
            throw new Error(
              `No response returned from action ${req.method} ${req.path}`,
            );
          }

          if (result instanceof ResWith) {
            applyWithData(res, result.getWithData());
          }
          if (result instanceof JsonResponse) {
            return res.status(result.status).json(result.body);
          }
          if (result instanceof FileResponse) {
            return res.download(result.filePath, result.fileName);
          }
          if (result instanceof BufferResponse) {
            return res.end(result.data);
          }
          if (result instanceof RedirectResponse) {
            return res.redirect(result.status, result.url);
          }
        } catch (err) {
          next(err);
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
