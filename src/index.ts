/**
 * @fileoverview Bootstraps and starts the WebMap API Fastify server.
 */

import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, { FastifyError } from "fastify";
import {
  readGeoServerEnvironmentConfig,
  validateGeoServerEnvironmentConfig,
} from "./configuration/geoserver/configuration";
import { OpenApiRuntime } from "./openapi/runtime";
import { buildServedOpenApiDocument } from "./openapi/servedDocument";
import {
  API_ROUTE_PREFIX,
  loadOpenApiDocument,
  readOpenApiSourceDocument,
} from "./openapi/specification";
import { registerLayerRoutes } from "./routes/layersRoutes";
import { registerVocabRoutes } from "./routes/vocabRoutes";
import { registerWmsRoutes } from "./routes/wmsRoutes";
import { registerWmtsRoutes } from "./routes/wmtsRoutes";
import { buildErrorBody } from "./utils/errors";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const PORT = Number(process.env.PORT || 3000);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

/**
 * Builds the Fastify application in the same order the HTTP boundary depends on:
 * validate required upstream configuration, load the OpenAPI contract, attach the
 * runtime validator, expose documentation, register routes, then verify that the
 * registered Fastify paths still cover the OpenAPI specification.
 */
const createApp = async () => {
  validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig());
  const openApiDocument = await loadOpenApiDocument();
  const servedOpenApiDocument = buildServedOpenApiDocument(
    readOpenApiSourceDocument()
  );
  const openApiRuntime = new OpenApiRuntime(openApiDocument);
  const app = fastify({
    logger: { level: LOG_LEVEL },
  });

  app.decorate("openApiRuntime", openApiRuntime);
  /**
   * Converts unexpected runtime errors into a standardized 500 response.
   */
  app.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error }, "Request failed");

    const fastifyError = error as FastifyError;
    const statusCode =
      typeof fastifyError.statusCode === "number" &&
      fastifyError.statusCode >= 400 &&
      fastifyError.statusCode < 600
        ? fastifyError.statusCode
        : 500;

    const message =
      statusCode >= 500 ? "Internal server error" : fastifyError.message;

    return reply.status(statusCode).send(buildErrorBody(statusCode, message));
  });

  app.register(swagger, {
    mode: "static",
    specification: {
      document: servedOpenApiDocument,
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/swagger",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  app.get("/", async (_request, reply) => reply.redirect("/swagger/"));

  /**
   * Returns a standardized 404 response for unmatched routes.
   */
  app.setNotFoundHandler(async (_request, reply) =>
    reply.status(404).send(buildErrorBody(404, "Route not found"))
  );

  app.register(registerLayerRoutes, { prefix: API_ROUTE_PREFIX });
  app.register(registerVocabRoutes, { prefix: API_ROUTE_PREFIX });
  app.register(registerWmsRoutes, { prefix: API_ROUTE_PREFIX });
  app.register(registerWmtsRoutes, { prefix: API_ROUTE_PREFIX });

  await app.ready();
  app.openApiRuntime.assertRouteCoverage();

  return app;
};

createApp()
  .then((app) => app.listen({ port: PORT, host: "0.0.0.0" }))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
