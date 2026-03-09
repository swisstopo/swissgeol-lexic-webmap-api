/**
 * @fileoverview HTTP handlers for vocabulary-related API endpoints.
 */

import { FastifyReply, FastifyRequest } from "fastify";
import {
  getVocabulariesResponse,
  getVocabularyLayers as getVocabularyLayersData,
  getVocabularyTerms as getVocabularyTermsData,
} from "../services/vocabService";
import { sendError } from "../utils/errors";

interface VocabParams {
  vocabularyId: string;
}

/**
 * Returns the list of available vocabularies.
 * @param _req Fastify request object (unused).
 * @param reply Fastify reply object.
 * @returns Fastify reply containing the vocabulary collection payload.
 */
export const getVocabularies = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => reply.send(getVocabulariesResponse());

/**
 * Returns terms for the vocabulary identified by the route parameter.
 * Responds with `404` when the vocabulary identifier is unknown.
 * @param req Fastify request containing `vocabularyId` path params.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing vocabulary terms or a standardized not-found response.
 */
export const getVocabularyTerms = async (
  req: FastifyRequest<{ Params: VocabParams }>,
  reply: FastifyReply
) => {
  const { vocabularyId } = req.params;
  const response = getVocabularyTermsData(vocabularyId);
  if (!response) {
    return sendError(reply, 404, "Vocabulary not found");
  }

  return reply.send(response);
};

/**
 * Returns terms for a known vocabulary identifier.
 * Responds with `404` when the vocabulary identifier is unknown.
 * @param vocabularyId Vocabulary identifier resolved by the route layer.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing vocabulary terms or a standardized not-found response.
 */
export const getVocabularyTermsById = async (
  vocabularyId: string,
  reply: FastifyReply
) => {
  const response = getVocabularyTermsData(vocabularyId);
  if (!response) {
    return sendError(reply, 404, "Vocabulary not found");
  }

  return reply.send(response);
};

/**
 * Returns layers associated with a known vocabulary identifier.
 * Responds with `404` when the vocabulary identifier is unknown.
 * @param vocabularyId Vocabulary identifier resolved by the route layer.
 * @param reply Fastify reply object.
 * @returns Fastify reply containing vocabulary-layer references or a standardized not-found response.
 */
export const getVocabularyLayersById = async (
  vocabularyId: string,
  reply: FastifyReply
) => {
  const response = getVocabularyLayersData(vocabularyId);
  if (!response) {
    return sendError(reply, 404, "Vocabulary not found");
  }

  return reply.send(response);
};
