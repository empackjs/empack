import { JwtPayload, SignOptions } from "jsonwebtoken";
import { EmpackResponses, FastifyRequest } from "../../../core";

export type JwtHandler = {
  onUnauthorized?: (req: FastifyRequest) => EmpackResponses;
  onExpired?: (req: FastifyRequest) => EmpackResponses;
  onSuccess?: (
    payload: string | JwtPayload,
    req: FastifyRequest,
  ) => void | EmpackResponses;
};

export type JwTokenSettings = {
  secret: string;
  options?: SignOptions;
};
