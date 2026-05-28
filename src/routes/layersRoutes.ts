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
 * Registers layer endpoints by pairing each OpenAPI path template with the
 * Fastify path that will receive requests under the active API prefix.
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
