/**
 * @fileoverview HTTP handlers for layer-related API endpoints.
 */

import {
  getDefaultFiltersResponse,
  getLayerFiltersResponse,
  getLayersResponse,
} from "../services/layers/layersService";
import { getLiveLayerAttributesResponse } from "../services/geoserver/layerAttributeListService";
import type { OpenApiHandler, OpenApiRequest } from "../types/openapi/openApiRouteTypes";
import { jsonResponse } from "../openapi/response";
import { buildErrorBody } from "../utils/errors";

/**
 * Handles the `/layers` HTTP operation.
 *
 * The handler intentionally ignores `lang` for now because layer/filter labels
 * are still served from the static catalog. All response assembly is delegated
 * to `getLayersResponse`; this controller only wraps the result in the typed
 * OpenAPI response object.
 */
export const getLayersHandler: OpenApiHandler<"/layers", "get"> = async (
  request: OpenApiRequest<"/layers", "get">
) => {
  const { lang: _lang } = request.query;
  return jsonResponse<"/layers", "get">(200, getLayersResponse());
};

/**
 * Handles layer filter lookup at the HTTP boundary.
 *
 * Flow:
 * 1. Read `layerId` from the path.
 * 2. Ask `getLayerFiltersResponse` to resolve the configured layer and its
 *    public filter metadata.
 * 3. Convert a missing layer to the standardized 404 response.
 *
 * The controller does not read filter catalogs directly; service-level registry
 * functions own that mapping.
 */
export const getLayerFiltersHandler: OpenApiHandler<
  "/layers/{layerId}/filters",
  "get"
> = async (request: OpenApiRequest<"/layers/{layerId}/filters", "get">) => {
  const { lang: _lang } = request.query;
  const { layerId } = request.params;
  const response = getLayerFiltersResponse(layerId);
  if (!response) {
    return jsonResponse<"/layers/{layerId}/filters", "get">(
      404,
      buildErrorBody(404, "Layer not found")
    );
  }

  return jsonResponse<"/layers/{layerId}/filters", "get">(200, response);
};

/**
 * Handles live layer attribute lookup through the GeoServer-backed service.
 *
 * Flow:
 * 1. Read `layerId` from the path.
 * 2. Delegate to `getLiveLayerAttributesResponse`, which reads layer
 *    configuration, calls GeoServer WFS DescribeFeatureType when configured,
 *    and extracts public attribute names.
 * 3. Convert `null` to 404 and otherwise return the service payload.
 *
 * No GeoServer URL or XML parsing belongs in this controller.
 */
export const getLayerAttributeListHandler: OpenApiHandler<
  "/layers/{layerId}/attributeList",
  "get"
> = async (request: OpenApiRequest<"/layers/{layerId}/attributeList", "get">) => {
  const { layerId } = request.params;
  const response = await getLiveLayerAttributesResponse(layerId, request.log);
  if (!response) {
    return jsonResponse<"/layers/{layerId}/attributeList", "get">(
      404,
      buildErrorBody(404, "Layer not found")
    );
  }

  return jsonResponse<"/layers/{layerId}/attributeList", "get">(200, response);
};

/**
 * Handles default-filter resolution for a layer and vocabulary term.
 *
 * `getDefaultFiltersResponse` performs the domain work: infer vocabulary from
 * the term URI, map vocabulary to filter id, check layer support, and build the
 * default filter payload. This controller only forwards `layerId` and `term`,
 * then maps the service result to either 200, 400, or 404.
 */
export const getLayerDefaultFiltersHandler: OpenApiHandler<
  "/layers/{layerId}/defaultFilters",
  "get"
> = async (request: OpenApiRequest<"/layers/{layerId}/defaultFilters", "get">) => {
  const { layerId } = request.params;
  const { term } = request.query;
  const result = getDefaultFiltersResponse(layerId, term);
  if (result.error) {
    return jsonResponse<"/layers/{layerId}/defaultFilters", "get">(
      result.error.statusCode as 400 | 404,
      buildErrorBody(result.error.statusCode, result.error.message)
    );
  }

  return jsonResponse<"/layers/{layerId}/defaultFilters", "get">(
    200,
    result.response
  );
};
