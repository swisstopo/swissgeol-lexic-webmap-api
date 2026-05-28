import type { PublicVocabularyId } from "./vocabularyDefinitionTypes";

export interface GraphDbEnvironmentConfig {
  baseUrl: string;
  username: string;
  password: string;
  vocabularyPrefixUrl: string;
  repositoryIds: Record<PublicVocabularyId, string>;
}

export interface GraphDbVocabularyConfig {
  id: PublicVocabularyId;
  uriSegment: string;
  repositoryId: string;
  url: string;
  username: string;
  password: string;
}

export type GraphDbVocabulariesConfig = Record<
  PublicVocabularyId,
  GraphDbVocabularyConfig
>;
