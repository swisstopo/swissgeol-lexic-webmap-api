/**
 * @fileoverview Provides the adapted GraphDB vocabulary query helpers reused from the original sandbox integration.
 */

import type {
  GraphDbVocabulariesConfig,
  GraphDbVocabularyConfig,
} from "../graphdb/configuration";
import { buildVocabularyListingSchemeLabelsQuery } from "../graphdb/queryCatalog";
import { GRAPHDB_VOCABULARY_DEFINITIONS } from "../graphdb/vocabularyDefinitions";
import type {
  GraphDbVocabularyLabel,
  GraphDbVocabularyTermStatement,
  GraphDbVocabularyTerm,
  PublicVocabularyId,
} from "../graphdb/types";
import { GraphDBClient, QueryExecutor, getQueryConfig } from "./graphdb_connector";

interface NamedNodeBinding {
  id?: string;
  value?: string;
}

interface LiteralBinding {
  value: string;
  language?: string;
}

interface VocabularyQueryResult {
  term: NamedNodeBinding;
  prefLabel: LiteralBinding;
}

interface VocabularyTermStatementQueryResult {
  term: NamedNodeBinding;
  predicate: NamedNodeBinding;
  object: unknown;
}

type GraphDbVocabulariesResult = Record<
  PublicVocabularyId,
  GraphDbVocabularyTerm[]
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNamedNodeBinding = (value: unknown): value is NamedNodeBinding =>
  isRecord(value) &&
  (typeof value.id === "string" || typeof value.value === "string");

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

const getNamedNodeValue = (value: NamedNodeBinding): string =>
  value.id ?? value.value ?? "";

const buildRepositoryUrl = (
  baseUrl: string,
  repositoryId: string
): string => `${baseUrl}/repositories/${repositoryId}`;

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
