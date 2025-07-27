import { JwtPayload } from "jsonwebtoken";

export interface IJwTokenHelper {
  generateToken(payload: any): string;
  verifyToken(token: string): JwtPayload | null;
}
