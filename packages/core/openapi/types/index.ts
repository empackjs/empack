import { Newable } from "inversify";

type ResContent = {
  description?: string;
  content: Newable | [Newable] | "binary";
};

export type ParamsContent = {
  name: string;
  description?: string;
  required?: boolean;
  schema?: {
    type: string;
    format?: string;
  };
};

export type ApiDocOptions = {
  summary?: string;
  description?: string;
  tags?: string[];
  contentType?: "application/json" | "multipart/form-data";
  params?: ParamsContent[] | Newable | "auto";
  query?: ParamsContent[] | Newable | "auto";
  requestBody?: Newable | [Newable] | "auto";
  responses?: Record<number, ResContent>;
};

export type ApiDocMetaData = {
  controllerName: string;
  handlerName: string;
  methodName: string;
  path: string;
  apiDoc: ApiDocOptions;
};

export type ApiPropertyOptions = {
  description?: string;
  format?: string;
  example?: any;
  required?: boolean;
};

export type ApiArrayPropertyOptions = {
  description?: string;
  format?: string;
  example?: any;
  required?: boolean;
  type: Newable | "string";
};
