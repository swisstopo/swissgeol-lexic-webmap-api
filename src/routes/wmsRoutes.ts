/**
 * Routes for WMS endpoint.
 */

import { FastifyInstance } from "fastify";
import { postWms } from "../controllers/wmsController";

export const registerWmsRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/wms", postWms);
};
