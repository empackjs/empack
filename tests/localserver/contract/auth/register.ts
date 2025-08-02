import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";

export const RegisterBody = Type.Object({
  account: Type.String({ description: "帳號" }),
  password: Type.String({ minLength: 10 }),
  username: Type.Optional(Type.String()),
});

export type RegisterReq = Static<typeof RegisterBody>;

export const RegisterOK = Type.Object({
  account: Type.String(),
  username: Type.String(),
});

export type RegisterRes = Static<typeof RegisterOK>;
