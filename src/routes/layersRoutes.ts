/**
 * @fileoverview Registers layer-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import {
  getLayerAttributeList,
  getLayerFilters,
  getLayers,
} from "../controllers/layersController";
import {
  getLayerAttributeListRouteSchema,
  getLayerFiltersRouteSchema,
  getLayersRouteSchema,
} from "../docs/openapiSchemas";

/**
 * Registers all layer endpoints under the active route prefix.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerLayerRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/layers", { schema: getLayersRouteSchema }, getLayers);
  fastify.get(
    "/layers/:layerId/filters",
    { schema: getLayerFiltersRouteSchema },
    getLayerFilters
  );
  fastify.get(
    "/layers/:layerId/attributeList",
    { schema: getLayerAttributeListRouteSchema },
    getLayerAttributeList
  );
};
