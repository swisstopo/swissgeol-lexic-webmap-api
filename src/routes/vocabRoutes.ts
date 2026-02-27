/**
 * Routes for vocabulary endpoints.
 */

import { FastifyInstance } from "fastify";
import {
  getVocabularies,
  getVocabularyLayersById,
  getVocabularyTermsById,
} from "../controllers/vocabController";

export const registerVocabRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/vocabularies", getVocabularies);
  fastify.get("/vocabularies/chronostratigraphy/terms", (_req, reply) =>
    getVocabularyTermsById("chronostratigraphy", reply)
  );
  fastify.get("/vocabularies/chronostratigraphy/layers", (_req, reply) =>
    getVocabularyLayersById("chronostratigraphy", reply)
  );
  fastify.get("/vocabularies/tectonic-units/terms", (_req, reply) =>
    getVocabularyTermsById("tectonic-units", reply)
  );
  fastify.get("/vocabularies/tectonic-units/layers", (_req, reply) =>
    getVocabularyLayersById("tectonic-units", reply)
  );
  fastify.get("/vocabularies/lithostratigraphy/terms", (_req, reply) =>
    getVocabularyTermsById("lithostratigraphy", reply)
  );
  fastify.get("/vocabularies/lithostratigraphy/layers", (_req, reply) =>
    getVocabularyLayersById("lithostratigraphy", reply)
  );
  fastify.get("/vocabularies/lithology/terms", (_req, reply) =>
    getVocabularyTermsById("lithology", reply)
  );
  fastify.get("/vocabularies/lithology/layers", (_req, reply) =>
    getVocabularyLayersById("lithology", reply)
  );
};
