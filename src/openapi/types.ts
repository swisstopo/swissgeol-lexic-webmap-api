/**
 * @fileoverview Type helpers derived from the generated OpenAPI TypeScript definitions.
 */

import type { FastifyRequest } from "fastify";
import type { paths } from "../types/openapi";

export type OpenApiPaths = paths;
export type OpenApiPath = keyof OpenApiPaths & string;
export type OpenApiMethod = "get" | "post" | "put" | "patch" | "delete";

type PathOperation<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = OpenApiPaths[TPath][TMethod];

type OperationParameters<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = PathOperation<TPath, TMethod> extends { parameters: infer TParameters }
  ? TParameters
  : Record<string, never>;

type OperationResponses<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = PathOperation<TPath, TMethod> extends { responses: infer TResponses }
  ? TResponses
  : never;

type JsonContent<TResponse> = TResponse extends {
  content: { "application/json": infer TBody };
}
  ? TBody
  : never;

type EmptyObject = Record<string, never>;

export type OpenApiParams<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = OperationParameters<TPath, TMethod> extends { path: infer TPathParams }
  ? TPathParams
  : EmptyObject;

export type OpenApiQuery<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = OperationParameters<TPath, TMethod> extends { query: infer TQuery }
  ? TQuery
  : EmptyObject;

export type OpenApiBody<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = PathOperation<TPath, TMethod> extends {
  requestBody: { content: { "application/json": infer TBody } };
}
  ? TBody
  : never;

export type OpenApiRequest<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = FastifyRequest<{
  Params: OpenApiParams<TPath, TMethod>;
  Querystring: OpenApiQuery<TPath, TMethod>;
  Body: OpenApiBody<TPath, TMethod>;
}>;

export type OpenApiStatusCode<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = Extract<keyof OperationResponses<TPath, TMethod>, number>;

export type OpenApiResponseBody<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
  TStatusCode extends OpenApiStatusCode<TPath, TMethod>,
> = JsonContent<OperationResponses<TPath, TMethod>[TStatusCode]>;

export type OpenApiRouteResult<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = {
  [TStatusCode in OpenApiStatusCode<TPath, TMethod>]: {
    statusCode: TStatusCode;
    body: OpenApiResponseBody<TPath, TMethod, TStatusCode>;
  };
}[OpenApiStatusCode<TPath, TMethod>];

export type OpenApiHandler<
  TPath extends OpenApiPath,
  TMethod extends OpenApiMethod,
> = (
  request: OpenApiRequest<TPath, TMethod>
) =>
  | OpenApiRouteResult<TPath, TMethod>
  | Promise<OpenApiRouteResult<TPath, TMethod>>;

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
});
