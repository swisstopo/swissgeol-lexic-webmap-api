/**
 * @fileoverview Centralizes OpenAPI-derived route registry, startup checks, and runtime validators.
 */

import OpenAPIRequestValidator from "openapi-request-validator";
import OpenAPIResponseValidator from "openapi-response-validator";
import type { FastifyRequest } from "fastify";
import type { OpenAPIV3 } from "openapi-types";
import type { OpenApiMethod, OpenApiPath } from "../types/openapi/openApiRouteTypes";
import type {
  OperationValidators,
  RegisteredRoute,
  ValidationProblem,
} from "../types/openapi/openApiRuntimeTypes";

const SUPPORTED_METHODS: OpenApiMethod[] = ["get", "post", "put", "patch", "delete"];

const toRouteKey = (method: OpenApiMethod, specPath: string): string =>
  `${method.toUpperCase()} ${specPath}`;

const normalizeFastifyPath = (pathValue: string): string =>
  pathValue.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

const getOperationParameters = (
  pathItem: OpenAPIV3.PathItemObject,
  operation: OpenAPIV3.OperationObject
): OpenAPIV3.ParameterObject[] => {
  const pathParameters = Array.isArray(pathItem.parameters)
    ? pathItem.parameters.filter(
        (parameter): parameter is OpenAPIV3.ParameterObject => "$ref" in parameter === false
      )
    : [];
  const operationParameters = Array.isArray(operation.parameters)
    ? operation.parameters.filter(
        (parameter): parameter is OpenAPIV3.ParameterObject => "$ref" in parameter === false
      )
    : [];

  return [...pathParameters, ...operationParameters];
};

const isOperationObject = (
  candidate: OpenAPIV3.PathItemObject[keyof OpenAPIV3.PathItemObject]
): candidate is OpenAPIV3.OperationObject =>
  Boolean(candidate) && typeof candidate === "object" && "$ref" in candidate === false;

/**
 * Owns the runtime view of the OpenAPI contract.
 *
 * The route layer registers every implemented operation here during Fastify
 * plugin setup. At startup this class compares those registrations with the
 * dereferenced specification, and at request time it supplies request and
 * response validators for the typed route wrapper.
 *
 * There are two separate responsibilities:
 * - startup safety: `assertRouteCoverage` proves that every spec operation has a
 *   registered Fastify implementation and every implementation maps back to the
 *   spec path;
 * - request safety: `validateRequest` and `validateResponse` keep controllers
 *   aligned with the OpenAPI contract on every call.
 */
export class OpenApiRuntime {
  private readonly document: OpenAPIV3.Document;
  private readonly routes = new Map<string, RegisteredRoute>();
  private readonly validators = new Map<string, OperationValidators>();

  constructor(document: OpenAPIV3.Document) {
    this.document = document;
    this.initializeValidators();
  }

  /**
   * Records that a Fastify route implements one OpenAPI operation.
   *
   * Registration fails early when a route points at an operation that is absent
   * from the loaded specification or when two handlers claim the same operation.
   */
  registerRoute(route: RegisteredRoute): void {
    const routeKey = toRouteKey(route.method, route.specPath);
    if (!this.validators.has(routeKey)) {
      throw new Error(`Route ${routeKey} is not declared in the OpenAPI specification.`);
    }

    if (this.routes.has(routeKey)) {
      throw new Error(`Route ${routeKey} is registered more than once.`);
    }

    this.routes.set(routeKey, route);
  }

  /**
   * Verifies that the HTTP route table and OpenAPI operation table are aligned.
   *
   * This is called after `app.ready()` so all route plugins have run. It catches
   * missing implementations, undocumented implementations, and Fastify parameter
   * paths that no longer normalize to their OpenAPI path templates.
   */
  assertRouteCoverage(): void {
    const specificationRoutes = Array.from(this.validators.keys()).sort();
    const implementedRoutes = Array.from(this.routes.keys()).sort();
    const missingRoutes = specificationRoutes.filter((routeKey) => !this.routes.has(routeKey));
    const undocumentedRoutes = implementedRoutes.filter(
      (routeKey) => !this.validators.has(routeKey)
    );
    const invalidPathMappings = Array.from(this.routes.values())
      .filter((route) => normalizeFastifyPath(route.fastifyPath) !== route.specPath)
      .map(
        (route) =>
          `${route.method.toUpperCase()} ${route.fastifyPath} does not map to ${route.specPath}`
      );

    if (
      missingRoutes.length === 0 &&
      undocumentedRoutes.length === 0 &&
      invalidPathMappings.length === 0
    ) {
      return;
    }

    const errors = [
      ...missingRoutes.map((routeKey) => `Missing implementation for ${routeKey}`),
      ...undocumentedRoutes.map((routeKey) => `Implementation without spec entry: ${routeKey}`),
      ...invalidPathMappings,
    ];

    throw new Error(`OpenAPI route coverage check failed:\n${errors.join("\n")}`);
  }

  /**
   * Validates an inbound Fastify request against the OpenAPI operation before
   * the controller runs, including headers, path params, query params, and body.
   */
  validateRequest(
    method: OpenApiMethod,
    specPath: OpenApiPath,
    request: FastifyRequest
  ): ValidationProblem | null {
    const validator = this.validators.get(toRouteKey(method, specPath));
    if (!validator) {
      return {
        message: `Missing request validator for ${method.toUpperCase()} ${specPath}`,
        details: null,
      };
    }

    const errors = validator.request.validateRequest({
      headers: request.headers,
      params: request.params,
      query: request.query,
      body: request.body,
    });

    if (!errors || errors.length === 0) {
      return null;
    }

    return {
      message: `Request validation failed for ${method.toUpperCase()} ${specPath}`,
      details: errors,
    };
  }

  /**
   * Validates the controller result against the OpenAPI response schema selected
   * by operation and status code. Binary routes validate the documented response
   * body while the route wrapper sends the raw payload bytes to the client.
   */
  validateResponse(
    method: OpenApiMethod,
    specPath: OpenApiPath,
    statusCode: number,
    body: unknown
  ): ValidationProblem | null {
    const validator = this.validators.get(toRouteKey(method, specPath));
    if (!validator) {
      return {
        message: `Missing response validator for ${method.toUpperCase()} ${specPath}`,
        details: null,
      };
    }

    const validationError = validator.response.validateResponse(statusCode, body);
    if (!validationError) {
      return null;
    }

    return {
      message: `Response validation failed for ${method.toUpperCase()} ${specPath}`,
      details: validationError,
    };
  }

  /**
   * Creates request and response validators for every supported operation in the
   * dereferenced OpenAPI document. Path-level parameters are merged with
   * operation-level parameters to match OpenAPI inheritance rules.
   */
  private initializeValidators(): void {
    for (const [specPath, pathItem] of Object.entries(this.document.paths || {})) {
      if (!pathItem) {
        continue;
      }

      for (const method of SUPPORTED_METHODS) {
        const operationCandidate = pathItem[method];
        if (!isOperationObject(operationCandidate)) {
          continue;
        }

        const operation = operationCandidate;
        const routeKey = toRouteKey(method, specPath);
        const parameters = getOperationParameters(pathItem, operation);
        const requestBody =
          operation.requestBody && "$ref" in operation.requestBody === false
            ? operation.requestBody
            : undefined;

        this.validators.set(routeKey, {
          request: new OpenAPIRequestValidator({
            parameters,
            requestBody,
            componentSchemas: this.document.components?.schemas as never,
          }),
          response: new OpenAPIResponseValidator({
            responses: operation.responses as never,
            components: this.document.components,
          }),
        });
      }
    }
  }
}
