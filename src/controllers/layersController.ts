/**
 * Layer controllers for the mock API.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import {
  getLayerAttributesResponse,
  getLayerFiltersResponse,
  getLayersResponse,
} from "../services/layersService";
import { sendError } from "../utils/errors";

interface LayerParams {
  layerId: string;
}

export const getLayers = async (_req: FastifyRequest, reply: FastifyReply) => {
  return reply.send(getLayersResponse());
};

export const getLayerFilters = async (
  req: FastifyRequest<{ Params: LayerParams }>,
  reply: FastifyReply
) => {
  const { layerId } = req.params;
  const response = getLayerFiltersResponse(layerId);
  if (!response) {
    return sendError(reply, 404, "Layer not found");
  }

  return reply.send(response);
};

export const getLayerAttributeList = async (
  req: FastifyRequest<{ Params: LayerParams }>,
  reply: FastifyReply
) => {
  const { layerId } = req.params;
  const response = getLayerAttributesResponse(layerId);
  if (!response) {
    return sendError(reply, 404, "Layer not found");
  }

  return reply.send(response);
};
