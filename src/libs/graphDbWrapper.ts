/**
 * @fileoverview Provides the adapted GraphDB vocabulary query helpers reused from the original sandbox integration.
 */

import type {
  GraphDbVocabulariesConfig,
  GraphDbVocabularyConfig,
} from "../types/graphdb/graphDbConfigurationTypes";
import { buildVocabularyListingSchemeLabelsQuery } from "../configuration/graphdb/catalogs/queryCatalog";
import { GRAPHDB_VOCABULARY_DEFINITIONS } from "../configuration/graphdb/catalogs/vocabularyDefinitionsCatalog";
import type {
  GraphDbVocabularyLabel,
  GraphDbVocabularyTermStatement,
  GraphDbVocabularyTerm,
  PublicVocabularyId,
} from "../types/graphdb/graphDbTypes";
import type {
  GraphDbVocabulariesResult,
  LiteralBinding,
  NamedNodeBinding,
  VocabularyConceptQueryResult,
  VocabularyQueryResult,
  VocabularyTermStatementQueryResult,
} from "../types/graphdb/graphDbWrapperTypes";
import { GraphDBClient, QueryExecutor, getQueryConfig } from "./graphdb_connector";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Guards GraphDB named-node bindings from the connector. Some connector paths
 * expose the URI on `id` and others on `value`, so downstream mapping accepts
 * both while still rejecting non-resource bindings.
 */
const isNamedNodeBinding = (value: unknown): value is NamedNodeBinding =>
  isRecord(value) &&
  (typeof value.id === "string" || typeof value.value === "string");

/**
 * Guards literal bindings and preserves the optional language tag needed by
 * vocabulary localization. Named nodes are deliberately excluded so callers can
 * distinguish literal labels from resource relationships.
 */
const isLiteralBinding = (value: unknown): value is LiteralBinding =>
  isRecord(value) &&
  typeof value.value === "string" &&
  value.termType !== "NamedNode" &&
  (value.language === undefined || typeof value.language === "string");

const isVocabularyQueryResult = (value: unknown): value is VocabularyQueryResult =>
  isRecord(value) &&
  isNamedNodeBinding(value.term) &&
  isLiteralBinding(value.prefLabel);

const isVocabularyTermStatementQueryResult = (
  value: unknown
): value is VocabularyTermStatementQueryResult =>
  isRecord(value) &&
  isNamedNodeBinding(value.term) &&
  isNamedNodeBinding(value.predicate) &&
  value.object !== undefined;

const isVocabularyConceptQueryResult = (
  value: unknown
): value is VocabularyConceptQueryResult =>
  isRecord(value) && isNamedNodeBinding(value.concept);

const getNamedNodeValue = (value: NamedNodeBinding): string =>
  value.id ?? value.value ?? "";

const buildRepositoryUrl = (
  baseUrl: string,
  repositoryId: string
): string => `${baseUrl}/repositories/${repositoryId}`;

/**
 * Adapts GraphDB `allConcept` rows into the compact term list used by legacy
 * vocabulary consumers. Shape checks stay in this wrapper so services only see
 * typed domain objects, not raw SPARQL bindings.
 */
const mapVocabularyQueryResults = (
  vocabulary: GraphDbVocabularyConfig,
  queryResults: unknown[]
): GraphDbVocabularyTerm[] =>
  queryResults.map((queryResult) => {
    if (!isVocabularyQueryResult(queryResult)) {
      throw new Error(
        `Unexpected GraphDB result shape for vocabulary '${vocabulary.id}'.`
      );
    }

    return {
      term: getNamedNodeValue(queryResult.term),
      label: queryResult.prefLabel.value,
      language: queryResult.prefLabel.language,
    };
  });

/**
 * Creates the GraphDB connector objects and executes a SPARQL query against one
 * repository. This is the only place in the vocabulary domain that should know
 * about connector construction, repository URLs, or the optional row limit.
 */
const executeVocabularyQuery = async (
  vocabulary: GraphDbVocabularyConfig,
  sparqlQuery: string,
  limit: number | null = 2000
): Promise<unknown[]> => {
  const repositoryUrl = buildRepositoryUrl(vocabulary.url, vocabulary.repositoryId);
  const client = new GraphDBClient(
    vocabulary.url,
    vocabulary.username,
    vocabulary.password
  );
  const queryExecutor = new QueryExecutor(
    client,
    vocabulary.repositoryId,
    vocabulary.url,
    vocabulary.username,
    vocabulary.password,
    repositoryUrl
  );

  return queryExecutor.executeSparqlQuery<unknown>(sparqlQuery, { limit });
};

const fetchVocabularyData = async (
  vocabulary: GraphDbVocabularyConfig,
  vocabularyPrefixUrl: string
): Promise<GraphDbVocabularyTerm[]> => {
  const { allConcept } = getQueryConfig(vocabulary.id, vocabularyPrefixUrl);
  const queryResults = await executeVocabularyQuery(vocabulary, allConcept);
  return mapVocabularyQueryResults(vocabulary, queryResults);
};

/**
 * Fetches localized labels for a vocabulary listing scheme. The result is kept
 * language-tagged because `/vocabularies` resolves language fallback at the
 * service layer, where warning logging and configured fallbacks are available.
 */
const fetchVocabularyListingLabels = async (
  vocabulary: GraphDbVocabularyConfig,
  schemeUri: string
): Promise<GraphDbVocabularyLabel[]> => {
  const queryResults = await executeVocabularyQuery(
    vocabulary,
    buildVocabularyListingSchemeLabelsQuery(schemeUri)
  );

  return queryResults.map((queryResult) => {
    if (
      !isRecord(queryResult) ||
      !isLiteralBinding(queryResult.prefLabel)
    ) {
      throw new Error(
        `Unexpected GraphDB label result shape for vocabulary '${vocabulary.id}'.`
      );
    }

    return {
      label: queryResult.prefLabel.value,
      language: queryResult.prefLabel.language,
    };
  });
};

/**
 * Loads the flat statement stream for one vocabulary and normalizes GraphDB
 * bindings into simple predicate/object records. Higher-level grouping,
 * localization, and breadcrumb construction intentionally happen in the
 * vocabulary service, not in this connector wrapper.
 */
const fetchVocabularyTermStatements = async (
  vocabulary: GraphDbVocabularyConfig,
  vocabularyPrefixUrl: string
): Promise<GraphDbVocabularyTermStatement[]> => {
  const { allTermData } = getQueryConfig(vocabulary.id, vocabularyPrefixUrl);
  const queryResults = await executeVocabularyQuery(vocabulary, allTermData, null);

  return queryResults.map((queryResult) => {
    if (!isVocabularyTermStatementQueryResult(queryResult)) {
      throw new Error(
        `Unexpected GraphDB term statement shape for vocabulary '${vocabulary.id}'.`
      );
    }

    if (isLiteralBinding(queryResult.object)) {
      return {
        term: getNamedNodeValue(queryResult.term),
        predicate: getNamedNodeValue(queryResult.predicate),
        object: queryResult.object.value,
        objectLanguage: queryResult.object.language,
        objectIsLiteral: true,
      };
    }

    if (isNamedNodeBinding(queryResult.object)) {
      return {
        term: getNamedNodeValue(queryResult.term),
        predicate: getNamedNodeValue(queryResult.predicate),
        object: getNamedNodeValue(queryResult.object),
        objectIsLiteral: false,
      };
    }

    throw new Error(
      `Unexpected GraphDB term object binding for vocabulary '${vocabulary.id}'.`
    );
  });
};

/**
 * Loads the English `allConcept` dataset for every configured vocabulary.
 * This helper is mainly used by smoke checks and compatibility paths.
 */
export const fetchVocabulariesData = async (
  vocabulariesConfig: GraphDbVocabulariesConfig,
  vocabularyPrefixUrl: string
): Promise<GraphDbVocabulariesResult> => {
  const results = {} as GraphDbVocabulariesResult;

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    const vocabulary = vocabulariesConfig[definition.id];
    if (!vocabulary) {
      throw new Error(
        `Missing GraphDB configuration for vocabulary '${definition.id}'.`
      );
    }

    results[vocabulary.id] = await fetchVocabularyData(
      vocabulary,
      vocabularyPrefixUrl
    );
  }

  return results;
};

/**
 * Loads the localized `skos:prefLabel` values of each configured
 * `skos:ConceptScheme` used by the `/vocabularies` endpoint.
 */
export const fetchVocabularyListingLabelsData = async (
  vocabulariesConfig: GraphDbVocabulariesConfig
): Promise<Record<PublicVocabularyId, GraphDbVocabularyLabel[]>> => {
  const results = {} as Record<PublicVocabularyId, GraphDbVocabularyLabel[]>;

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    const vocabulary = vocabulariesConfig[definition.id];
    if (!vocabulary) {
      throw new Error(
        `Missing GraphDB configuration for vocabulary '${definition.id}'.`
      );
    }

    results[vocabulary.id] = await fetchVocabularyListingLabels(
      vocabulary,
      definition.vocabularyListingSchemeUri
    );
  }

  return results;
};

/**
 * Loads the bulk term statements used to build `/vocabularies/{vocabulary}/terms`.
 * This path intentionally disables the default 2000-row cap because one query
 * row is emitted for each label, definition and broader relation.
 */
export const fetchVocabularyTermsData = async (
  vocabulary: GraphDbVocabularyConfig,
  vocabularyPrefixUrl: string
): Promise<GraphDbVocabularyTermStatement[]> =>
  fetchVocabularyTermStatements(vocabulary, vocabularyPrefixUrl);

/**
 * Executes a semantic concept query for one vocabulary and returns the
 * resulting concept URIs extracted from the `?concept` binding. The caller is
 * responsible for providing a SELECT query that projects a `concept` variable.
 */
export const fetchVocabularyConceptsData = async (
  vocabulary: GraphDbVocabularyConfig,
  sparqlQuery: string
): Promise<string[]> => {
  const queryResults = await executeVocabularyQuery(vocabulary, sparqlQuery, null);

  return queryResults.map((queryResult) => {
    if (!isVocabularyConceptQueryResult(queryResult)) {
      throw new Error(
        `Unexpected GraphDB concept result shape for vocabulary '${vocabulary.id}'.`
      );
    }

    return getNamedNodeValue(queryResult.concept);
  });
};
