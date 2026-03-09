/**
 * @fileoverview Registers vocabulary-related HTTP endpoints on the provided Fastify instance.
 */

import { FastifyInstance } from "fastify";
import {
  getVocabularies,
  getVocabularyLayersById,
  getVocabularyTermsById,
} from "../controllers/vocabController";
import {
  getChronostratigraphyLayersRouteSchema,
  getChronostratigraphyTermsRouteSchema,
  getLithologyLayersRouteSchema,
  getLithologyTermsRouteSchema,
  getLithostratigraphyLayersRouteSchema,
  getLithostratigraphyTermsRouteSchema,
  getTectonicUnitsLayersRouteSchema,
  getTectonicUnitsTermsRouteSchema,
  getVocabulariesRouteSchema,
} from "../docs/openapiSchemas";

/**
 * Registers vocabulary listing, terms, and layer reference endpoints.
 * @param fastify Fastify server instance used to declare routes.
 * @returns Promise resolved when route registration is complete.
 */
export const registerVocabRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    "/vocabularies",
    { schema: getVocabulariesRouteSchema },
    getVocabularies
  );
  fastify.get(
    "/vocabularies/chronostratigraphy/terms",
    { schema: getChronostratigraphyTermsRouteSchema },
    (_req, reply) => getVocabularyTermsById("chronostratigraphy", reply)
  );
  fastify.get(
    "/vocabularies/chronostratigraphy/layers",
    { schema: getChronostratigraphyLayersRouteSchema },
    (_req, reply) => getVocabularyLayersById("chronostratigraphy", reply)
  );
  fastify.get(
    "/vocabularies/tectonic-units/terms",
    { schema: getTectonicUnitsTermsRouteSchema },
    (_req, reply) => getVocabularyTermsById("tectonic-units", reply)
  );
  fastify.get(
    "/vocabularies/tectonic-units/layers",
    { schema: getTectonicUnitsLayersRouteSchema },
    (_req, reply) => getVocabularyLayersById("tectonic-units", reply)
  );
  fastify.get(
    "/vocabularies/lithostratigraphy/terms",
    { schema: getLithostratigraphyTermsRouteSchema },
    (_req, reply) => getVocabularyTermsById("lithostratigraphy", reply)
  );
  fastify.get(
    "/vocabularies/lithostratigraphy/layers",
    { schema: getLithostratigraphyLayersRouteSchema },
    (_req, reply) => getVocabularyLayersById("lithostratigraphy", reply)
  );
  fastify.get(
    "/vocabularies/lithology/terms",
    { schema: getLithologyTermsRouteSchema },
    (_req, reply) => getVocabularyTermsById("lithology", reply)
  );
  fastify.get(
    "/vocabularies/lithology/layers",
    { schema: getLithologyLayersRouteSchema },
    (_req, reply) => getVocabularyLayersById("lithology", reply)
  );
};
