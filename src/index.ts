/**
 * @fileoverview Bootstraps and starts the WebMap API Fastify server.
 */

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, { FastifyError } from "fastify";
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
import { buildErrorBody } from "./utils/errors";

const PORT = Number(process.env.PORT || 3000);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const createApp = async () => {
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
