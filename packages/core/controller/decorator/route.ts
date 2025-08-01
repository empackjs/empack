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

// function simplifyFilesMap(
//   filesMap: Record<string, any[]>,
// ): Record<string, any[]> {
//   return Object.fromEntries(
//     Object.entries(filesMap).map(([key, fileArray]) => [
//       key,
//       fileArray.map((file) => ({
//         filename: file.filename,
//         mimetype: file.mimetype,
//         file: file.file,
//         toBuffer: file.toBuffer,
//       })),
//     ]),
//   );
// }

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
                  const body = Object.fromEntries(
                    Object.entries(req.body as any)
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      .filter(([_, v]) => {
                        if (Array.isArray(v)) return v[0]?.type !== "file";
                        return (v as any)?.type !== "file";
                      })
                      .map(([key, prop]) => [key, (prop as any).value]),
                  );
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
              case "files":
                rawValue = [];
                if (isMultipart) {
                  const filesOnly = Object.fromEntries(
                    Object.entries(req.body as any)
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      .filter(([_, v]) => {
                        if (Array.isArray(v)) return v[0]?.type === "file";
                        return (v as any)?.type === "file";
                      })
                      .map(([key, v]) => {
                        const files = Array.isArray(v) ? v : [v];
                        return [key, files];
                      }),
                  );
                  rawValue = filesOnly;
                }
                break;
              case "multipart":
                rawValue = {};
                if (isMultipart) {
                  const body = Object.fromEntries(
                    Object.entries(req.body as any)
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      .filter(([_, v]) => {
                        if (Array.isArray(v)) return v[0]?.type !== "file";
                        return (v as any)?.type !== "file";
                      })
                      .map(([key, prop]) => [key, (prop as any).value]),
                  );
                  const filesOnly = Object.fromEntries(
                    Object.entries(req.body as any)
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      .filter(([_, v]) => {
                        if (Array.isArray(v)) return v[0]?.type === "file";
                        return (v as any)?.type === "file";
                      })
                      .map(([key, v]) => {
                        const files = Array.isArray(v) ? v : [v];
                        return [key, files];
                      }),
                  );
                  rawValue = {
                    ...body,
                    ...filesOnly,
                  };
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
