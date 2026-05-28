import type {
  OpenApiMethod,
  OpenApiPath,
  OpenApiResponseBody,
  OpenApiResponseContentType,
  OpenApiResponseValidationBody,
  OpenApiRouteResult,
  OpenApiStatusCode,
} from "../types/openapi/openApiRouteTypes";

/**
 * Builds the typed JSON result consumed by the OpenAPI route wrapper.
 *
 * Controllers return this value instead of writing directly to Fastify replies so
 * response validation can run before the HTTP response is emitted.
 */
export const jsonResponse = <
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
  TStatusCode extends OpenApiStatusCode<TPath, TMethod> = OpenApiStatusCode<
    TPath,
    TMethod
  >,
>(
  statusCode: TStatusCode,
  body: OpenApiResponseBody<TPath, TMethod, TStatusCode>
): OpenApiRouteResult<TPath, TMethod> => ({
  statusCode,
  body,
}) as OpenApiRouteResult<TPath, TMethod>;

/**
 * Builds the typed binary result consumed by the OpenAPI route wrapper.
 *
 * `validationBody` is the OpenAPI-visible response value, while `payload` is the
 * actual byte stream sent to the client with the declared content type.
 */
export const binaryResponse = <
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
  TStatusCode extends OpenApiStatusCode<TPath, TMethod> = OpenApiStatusCode<
    TPath,
    TMethod
  >,
>(
  statusCode: TStatusCode,
  contentType: OpenApiResponseContentType<TPath, TMethod, TStatusCode>,
  validationBody: OpenApiResponseValidationBody<TPath, TMethod, TStatusCode>,
  payload: Buffer
): OpenApiRouteResult<TPath, TMethod> =>
  ({
    statusCode,
    body: validationBody,
    payload,
    contentType,
  }) as OpenApiRouteResult<TPath, TMethod>;
