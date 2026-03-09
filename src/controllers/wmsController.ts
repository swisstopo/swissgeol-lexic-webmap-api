/**
 * @fileoverview HTTP handler for WMS resolution endpoint.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { getWmsResponse } from "../services/wmsService";
import { WEBMAP_ID } from "../data/mockData";
import { getLayerById } from "../services/layersService";
import { sendError } from "../utils/errors";

interface WmsRequestBody {
  webmapId?: string;
  layerId?: string;
  filters?: unknown[];
}

/**
 * Validates WMS request input and returns the resolved WMS response payload.
 * Responds with `400` when required fields are missing or invalid.
 * Responds with `404` when the webmap or layer cannot be resolved.
 * @param req Fastify request containing WMS payload in the body.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the resolved WMS payload or a standardized error response.
 */
export const postWms = async (
  req: FastifyRequest<{ Body: WmsRequestBody }>,
  reply: FastifyReply
) => {
  const body = req.body || {};
  const webmapId = body.webmapId;
  const layerId = body.layerId;

  if (typeof webmapId !== "string" || typeof layerId !== "string") {
    return sendError(reply, 400, "Missing webmapId or layerId");
  }

  if (webmapId !== WEBMAP_ID) {
    return sendError(reply, 404, "Webmap not found");
  }

  const layer = getLayerById(layerId);
  if (!layer) {
    return sendError(reply, 404, "Layer not found");
  }

  return reply.send(getWmsResponse(layer.id));
};
