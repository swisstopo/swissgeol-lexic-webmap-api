/**
 * WMS controller for the mock API.
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
