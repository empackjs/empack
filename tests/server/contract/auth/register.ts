import { Static, Type } from "../../../../packages/core";

export const RegisterBodySchema = Type.Object({
  account: Type.String({ description: "帳號", minLength: 5 }),
  password: Type.String({ minLength: 10 }),
  username: Type.Optional(Type.String()),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;

export const RegisterResSchema = Type.Object(
  {
    account: Type.String(),
    username: Type.String(),
  },
  { description: "register ok response" },
);

export type RegisterRes = Static<typeof RegisterResSchema>;
