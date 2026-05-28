import type { FastifyBaseLogger } from "fastify";

export type VocabularyWarningLogger = {
  warn: FastifyBaseLogger["warn"];
};
