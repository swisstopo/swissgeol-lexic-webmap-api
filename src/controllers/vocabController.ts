/**
 * Vocabulary controllers for the mock API.
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

export const getVocabularies = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => reply.send(getVocabulariesResponse());

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
