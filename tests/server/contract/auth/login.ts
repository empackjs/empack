import { Static, Type } from "../../../../packages/core";

export const LoginResSchema = Type.Object({
  token: Type.String(),
});

export type LoginRes = Static<typeof LoginResSchema>;

export const LoginBodySchema = Type.Object({
  account: Type.String(),
  password: Type.String(),
});

export type LoginBody = Static<typeof LoginBodySchema>;
