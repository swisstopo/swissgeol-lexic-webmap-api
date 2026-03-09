/**
 * @fileoverview HTTP handlers for layer-related API endpoints.
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

/**
 * Returns the list of available layers.
 * @param _req Fastify request object (unused).
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the layer collection payload.
 */
export const getLayers = async (_req: FastifyRequest, reply: FastifyReply) => {
  return reply.send(getLayersResponse());
};

/**
 * Returns filter definitions for a specific layer.
 * Responds with `404` when the layer identifier does not exist.
 * @param req Fastify request containing `layerId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing layer filters or a standardized not-found response.
 */
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

/**
 * Returns the attribute list exposed by a specific layer.
 * Responds with `404` when the layer identifier does not exist.
 * @param req Fastify request containing `layerId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing attributes or a standardized not-found response.
 */
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
