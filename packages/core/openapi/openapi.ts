import { Newable } from "inversify";
import { PROPERTY_METADATA_KEY } from "./decorator";
import { ApiDocMetaData, ApiPropertyOptions, ParamsContent } from "./types";

export enum Status {
  // 2xx Success
  OK = 200,
  Created = 201,
  Accepted = 202,
  NoContent = 204,

  // 3xx Redirection
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,

  // 4xx Client Error
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  Conflict = 409,
  UnsupportedMediaType = 415,
  TooManyRequests = 429,

  // 5xx Server Error
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
}

function normalizePath(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)\??/g, (_, name) => `{${name}}`);
}

const resolveParams = (
  operation: any,
  location: "path" | "query",
  params: ParamsContent[] | Newable,
) => {
  if (Array.isArray(params)) {
    params?.forEach((param) => {
      operation.parameters.push({
        in: location,
        name: param.name,
        required: param.required ?? false,
        description: param.description,
        schema: param.schema,
      });
    });
    return;
  }

  const props: {
    key: string;
    type: any;
    options: ApiPropertyOptions & { isArray?: boolean };
  }[] = Reflect.getMetadata(PROPERTY_METADATA_KEY, params) || [];

  for (const { key, type, options } of props) {
    if (!operation.parameters) {
      operation.parameters = [];
    }

    operation.parameters.push({
      in: location,
      name: key,
      required: options.required ?? false,
      description: options.description,
      schema: {
        type:
          type === String
            ? "string"
            : type === Number
              ? "number"
              : type === Boolean
                ? "boolean"
                : "string", // fallback
        format: options.format,
        example: options.example,
      },
    });
  }
};

export function generateOpenApiSpec(
  apiDocs: ApiDocMetaData[],
  title?: string,
  version?: string,
  servers?: any,
) {
  const paths: Record<string, any> = {};
  const componentsSchemas: Map<string, any> = new Map();

  apiDocs.forEach(({ methodName, path, apiDoc }) => {
    if (!paths[path]) {
      paths[path] = {};
    }

    const operation: Record<string, any> = {
      summary: apiDoc.summary || "",
      description: apiDoc.description || "",
      tags: apiDoc.tags || [],
    };

    let schemaName: string;
    let schema: any;
    if (apiDoc.params) {
      const params =
        apiDoc.params === "auto"
          ? (apiDoc as any).__inferredParams
          : apiDoc.params;
      resolveParams(operation, "path", params);
    }

    if (apiDoc.query) {
      const query =
        apiDoc.query === "auto"
          ? (apiDoc as any).__inferredQuery
          : apiDoc.query;
      resolveParams(operation, "query", query);
    }

    if (apiDoc.requestBody) {
      const contentType = apiDoc.contentType ?? "application/json";
      const reqBody =
        apiDoc.requestBody === "auto"
          ? (apiDoc as any).__inferredRequestBody
          : apiDoc.requestBody;

      collectSchemas(reqBody, componentsSchemas);

      if (Array.isArray(reqBody)) {
        schemaName = reqBody[0].name;
        schema = {
          type: "array",
          items: { $ref: `#/components/schemas/${schemaName}` },
        };
      } else {
        schemaName = reqBody.name;
        schema = { $ref: `#/components/schemas/${schemaName}` };
      }

      operation.requestBody = {
        required: true,
        content: {
          [contentType]: { schema },
        },
      };
    }

    if (apiDoc.responses) {
      operation.responses = {};

      let responseContentType = "application/json";
      for (const [statusCodeStr, { content, description }] of Object.entries(
        apiDoc.responses,
      )) {
        const statusCode = Number(statusCodeStr);
        let responseSchema: any;
        let schemaName: string;

        if (Array.isArray(content)) {
          const cls = content[0];
          schemaName = cls.name;
          collectSchemas(cls, componentsSchemas);
          responseSchema = {
            type: "array",
            items: { $ref: `#/components/schemas/${schemaName}` },
          };
        } else if (content === "binary") {
          responseContentType = "application/octet-stream";
          responseSchema = {
            type: "string",
            format: "binary",
          };
        } else {
          schemaName = content.name;
          collectSchemas(content, componentsSchemas);
          responseSchema = { $ref: `#/components/schemas/${schemaName}` };
        }

        operation.responses[statusCode] = {
          description,
          content: {
            [responseContentType]: {
              schema: responseSchema,
            },
          },
        };
      }
    }

    const normalizedPath = normalizePath(path);
    if (!paths[normalizedPath]) {
      paths[normalizedPath] = {};
    }
    paths[normalizedPath][methodName.toLowerCase()] = operation;
  });

  const schemas: Record<string, any> = {};
  for (const [name, schema] of componentsSchemas.entries()) {
    schemas[name] = schema;
  }

  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title,
      version,
    },
    servers,
    paths,
    components: {
      schemas,
    },
  };

  return openApiSpec;
}

function isPrimitiveType(type: any): boolean {
  return [String, Number, Boolean].includes(type);
}

function generateSchemaFromClass(cls: any, map: Map<string, any>): any {
  const props = Reflect.getMetadata(PROPERTY_METADATA_KEY, cls) || [];
  const schema: Record<string, any> = {};
  const required: string[] = [];

  for (const { key, type, options, isArray } of props) {
    const name = key.toString();
    let propSchema: any;

    if (isArray) {
      if (options.format === "binary") {
        propSchema = {
          type: "array",
          items: {
            type: "string",
            format: "binary",
            description: options.description,
          },
        };
      } else {
        if (!isPrimitiveType(type) && !map.has(type.name)) {
          const nestedSchema = generateSchemaFromClass(type, map);
          map.set(type.name, nestedSchema);
        }
        propSchema = {
          type: "array",
          items: isPrimitiveType(type)
            ? { type: type.name.toLowerCase() }
            : { $ref: `#/components/schemas/${type.name}` },
        };
      }
    } else if (isPrimitiveType(type)) {
      propSchema = { type: type.name.toLowerCase() };
    } else if (options.format === "binary") {
      propSchema = {
        type: "string",
        format: "binary",
        description: options.description,
      };
    } else {
      if (!map.has(type.name)) {
        const nestedSchema = generateSchemaFromClass(type, map);
        map.set(type.name, nestedSchema);
      }
      propSchema = { $ref: `#/components/schemas/${type.name}` };
    }

    schema[name] = {
      ...propSchema,
      description: options.description,
      example: options.example,
    };

    if (options.required) required.push(name);
  }

  return {
    type: "object",
    properties: schema,
    ...(required.length > 0 ? { required } : {}),
  };
}

function collectSchemas(cls: any, map: Map<string, any>) {
  if (Array.isArray(cls)) {
    cls.forEach((c) => collectSchemas(c, map));
    return;
  }

  if (map.has(cls.name)) return;

  const schema = generateSchemaFromClass(cls, map);
  map.set(cls.name, schema);
}
