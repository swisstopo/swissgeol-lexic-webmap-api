/**
 * @fileoverview HTTP handler for WMTS source configuration endpoint.
 */

import { readGeoServerEnvironmentConfig } from "../configuration/geoserver/configuration";
import { jsonResponse } from "../openapi/response";
import { getWmtsSourceResponse } from "../services/wmts/wmtsSourceService";
import type { OpenApiHandler, OpenApiRequest } from "../types/openapi/openApiRouteTypes";
import { buildErrorBody } from "../utils/errors";

/**
 * Handles WMTS source lookup for a configured layer.
 *
 * The controller reads runtime GeoServer configuration for URL construction and
 * leaves layer-to-source mapping to the WMTS service, then maps a missing layer
 * to the documented not-found response.
 */
export const getWmtsHandler: OpenApiHandler<"/wmts", "get"> = async (
  request: OpenApiRequest<"/wmts", "get">
) => {
  const response = getWmtsSourceResponse(
    request.query.layerId,
    readGeoServerEnvironmentConfig()
  );

  if (!response) {
    return jsonResponse<"/wmts", "get">(
      404,
      buildErrorBody(404, "Layer not found")
    );
  }

  return jsonResponse<"/wmts", "get">(200, response);
};
