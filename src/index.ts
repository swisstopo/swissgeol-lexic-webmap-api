/**
 * @fileoverview Bootstraps and starts the WebMap API Fastify server.
 */

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastify, { FastifyError } from "fastify";
import type { OpenAPIV3 } from "openapi-types";
import {
  OPENAPI_COMPONENT_SCHEMAS,
  OPENAPI_COMPONENTS,
  OPENAPI_EXTERNAL_DOCS,
  OPENAPI_INFO,
  OPENAPI_SECURITY,
  OPENAPI_SERVERS,
  OPENAPI_TAGS,
  createDeepClone,
} from "./docs/openapiSchemas";
import { registerLayerRoutes } from "./routes/layersRoutes";
import { registerVocabRoutes } from "./routes/vocabRoutes";
import { registerWmsRoutes } from "./routes/wmsRoutes";
import { sendError } from "./utils/errors";

const PORT = Number(process.env.PORT || 3000);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = fastify({ logger: { level: LOG_LEVEL } });


for (const schema of OPENAPI_COMPONENT_SCHEMAS) {
  app.addSchema(createDeepClone(schema) as Record<string, unknown>);
}


/**
 * Logs core request metadata for every incoming HTTP request.
 */
app.addHook("onRequest", async (request) => {
  request.log.info(
    { method: request.method, url: request.url },
    "Incoming request"
  );
});

/**
 * Logs completion metadata for every handled HTTP request.
 */
app.addHook("onResponse", async (request, reply) => {
  request.log.info(
    { method: request.method, url: request.url, statusCode: reply.statusCode },
    "Request completed"
  );
});

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

  return sendError(reply, statusCode, message);
});

app.register(swagger, {
  mode: "dynamic",
  openapi: {
    openapi: "3.0.3",
    info: createDeepClone(OPENAPI_INFO) as OpenAPIV3.InfoObject,
    externalDocs: createDeepClone(
      OPENAPI_EXTERNAL_DOCS
    ) as OpenAPIV3.ExternalDocumentationObject,
    servers: createDeepClone(OPENAPI_SERVERS) as OpenAPIV3.ServerObject[],
    security: createDeepClone(
      OPENAPI_SECURITY
    ) as OpenAPIV3.SecurityRequirementObject[],
    tags: createDeepClone(OPENAPI_TAGS) as OpenAPIV3.TagObject[],
    components: createDeepClone(OPENAPI_COMPONENTS) as OpenAPIV3.ComponentsObject,
  },
  refResolver: {
    buildLocalReference: (json, _baseUri, _fragment, index) => {
      const schemaId = (json as { $id?: unknown }).$id;
      return typeof schemaId === "string" && schemaId.length > 0
        ? schemaId
        : `def-${index}`;
    },
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
  sendError(reply, 404, "Route not found")
);

app.register(registerLayerRoutes, { prefix: "/v1" });
app.register(registerVocabRoutes, { prefix: "/v1" });
app.register(registerWmsRoutes, { prefix: "/v1" });

app.listen({ port: PORT, host: "0.0.0.0" }).catch((error) => {
  app.log.error({ err: error }, "Failed to start server");
  process.exit(1);
});
