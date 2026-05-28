/**
 * @fileoverview Registers vocabulary-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import {
  getChronostratigraphyLayersHandler,
  getChronostratigraphyTermsHandler,
  getVocabulariesHandler,
  getLithologyLayersHandler,
  getLithologyTermsHandler,
  getLithostratigraphyLayersHandler,
  getLithostratigraphyTermsHandler,
  getTectonicUnitsLayersHandler,
  getTectonicUnitsTermsHandler,
} from "../controllers/vocabController";
import { registerOpenApiRoute } from "../openapi/registerOpenApiRoute";

/**
 * Registers vocabulary listing, term, and layer-reference endpoints.
 *
 * Vocabulary routes are intentionally fixed per public vocabulary id so the
 * OpenAPI runtime can validate each operation against an exact specification
 * path instead of a loose dynamic route.
 */
export const registerVocabRoutes = async (fastify: FastifyInstance) => {
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies",
    fastifyPath: "/vocabularies",
    handler: getVocabulariesHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/chronostratigraphy/terms",
    fastifyPath: "/vocabularies/chronostratigraphy/terms",
    handler: getChronostratigraphyTermsHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/chronostratigraphy/layers",
    fastifyPath: "/vocabularies/chronostratigraphy/layers",
    handler: getChronostratigraphyLayersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/tectonic-units/terms",
    fastifyPath: "/vocabularies/tectonic-units/terms",
    handler: getTectonicUnitsTermsHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/tectonic-units/layers",
    fastifyPath: "/vocabularies/tectonic-units/layers",
    handler: getTectonicUnitsLayersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/lithostratigraphy/terms",
    fastifyPath: "/vocabularies/lithostratigraphy/terms",
    handler: getLithostratigraphyTermsHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/lithostratigraphy/layers",
    fastifyPath: "/vocabularies/lithostratigraphy/layers",
    handler: getLithostratigraphyLayersHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/lithology/terms",
    fastifyPath: "/vocabularies/lithology/terms",
    handler: getLithologyTermsHandler,
  });
  registerOpenApiRoute(fastify, {
    method: "get",
    specPath: "/vocabularies/lithology/layers",
    fastifyPath: "/vocabularies/lithology/layers",
    handler: getLithologyLayersHandler,
  });
};
