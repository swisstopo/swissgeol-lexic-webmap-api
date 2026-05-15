/**
 * @fileoverview Registers WMS-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import {
  postGenerateWmsRequestHandler,
  getWmsHandler,
  postWmsHandler,
} from "../controllers/wmsController";
import { registerOpenApiRoute } from "../openapi/registerOpenApiRoute";

/**
 * Registers the endpoint used to resolve WMS access details.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerWmsRoutes = async (fastify: FastifyInstance) => {
  registerOpenApiRoute(fastify, {
    method: "post",
    specPath: "/generateWmsRequest",
    fastifyPath: "/generateWmsRequest",
    handler: postGenerateWmsRequestHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/wms",
    fastifyPath: "/wms",
    handler: getWmsHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "post",
    specPath: "/wms",
    fastifyPath: "/wms",
    handler: postWmsHandler,
  });
};
