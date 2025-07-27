import { Newable } from "inversify";
import {
  ApiArrayPropertyOptions,
  ApiDocOptions,
  ApiPropertyOptions,
} from "../types";
import { ParamMetadata, ParamSource } from "../../controller/types";
import { PARAM_METADATA_KEY } from "../../controller/decorator";

export const APIDOC_KEY = Symbol("empack:apiDoc");

export function ApiDoc(options: ApiDocOptions): MethodDecorator {
  return (target, propertyKey) => {
    const paramTypes: any[] = Reflect.getMetadata(
      "design:paramtypes",
      target,
      propertyKey,
    );

    function getParamType(source: ParamSource): undefined | Newable {
      const paramMeta: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey) ?? [];

      const fromBodyParam = paramMeta.find((p) => p.source === source);
      return fromBodyParam ? paramTypes[fromBodyParam.index] : undefined;
    }

    if (options.requestBody === "auto") {
      (options as any).__inferredRequestBody =
        getParamType("multipart") ?? getParamType("body");
    }

    if (options.query === "auto") {
      (options as any).__inferredQuery = getParamType("query");
    }

    if (options.params === "auto") {
      (options as any).__inferredParams = getParamType("param");
    }

    Reflect.defineMetadata(APIDOC_KEY, options, target, propertyKey);
  };
}

export const PROPERTY_METADATA_KEY = Symbol("empack:apiProperty");

export function ApiProperty(
  options: ApiPropertyOptions = {},
): PropertyDecorator {
  return (target, propertyKey) => {
    const existing =
      Reflect.getMetadata(PROPERTY_METADATA_KEY, target.constructor) || [];

    existing.push({
      key: propertyKey,
      type: Reflect.getMetadata("design:type", target, propertyKey),
      options,
      isArray: false,
    });

    Reflect.defineMetadata(PROPERTY_METADATA_KEY, existing, target.constructor);
  };
}

export function ApiArrayProperty(
  options: ApiArrayPropertyOptions & { type: Newable | "string" },
): PropertyDecorator {
  return (target, propertyKey) => {
    const existing =
      Reflect.getMetadata(PROPERTY_METADATA_KEY, target.constructor) || [];

    existing.push({
      key: propertyKey,
      type: options.type,
      options,
      isArray: true,
    });

    Reflect.defineMetadata(PROPERTY_METADATA_KEY, existing, target.constructor);
  };
}
