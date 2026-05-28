/**
 * @fileoverview HTTP handlers for vocabulary-related API endpoints.
 */

import {
  getGraphDbVocabulariesResponse,
  getVocabularyLayers as getVocabularyLayersData,
} from "../services/vocabularies/vocabService";
import type { OpenApiHandler, OpenApiRequest } from "../types/openapi/openApiRouteTypes";
import { jsonResponse } from "../openapi/response";
import type { PublicVocabularyId } from "../types/graphdb/graphDbTypes";
import { getGraphDbVocabularyTermsResponse } from "../services/vocabularies/vocabularyTermsService";

const getRequiredVocabularyTerms = async (
  vocabularyId: PublicVocabularyId,
  language?: string
) => getGraphDbVocabularyTermsResponse(vocabularyId, language);

const getRequiredVocabularyLayers = (vocabularyId: string) => {
  const response = getVocabularyLayersData(vocabularyId);
  if (!response) {
    throw new Error(`Missing mock vocabulary layers for ${vocabularyId}`);
  }

  return response;
};

/**
 * Handles vocabulary listing at the HTTP boundary and delegates GraphDB access
 * and language fallback behavior to the vocabulary service.
 */
export const getVocabulariesHandler: OpenApiHandler<
  "/vocabularies",
  "get"
> = async (request: OpenApiRequest<"/vocabularies", "get">) =>
  jsonResponse<"/vocabularies", "get">(
    200,
    await getGraphDbVocabulariesResponse(request.query.lang, request.log)
  );

/**
 * Handles chronostratigraphy term listing for the fixed OpenAPI path.
 */
export const getChronostratigraphyTermsHandler: OpenApiHandler<
  "/vocabularies/chronostratigraphy/terms",
  "get"
> = async (
  request: OpenApiRequest<"/vocabularies/chronostratigraphy/terms", "get">
) =>
  jsonResponse<"/vocabularies/chronostratigraphy/terms", "get">(
    200,
    await getRequiredVocabularyTerms("chronostratigraphy", request.query.lang)
  );

/**
 * Handles tectonic-unit term listing for the fixed OpenAPI path.
 */
export const getTectonicUnitsTermsHandler: OpenApiHandler<
  "/vocabularies/tectonic-units/terms",
  "get"
> = async (request: OpenApiRequest<"/vocabularies/tectonic-units/terms", "get">) =>
  jsonResponse<"/vocabularies/tectonic-units/terms", "get">(
    200,
    await getRequiredVocabularyTerms("tectonic-units", request.query.lang)
  );

/**
 * Handles lithostratigraphy term listing for the fixed OpenAPI path.
 */
export const getLithostratigraphyTermsHandler: OpenApiHandler<
  "/vocabularies/lithostratigraphy/terms",
  "get"
> = async (
  request: OpenApiRequest<"/vocabularies/lithostratigraphy/terms", "get">
) =>
  jsonResponse<"/vocabularies/lithostratigraphy/terms", "get">(
    200,
    await getRequiredVocabularyTerms("lithostratigraphy", request.query.lang)
  );

/**
 * Handles lithology term listing for the fixed OpenAPI path.
 */
export const getLithologyTermsHandler: OpenApiHandler<
  "/vocabularies/lithology/terms",
  "get"
> = async (request: OpenApiRequest<"/vocabularies/lithology/terms", "get">) =>
  jsonResponse<"/vocabularies/lithology/terms", "get">(
    200,
    await getRequiredVocabularyTerms("lithology", request.query.lang)
  );

/**
 * Handles chronostratigraphy layer references for the fixed OpenAPI path.
 */
export const getChronostratigraphyLayersHandler: OpenApiHandler<
  "/vocabularies/chronostratigraphy/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/chronostratigraphy/layers", "get">(
    200,
    getRequiredVocabularyLayers("chronostratigraphy")
  );

/**
 * Handles tectonic-unit layer references for the fixed OpenAPI path.
 */
export const getTectonicUnitsLayersHandler: OpenApiHandler<
  "/vocabularies/tectonic-units/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/tectonic-units/layers", "get">(
    200,
    getRequiredVocabularyLayers("tectonic-units")
  );

/**
 * Handles lithostratigraphy layer references for the fixed OpenAPI path.
 */
export const getLithostratigraphyLayersHandler: OpenApiHandler<
  "/vocabularies/lithostratigraphy/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/lithostratigraphy/layers", "get">(
    200,
    getRequiredVocabularyLayers("lithostratigraphy")
  );

/**
 * Handles lithology layer references for the fixed OpenAPI path.
 */
export const getLithologyLayersHandler: OpenApiHandler<
  "/vocabularies/lithology/layers",
  "get"
> = async () =>
  jsonResponse<"/vocabularies/lithology/layers", "get">(
    200,
    getRequiredVocabularyLayers("lithology")
  );
