import { Type, Static, FileType } from "../../../../packages/core";

export const UploadFileSchema = Type.Object({
  userId: Type.Number({ description: "使用者 ID" }),
  photo: FileType({ description: "one photo" }),
  photos: Type.Array(FileType(), { description: "many photos" }),
  addr: Type.Object({
    country: Type.String({ description: "country" }),
    zip: Type.Number({ description: "zip" }),
  }),
});

export type UploadFile = Static<typeof UploadFileSchema>;
