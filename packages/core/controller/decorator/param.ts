import { ParamMetadata, ParamSource } from "../types";

export const PARAM_METADATA_KEY = Symbol("empack:param_metadata");

export const FromBody = createParamDecorator("body");
export const FromQuery = createParamDecorator("query");
export const FromParam = createParamDecorator("param");
export const FromReq = createParamDecorator("req");
export const FromReply = createParamDecorator("reply");
export const FromCookie = createParamDecorator("cookie");
export const FromHeader = createParamDecorator("header");
export const FromMultipart = createParamDecorator("multipart");
export const FromFile = createParamDecorator("file");
export const FromFiles = createParamDecorator("files");

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
