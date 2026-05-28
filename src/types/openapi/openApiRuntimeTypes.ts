import type OpenAPIRequestValidator from "openapi-request-validator";
import type OpenAPIResponseValidator from "openapi-response-validator";
import type { OpenApiMethod, OpenApiPath } from "./openApiRouteTypes";

export interface RegisteredRoute {
  method: OpenApiMethod;
  specPath: OpenApiPath;
  fastifyPath: string;
}

export interface OperationValidators {
  request: OpenAPIRequestValidator;
  response: OpenAPIResponseValidator;
}

export interface ValidationProblem {
  message: string;
  details: unknown;
}
