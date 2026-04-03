/**
 * @fileoverview HTTP handlers for vocabulary-related API endpoints.
 */

import {
  getVocabulariesResponse,
  getVocabularyLayers as getVocabularyLayersData,
  getVocabularyTerms as getVocabularyTermsData,
} from "../services/vocabService";
import type { OpenApiHandler, OpenApiRequest } from "../openapi/types";
import { jsonResponse } from "../openapi/types";

const getRequiredVocabularyTerms = (vocabularyId: string, language?: string) => {
  const response = getVocabularyTermsData(vocabularyId, language);
  if (!response) {
    throw new Error(`Missing mock vocabulary terms for ${vocabularyId}`);
  }

  return response;
};

const getRequiredVocabularyLayers = (vocabularyId: string) => {
  const response = getVocabularyLayersData(vocabularyId);
  if (!response) {
    throw new Error(`Missing mock vocabulary layers for ${vocabularyId}`);
  }

  return response;
};

/**
 * Returns the list of available vocabularies.
 * @param _req Fastify request object (unused).
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the vocabulary collection payload.
 */
export const getVocabulariesHandler: OpenApiHandler<
  "/vocabularies",
  "get"
> = async (_request: OpenApiRequest<"/vocabularies", "get">) =>
  jsonResponse<"/vocabularies", "get">(200, getVocabulariesResponse());

/**
 * Returns terms for the vocabulary identified by the route parameter.
 * Responds with `404` when the vocabulary identifier is unknown.
 * @param req Fastify request containing `vocabularyId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing vocabulary terms or a standardized not-found response.
 */
export const getChronostratigraphyTermsHandler: OpenApiHandler<
  "/vocabularies/chronostratigraphy/terms",
  "get"
> = async (
  request: OpenApiRequest<"/vocabularies/chronostratigraphy/terms", "get">
) =>
  jsonResponse<"/vocabularies/chronostratigraphy/terms", "get">(
    200,
    getRequiredVocabularyTerms("chronostratigraphy", request.query.lang)
  );

export const getTectonicUnitsTermsHandler: OpenApiHandler<
  "/vocabularies/tectonic-units/terms",
  "get"
> = async (request: OpenApiRequest<"/vocabularies/tectonic-units/terms", "get">) =>
  jsonResponse<"/vocabularies/tectonic-units/terms", "get">(
    200,
    getRequiredVocabularyTerms("tectonic-units", request.query.lang)
  );

export const getLithostratigraphyTermsHandler: OpenApiHandler<
  "/vocabularies/lithostratigraphy/terms",
  "get"
> = async (
  request: OpenApiRequest<"/vocabularies/lithostratigraphy/terms", "get">
) =>
  jsonResponse<"/vocabularies/lithostratigraphy/terms", "get">(
    200,
    getRequiredVocabularyTerms("lithostratigraphy", request.query.lang)
  );

export const getLithologyTermsHandler: OpenApiHandler<
  "/vocabularies/lithology/terms",
  "get"
> = async (request: OpenApiRequest<"/vocabularies/lithology/terms", "get">) =>
  jsonResponse<"/vocabularies/lithology/terms", "get">(
    200,
    getRequiredVocabularyTerms("lithology", request.query.lang)
  );

/**
 * Returns layers associated with a known vocabulary identifier.
 * Responds with `404` when the vocabulary identifier is unknown.
 * @param vocabularyId Vocabulary identifier resolved by the route layer.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing vocabulary-layer references or a standardized not-found response.
 */
export const getChronostratigraphyLayersHandler: OpenApiHandler<
  "/vocabularies/chronostratigraphy/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/chronostratigraphy/layers", "get">(
    200,
    getRequiredVocabularyLayers("chronostratigraphy")
  );

export const getTectonicUnitsLayersHandler: OpenApiHandler<
  "/vocabularies/tectonic-units/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/tectonic-units/layers", "get">(
    200,
    getRequiredVocabularyLayers("tectonic-units")
  );

export const getLithostratigraphyLayersHandler: OpenApiHandler<
  "/vocabularies/lithostratigraphy/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/lithostratigraphy/layers", "get">(
    200,
    getRequiredVocabularyLayers("lithostratigraphy")
  );

export const getLithologyLayersHandler: OpenApiHandler<
  "/vocabularies/lithology/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/lithology/layers", "get">(
    200,
    getRequiredVocabularyLayers("lithology")
  );
