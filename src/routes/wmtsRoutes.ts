/**
 * @fileoverview Registers WMTS-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import { getWmtsHandler } from "../controllers/wmtsController";
import { registerOpenApiRoute } from "../openapi/registerOpenApiRoute";

/**
 * Registers the WMTS source endpoint against its OpenAPI operation.
 */
export const registerWmtsRoutes = async (fastify: FastifyInstance) => {
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/wmts",
    fastifyPath: "/wmts",
    handler: getWmtsHandler,
  });
};
