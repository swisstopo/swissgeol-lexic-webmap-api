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

const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";

/**
 * Parses form-encoded WMS POST bodies while preserving the standard WMS
 * parameter names as regular request body fields for the OpenAPI wrapper.
 */
const parseFormUrlEncodedBody = (body: string): Record<string, string> => {
  const parameters: Record<string, string> = {};

  for (const [name, value] of new URLSearchParams(body)) {
    parameters[name] = value;
  }

  return parameters;
};

/**
 * Registers generateWmsRequest and the GET/POST WMS proxy endpoints.
 *
 * The custom form parser runs before OpenAPI request validation so WMS POST
 * bodies can be checked as object fields while still being proxied upstream as
 * `application/x-www-form-urlencoded` parameters.
 */
export const registerWmsRoutes = async (fastify: FastifyInstance) => {
  fastify.addContentTypeParser(
    FORM_CONTENT_TYPE,
    { parseAs: "string" },
    (_request, body, done) => {
      const textBody = typeof body === "string" ? body : body.toString("utf8");
      done(null, parseFormUrlEncodedBody(textBody));
    }
  );

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
