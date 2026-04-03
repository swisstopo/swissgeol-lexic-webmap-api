/**
 * @fileoverview Registers typed Fastify routes bound to a single OpenAPI operation.
 */

import type { FastifyInstance } from "fastify";
import type { OpenApiHandler, OpenApiMethod, OpenApiPath } from "./types";
import { buildErrorBody } from "../utils/errors";

interface RegisterOpenApiRouteOptions<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> {
  method: TMethod;
  specPath: TPath;
  fastifyPath: string;
  handler: OpenApiHandler<TPath, TMethod>;
}

interface ValidationErrorDetail {
  location?: string;
  path?: string;
  message?: string;
  errorCode?: string;
}

interface ValidationDetails {
  errors?: ValidationErrorDetail[];
}

const formatValidationMessage = (details: unknown): string => {
  const errors = (details as ValidationDetails | undefined)?.errors;
  if (!errors || errors.length === 0) {
    return "Request validation failed";
  }

  const compositeError = errors.find((error) =>
    error.errorCode?.startsWith("oneOf.")
  );
  if (compositeError?.location && compositeError.path) {
    return `Invalid ${compositeError.location} value for '${compositeError.path}': must match one allowed schema`;
  }

  const firstError = errors[0];
  const fieldName = firstError.path ? `'${firstError.path}'` : "the request";

  if (firstError.errorCode?.startsWith("required.")) {
    if (firstError.location === "body") {
      return `Missing required field ${fieldName}`;
    }

    if (firstError.location === "query") {
      return `Missing required query parameter ${fieldName}`;
    }

    if (firstError.location === "params" || firstError.location === "path") {
      return `Missing required path parameter ${fieldName}`;
    }
  }

  if (firstError.location && firstError.path && firstError.message) {
    return `Invalid ${firstError.location} value for ${fieldName}: ${firstError.message}`;
  }

  return firstError.message || "Request validation failed";
};

export const registerOpenApiRoute = <
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
>(
  fastify: FastifyInstance,
  options: RegisterOpenApiRouteOptions<TPath, TMethod>
): void => {
  const { method, specPath, fastifyPath, handler } = options;

  fastify.openApiRuntime.registerRoute({
    method,
    specPath,
    fastifyPath,
  });

  fastify[method](fastifyPath, async (request, reply) => {
    const requestProblem = fastify.openApiRuntime.validateRequest(method, specPath, request);
    if (requestProblem) {
      request.log.warn(
        {
          operation: `${method.toUpperCase()} ${specPath}`,
          details: requestProblem.details,
        },
        requestProblem.message
      );
      return reply
        .status(400)
        .send(buildErrorBody(400, formatValidationMessage(requestProblem.details)));
    }

    const result = await handler(request as never);
    const responseProblem = fastify.openApiRuntime.validateResponse(
      method,
      specPath,
      result.statusCode,
      result.body
    );

    if (responseProblem) {
      request.log.error(
        {
          operation: `${method.toUpperCase()} ${specPath}`,
          details: responseProblem.details,
        },
        responseProblem.message
      );
      throw new Error(responseProblem.message);
    }

    return reply.status(result.statusCode).send(result.body as never);
  });
};
