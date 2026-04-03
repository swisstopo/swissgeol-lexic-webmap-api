/**
 * @fileoverview HTTP handlers for layer-related API endpoints.
 */

import {
  getDefaultFiltersResponse,
  getLayerAttributesResponse,
  getLayerFiltersResponse,
  getLayersResponse,
} from "../services/layersService";
import type { OpenApiHandler, OpenApiRequest } from "../openapi/types";
import { jsonResponse } from "../openapi/types";
import { buildErrorBody } from "../utils/errors";

/**
 * Returns the list of available layers.
 * @param _req Fastify request object (unused).
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the layer collection payload.
 */
export const getLayersHandler: OpenApiHandler<"/layers", "get"> = async (
  request: OpenApiRequest<"/layers", "get">
) => {
  const { lang: _lang } = request.query;
  return jsonResponse<"/layers", "get">(200, getLayersResponse());
};

/**
 * Returns filter definitions for a specific layer.
 * Responds with `404` when the layer identifier does not exist.
 * @param req Fastify request containing `layerId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing layer filters or a standardized not-found response.
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
 * Returns the attribute list exposed by a specific layer.
 * Responds with `404` when the layer identifier does not exist.
 * @param req Fastify request containing `layerId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing attributes or a standardized not-found response.
 */
export const getLayerAttributeListHandler: OpenApiHandler<
  "/layers/{layerId}/attributeList",
  "get"
> = async (request: OpenApiRequest<"/layers/{layerId}/attributeList", "get">) => {
  const { layerId } = request.params;
  const response = getLayerAttributesResponse(layerId);
  if (!response) {
    return jsonResponse<"/layers/{layerId}/attributeList", "get">(
      404,
      buildErrorBody(404, "Layer not found")
    );
  }

  return jsonResponse<"/layers/{layerId}/attributeList", "get">(200, response);
};

/**
 * Returns the default filters that should be applied for a layer and vocabulary term.
 * Responds with `404` when the layer identifier does not exist and `400` when
 * the term is unsupported or the layer does not expose the matching vocabulary filter.
 * @param req Fastify request containing `layerId` path params and the `term` query param.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing default filters or a standardized error response.
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
