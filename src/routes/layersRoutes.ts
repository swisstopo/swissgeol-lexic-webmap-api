/**
 * Routes for layer-related endpoints.
 */

import { FastifyInstance } from "fastify";
import {
  getLayerAttributeList,
  getLayerFilters,
  getLayers,
} from "../controllers/layersController";

export const registerLayerRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/layers", getLayers);
  fastify.get("/layers/:layerId/filters", getLayerFilters);
  fastify.get("/layers/:layerId/attributeList", getLayerAttributeList);
};
