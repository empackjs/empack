import { JwtPayload, SignOptions } from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "../../../core";

export type JwtHandlerResult = {
  status: number;
  body: any;
};

export type JwtHandler = {
  onUnauthorized?: (
    req: FastifyRequest,
    reply: FastifyReply,
  ) => JwtHandlerResult;
  onExpired?: (req: FastifyRequest, reply: FastifyReply) => JwtHandlerResult;
  onSuccess?: (
    payload: string | JwtPayload,
    req: FastifyRequest,
    reply: FastifyReply,
  ) => void;
};

export type JwTokenSettings = {
  secret: string;
  options?: SignOptions;
};
