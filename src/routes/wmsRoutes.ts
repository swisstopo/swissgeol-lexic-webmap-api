/**
 * @fileoverview Registers WMS-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import { postWmsHandler } from "../controllers/wmsController";
import { registerOpenApiRoute } from "../openapi/registerOpenApiRoute";

/**
 * Registers the endpoint used to resolve WMS access details.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerWmsRoutes = async (fastify: FastifyInstance) => {
  registerOpenApiRoute(fastify, {
    method: "post",
    specPath: "/wms",
    fastifyPath: "/wms",
    handler: postWmsHandler,
  });
};
