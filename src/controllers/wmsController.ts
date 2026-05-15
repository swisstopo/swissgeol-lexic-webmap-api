/**
 * @fileoverview HTTP handler for WMS resolution endpoint.
 */

import { getGenerateWmsRequestResponse } from "../services/generateWmsRequestService";
import { getMockLayerById } from "../services/layersService";
import type { OpenApiHandler, OpenApiRequest } from "../openapi/types";
import { jsonResponse } from "../openapi/types";
import { buildErrorBody } from "../utils/errors";
import { WEBMAP_ID } from "../webmap/constants";

/**
 * Validates WMS request input and returns the resolved WMS response payload.
 * Responds with `400` when required fields are missing or invalid.
 * Responds with `404` when the webmap or layer cannot be resolved.
 * @param req Fastify request containing WMS payload in the body.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the resolved WMS payload or a standardized error response.
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

  const layer = getMockLayerById(layerId);
  if (!layer) {
    return jsonResponse<"/generateWmsRequest", "post">(
      404,
      buildErrorBody(404, "Layer not found")
    );
  }

  return jsonResponse<"/generateWmsRequest", "post">(
    200,
    getGenerateWmsRequestResponse(layer.id)
  );
};

export const getWmsHandler: OpenApiHandler<"/wms", "get"> = async () =>
  jsonResponse<"/wms", "get">(
    500,
    buildErrorBody(500, "Not implemented")
  );

export const postWmsHandler: OpenApiHandler<"/wms", "post"> = async () =>
  jsonResponse<"/wms", "post">(
    500,
    buildErrorBody(500, "Not implemented")
  );
