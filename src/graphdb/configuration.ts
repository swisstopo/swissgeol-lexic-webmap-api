/**
 * @fileoverview Resolves GraphDB environment variables and builds the repository configuration used by the backend.
 */

import {
  GRAPHDB_VOCABULARY_DEFINITIONS,
  type PublicVocabularyId,
} from "./vocabularyDefinitions";

const readEnvValue = (name: string): string => process.env[name]?.trim() || "";

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

const buildRepositoryIdsFromEnvironment = (): Record<PublicVocabularyId, string> => {
  const repositoryIds = {} as Record<PublicVocabularyId, string>;

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    repositoryIds[definition.id] = readEnvValue(definition.repositoryEnvVar);
  }

  return repositoryIds;
};

/**
 * Reads the GraphDB runtime configuration from environment variables and keeps
 * the repository ids keyed by the public vocabulary identifiers used by the API.
 */
export const readGraphDbEnvironmentConfig = (): GraphDbEnvironmentConfig => ({
  baseUrl: readEnvValue("GRAPHDB_BASE_URL"),
  username: readEnvValue("GRAPHDB_USERNAME"),
  password: readEnvValue("GRAPHDB_PASSWORD"),
  vocabularyPrefixUrl: readEnvValue("VOCABULARY_PREFIX_URL"),
  repositoryIds: buildRepositoryIdsFromEnvironment(),
});

/**
 * Expands the shared GraphDB environment config into one per-vocabulary runtime
 * config object so the wrappers can address repositories directly.
 */
export const buildGraphDbVocabulariesConfig = (
  environmentConfig: GraphDbEnvironmentConfig = readGraphDbEnvironmentConfig()
): GraphDbVocabulariesConfig => {
  const vocabulariesConfig = {} as GraphDbVocabulariesConfig;

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    vocabulariesConfig[definition.id] = {
      id: definition.id,
      uriSegment: definition.uriSegment,
      repositoryId: environmentConfig.repositoryIds[definition.id],
      url: environmentConfig.baseUrl,
      username: environmentConfig.username,
      password: environmentConfig.password,
    };
  }

  return vocabulariesConfig;
};
