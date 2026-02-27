/**
 * Fastify bootstrap for the WebMap API mock server.
 */

import fastify from "fastify";
import { registerLayerRoutes } from "./routes/layersRoutes";
import { registerVocabRoutes } from "./routes/vocabRoutes";
import { registerWmsRoutes } from "./routes/wmsRoutes";
import { sendError } from "./utils/errors";

const PORT = Number(process.env.PORT || 3000);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = fastify({ logger: { level: LOG_LEVEL } });

app.addHook("onRequest", async (request) => {
  request.log.info(
    { method: request.method, url: request.url },
    "Incoming request"
  );
});

app.addHook("onResponse", async (request, reply) => {
  request.log.info(
    { method: request.method, url: request.url, statusCode: reply.statusCode },
    "Request completed"
  );
});

app.setErrorHandler(async (error, request, reply) => {
  request.log.error({ err: error }, "Request failed");
  return sendError(reply, 500, "Internal server error");
});

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
