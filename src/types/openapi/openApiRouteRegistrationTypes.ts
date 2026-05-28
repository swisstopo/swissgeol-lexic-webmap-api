import type {
  OpenApiHandler,
  OpenApiMethod,
  OpenApiPath,
} from "./openApiRouteTypes";

export interface RegisterOpenApiRouteOptions<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> {
  method: TMethod;
  specPath: TPath;
  fastifyPath: string;
  handler: OpenApiHandler<TPath, TMethod>;
}

export interface ValidationErrorDetail {
  location?: string;
  path?: string;
  message?: string;
  errorCode?: string;
}

export interface ValidationDetails {
  errors?: ValidationErrorDetail[];
}
