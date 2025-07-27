import { ApiArrayProperty, ApiProperty, MulterFile } from "../../../../../packages/core";

export class UploadFile {
  @ApiProperty({
    description: "標題",
  })
  title!: string;

  @ApiArrayProperty({
    description: "檔案",
    type: "string",
    format: "binary",
  })
  photos!: MulterFile[];
}
