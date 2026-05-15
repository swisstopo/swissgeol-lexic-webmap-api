/**
 * @fileoverview Provides the internal semantic GraphDB resolution helpers that
 * will be reused by future WMS filter execution.
 */

import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../graphdb/configuration";
import {
  inferVocabularyIdFromTermUri,
  type PublicVocabularyId,
} from "../graphdb/vocabularyDefinitions";
import {
  getFilterConfigurationById,
  getTermFilterConfigurationByVocabularyId,
  type TermVocabularyId,
} from "../filters/configuration";
import { fetchVocabularyConceptsData } from "../libs/graphDbWrapper";

const PLACEHOLDER_PATTERN = /\$\{([A-Za-z0-9_]+)\}/g;

const normalizeVocabularyPrefixUrl = (vocabularyPrefixUrl: string): string => {
  const normalized = vocabularyPrefixUrl.trim().replace(/\/+$/, "");

  if (!normalized) {
    throw new Error("Missing GraphDB vocabulary prefix URL for semantic filter resolution.");
  }

  return normalized;
};

const formatTermForQueryPlaceholder = (
  termUri: string,
  expectedVocabularyId: PublicVocabularyId,
  vocabularyPrefixUrl: string
): string => {
  const inferredVocabularyId = inferVocabularyIdFromTermUri(
    termUri,
    vocabularyPrefixUrl
  );
  if (inferredVocabularyId !== expectedVocabularyId) {
    throw new Error(
      `Term URI does not belong to vocabulary '${expectedVocabularyId}'.`
    );
  }

  const placeholder = termUri.replace("#", "/").split("/").pop() || "";

  if (!placeholder) {
    throw new Error(`Invalid vocabulary term URI '${termUri}'.`);
  }

  return placeholder;
};

const resolveQueryTemplate = (
  template: string,
  replacements: Record<string, string>
): string =>
  template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const replacement = replacements[key];

    if (replacement === undefined) {
      throw new Error(`Missing semantic query placeholder '${key}'.`);
    }

    return replacement;
  });

/**
 * Creates the default GraphDB-backed executor used by the semantic resolver
 * when tests or callers do not provide a custom concept-query function.
 */
const createDefaultConceptQueryExecutor = () => {
  const environmentConfig = readGraphDbEnvironmentConfig();
  const vocabulariesConfig = buildGraphDbVocabulariesConfig(environmentConfig);

  return async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    const vocabulary = vocabulariesConfig[vocabularyId];

    if (!vocabulary) {
      throw new Error(
        `Missing GraphDB configuration for semantic filter vocabulary '${vocabularyId}'.`
      );
    }

    return fetchVocabularyConceptsData(vocabulary, sparqlQuery);
  };
};

export type SemanticConceptQueryExecutor = (
  vocabularyId: PublicVocabularyId,
  sparqlQuery: string
) => Promise<string[]>;

export type ChronostratigraphyResolutionRequest =
  | {
      mode: "younger" | "older";
      term: string;
    }
  | {
      mode: "between";
      olderTerm: string;
      youngerTerm: string;
    };

/**
 * Resolves all narrower concepts for a term-based semantic filter.
 */
export const resolveTermFilterNarrowers = async (
  vocabularyId: TermVocabularyId,
  termUri: string,
  vocabularyPrefixUrl = readGraphDbEnvironmentConfig().vocabularyPrefixUrl,
  execute: SemanticConceptQueryExecutor = createDefaultConceptQueryExecutor()
): Promise<string[]> => {
  const filterConfiguration = getTermFilterConfigurationByVocabularyId(
    vocabularyId
  );
  const normalizedPrefixUrl = normalizeVocabularyPrefixUrl(vocabularyPrefixUrl);

  const sparqlQuery = resolveQueryTemplate(filterConfiguration.queryNarrower, {
    prefix: normalizedPrefixUrl,
    term: formatTermForQueryPlaceholder(
      termUri,
      vocabularyId,
      normalizedPrefixUrl
    ),
  });

  return execute(vocabularyId, sparqlQuery);
};

/**
 * Resolves the chronostratigraphy concepts matched by one semantic filter mode.
 */
export const resolveChronostratigraphyConcepts = async (
  request: ChronostratigraphyResolutionRequest,
  vocabularyPrefixUrl = readGraphDbEnvironmentConfig().vocabularyPrefixUrl,
  execute: SemanticConceptQueryExecutor = createDefaultConceptQueryExecutor()
): Promise<string[]> => {
  const filterConfiguration = getFilterConfigurationById("f-chronostrat-term");
  const normalizedPrefixUrl = normalizeVocabularyPrefixUrl(vocabularyPrefixUrl);

  let sparqlQuery: string;
  if (request.mode === "between") {
    sparqlQuery = resolveQueryTemplate(filterConfiguration.queryBetween, {
      prefix: normalizedPrefixUrl,
      termOlder: formatTermForQueryPlaceholder(
        request.olderTerm,
        "chronostratigraphy",
        normalizedPrefixUrl
      ),
      termYounger: formatTermForQueryPlaceholder(
        request.youngerTerm,
        "chronostratigraphy",
        normalizedPrefixUrl
      ),
    });
  } else if (request.mode === "younger") {
    sparqlQuery = resolveQueryTemplate(filterConfiguration.queryYounger, {
      prefix: normalizedPrefixUrl,
      term: formatTermForQueryPlaceholder(
        request.term,
        "chronostratigraphy",
        normalizedPrefixUrl
      ),
    });
  } else {
    sparqlQuery = resolveQueryTemplate(filterConfiguration.queryOlder, {
      prefix: normalizedPrefixUrl,
      term: formatTermForQueryPlaceholder(
        request.term,
        "chronostratigraphy",
        normalizedPrefixUrl
      ),
    });
  }

  return execute("chronostratigraphy", sparqlQuery);
};
