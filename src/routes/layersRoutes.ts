/**
 * @fileoverview Registers layer-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import {
  getLayerAttributeListHandler,
  getLayerDefaultFiltersHandler,
  getLayerFiltersHandler,
  getLayersHandler,
} from "../controllers/layersController";
import { registerOpenApiRoute } from "../openapi/registerOpenApiRoute";

/**
 * Registers all layer endpoints under the active route prefix.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerLayerRoutes = async (fastify: FastifyInstance) => {
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/layers",
    fastifyPath: "/layers",
    handler: getLayersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/layers/{layerId}/filters",
    fastifyPath: "/layers/:layerId/filters",
    handler: getLayerFiltersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/layers/{layerId}/defaultFilters",
    fastifyPath: "/layers/:layerId/defaultFilters",
    handler: getLayerDefaultFiltersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/layers/{layerId}/attributeList",
    fastifyPath: "/layers/:layerId/attributeList",
    handler: getLayerAttributeListHandler,
  });
};
