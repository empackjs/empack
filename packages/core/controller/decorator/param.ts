import { ParamMetadata, ParamSource } from "../types";

export const PARAM_METADATA_KEY = Symbol("empack:param_metadata");

export const FromBody = createParamDecorator("body");
export const FromQuery = createParamDecorator("query");
export const FromParam = createParamDecorator("param");
export const FromLocals = createParamDecorator("locals");
export const FromReq = createParamDecorator("req");
export const FromRes = createParamDecorator("res");
export const FromFile = createParamDecorator("file");
export const FromFiles = createParamDecorator("files");
export const FromCookie = createParamDecorator("cookie");
export const FromHeader = createParamDecorator("header");
export const FromMultipart = createMulterDecorator("multipart");

function createMulterDecorator(source: ParamSource) {
  return function (fileNames: string[]): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey as any) ||
        [];

      existingParams.push({
        index: parameterIndex,
        source,
        fileNames,
      });

      Reflect.defineMetadata(
        PARAM_METADATA_KEY,
        existingParams,
        target,
        propertyKey as any,
      );
    };
  };
}

function createParamDecorator(source: ParamSource) {
  return function (name?: string): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
      const existingParams: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA_KEY, target, propertyKey as any) ||
        [];

      let paramType;
      if (propertyKey) {
        const paramTypes = Reflect.getMetadata(
          "design:paramtypes",
          target,
          propertyKey,
        );
        paramType = paramTypes[parameterIndex];
      }

      existingParams.push({
        index: parameterIndex,
        source,
        name,
        paramType,
      });

      Reflect.defineMetadata(
        PARAM_METADATA_KEY,
        existingParams,
        target,
        propertyKey as any,
      );
    };
  };
}
