/**
 * @fileoverview HTTP handler for WMS resolution endpoint.
 */

import { getWmsResponse } from "../services/wmsService";
import { WEBMAP_ID } from "../data/mockData";
import { getLayerById } from "../services/layersService";
import type { OpenApiHandler, OpenApiRequest } from "../openapi/types";
import { jsonResponse } from "../openapi/types";
import { buildErrorBody } from "../utils/errors";

/**
 * Validates WMS request input and returns the resolved WMS response payload.
 * Responds with `400` when required fields are missing or invalid.
 * Responds with `404` when the webmap or layer cannot be resolved.
 * @param req Fastify request containing WMS payload in the body.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the resolved WMS payload or a standardized error response.
 */
export const postWmsHandler: OpenApiHandler<"/wms", "post"> = async (
  request: OpenApiRequest<"/wms", "post">
) => {
  const { webmapId, layerId } = request.body;

  if (webmapId !== WEBMAP_ID) {
    return jsonResponse<"/wms", "post">(404, buildErrorBody(404, "Webmap not found"));
  }

  const layer = getLayerById(layerId);
  if (!layer) {
    return jsonResponse<"/wms", "post">(404, buildErrorBody(404, "Layer not found"));
  }

  return jsonResponse<"/wms", "post">(200, getWmsResponse(layer.id));
};
