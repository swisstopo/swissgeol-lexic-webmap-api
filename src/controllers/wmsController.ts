/**
 * @fileoverview HTTP handler for WMS resolution endpoint.
 */

import type { FastifyBaseLogger } from "fastify";
import { getGenerateWmsRequestResponse } from "../services/wms/generateWmsRequestService";
import { readGeoServerEnvironmentConfig } from "../configuration/geoserver/configuration";
import type { OpenApiHandler, OpenApiRequest } from "../types/openapi/openApiRouteTypes";
import { binaryResponse, jsonResponse } from "../openapi/response";
import { validateFilterRequest } from "../services/filters/validation/filterRequestValidationService";
import {
  postGeoServerWmsImage,
  WmsProxyInputError,
} from "../services/geoserver/wmsProxyService";
import { buildErrorBody } from "../utils/errors";
import { WEBMAP_ID } from "../configuration/webmap/configuration";

type WmsRequestMethod = "GET" | "POST";

const getRawQueryString = (requestUrl: string | undefined): string => {
  const queryStartIndex = requestUrl?.indexOf("?") ?? -1;

  return queryStartIndex === -1 ? "" : requestUrl?.slice(queryStartIndex + 1) ?? "";
};

const serializeWmsPostBody = (body: unknown): string => {
  if (!body || typeof body !== "object") {
    return "";
  }

  const parameters = new URLSearchParams();
  for (const [name, value] of Object.entries(body)) {
    if (value !== undefined) {
      parameters.append(name, String(value));
    }
  }

  return parameters.toString();
};

const logInvalidWmsRequest = (
  logger: Pick<FastifyBaseLogger, "warn">,
  method: WmsRequestMethod,
  error: WmsProxyInputError
): void => {
  logger.warn(
    {
      operation: `${method} /wms`,
      errorName: error.name,
      reason: error.message,
    },
    "Invalid WMS proxy request"
  );
};

/**
 * Generates the base WMS request payload for a configured webmap layer.
 *
 * Flow:
 * 1. Reject requests for a webmap id different from the configured `WEBMAP_ID`.
 * 2. Validate the requested layer and filter payloads through the Filters
 *    validation service.
 * 3. Pass only the normalized layer id and validated filters to
 *    `getGenerateWmsRequestResponse`, which serializes them into the WMS body.
 *
 * This handler does not build the `SEMANTIC_FILTER` string itself; it only
 * enforces the HTTP contract and delegates WMS serialization to the service.
 */
export const postGenerateWmsRequestHandler: OpenApiHandler<
  "/generateWmsRequest",
  "post"
> = async (request: OpenApiRequest<"/generateWmsRequest", "post">) => {
  const { webmapId, layerId } = request.body;

  if (webmapId !== WEBMAP_ID) {
    return jsonResponse<"/generateWmsRequest", "post">(
      404,
      buildErrorBody(404, "Webmap not found")
    );
  }

  const validation = validateFilterRequest(layerId, request.body.filters ?? []);
  if (validation.error) {
    return jsonResponse<"/generateWmsRequest", "post">(
      validation.error.statusCode,
      buildErrorBody(validation.error.statusCode, validation.error.message)
    );
  }

  return jsonResponse<"/generateWmsRequest", "post">(
    200,
    getGenerateWmsRequestResponse(validation.layer.id, validation.filters)
  );
};

/**
 * Accepts a GET WMS request and proxies it to GeoServer as a POST form request.
 *
 * The raw query string is preserved because WMS parameters are protocol-level
 * inputs and may contain casing/encoding that should survive until the sanitizer
 * decides what to replace. The GeoServer proxy service owns all normalization,
 * `SEMANTIC_FILTER` resolution, and upstream error hiding.
 */
export const getWmsHandler: OpenApiHandler<"/wms", "get"> = async (
  request: OpenApiRequest<"/wms", "get">
) => {
  try {
    const image = await postGeoServerWmsImage(
      getRawQueryString(request.raw.url),
      readGeoServerEnvironmentConfig(),
      request.log
    );

    return binaryResponse<"/wms", "get", 200>(
      200,
      "image/png",
      "",
      image
    );
  } catch (error) {
    if (error instanceof WmsProxyInputError) {
      logInvalidWmsRequest(request.log, "GET", error);
      return jsonResponse<"/wms", "get">(
        400,
        buildErrorBody(400, "Invalid WMS request")
      );
    }

    request.log.error({ err: error }, "WMS proxy request failed");
    return jsonResponse<"/wms", "get">(
      500,
      buildErrorBody(500, "Internal server error")
    );
  }
};

/**
 * Proxies a POST WMS request to GeoServer using form-encoded WMS parameters.
 *
 * The route parser turns the form body into object fields so OpenAPI validation
 * can run. This handler serializes those fields back to a WMS form body, then
 * delegates sanitization, semantic resolution, GeoServer forwarding, and PNG
 * validation to the proxy service.
 */
export const postWmsHandler: OpenApiHandler<"/wms", "post"> = async (
  request: OpenApiRequest<"/wms", "post">
) => {
  try {
    const image = await postGeoServerWmsImage(
      serializeWmsPostBody(request.body),
      readGeoServerEnvironmentConfig(),
      request.log
    );

    return binaryResponse<"/wms", "post", 200>(
      200,
      "image/png",
      "",
      image
    );
  } catch (error) {
    if (error instanceof WmsProxyInputError) {
      logInvalidWmsRequest(request.log, "POST", error);
      return jsonResponse<"/wms", "post">(
        400,
        buildErrorBody(400, "Invalid WMS request")
      );
    }

    request.log.error({ err: error }, "WMS proxy request failed");
    return jsonResponse<"/wms", "post">(
      500,
      buildErrorBody(500, "Internal server error")
    );
  }
};
