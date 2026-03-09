/**
 * @fileoverview Registers WMS-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import { postWms } from "../controllers/wmsController";
import { postWmsRouteSchema } from "../docs/openapiSchemas";

/**
 * Registers the endpoint used to resolve WMS access details.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerWmsRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/wms", { schema: postWmsRouteSchema }, postWms);
};
