/**
 * @fileoverview Fastify module augmentation for OpenAPI runtime services.
 */

import "fastify";
import type { OpenApiRuntime } from "../openapi/runtime";

declare module "fastify" {
  interface FastifyInstance {
    openApiRuntime: OpenApiRuntime;
  }
}
