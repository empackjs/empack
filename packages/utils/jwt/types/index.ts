import { JwtPayload, SignOptions } from "jsonwebtoken";
import { NextFunction, Request, Response } from "../../../core";

export type JwtHandlerResult = {
  status: number;
  body: any;
};

export type JwtHandler = {
  onUnauthorized?: (req: Request, res: Response) => JwtHandlerResult;
  onExpired?: (req: Request, res: Response) => JwtHandlerResult;
  onSuccess?: (
    payload: string | JwtPayload,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
};

export type JwTokenSettings = {
  secret: string;
  options?: SignOptions;
};
