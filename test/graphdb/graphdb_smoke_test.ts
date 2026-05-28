/**
 * Checks that GraphDB configuration can be loaded and the vocabulary listing query succeeds for all configured repositories.
 */

import "dotenv/config";
import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../../src/configuration/graphdb/configuration";
import type { GraphDbVocabularyConfig } from "../../src/types/graphdb/graphDbConfigurationTypes";
import { GRAPHDB_VOCABULARY_DEFINITIONS } from "../../src/configuration/graphdb/catalogs/vocabularyDefinitionsCatalog";
import { GraphDBClient, QueryExecutor, getQueryConfig } from "../../src/libs/graphdb_connector";
import {
  fetchVocabulariesData,
  fetchVocabularyListingLabelsData,
  fetchVocabularyTermsData,
} from "../../src/libs/graphDbWrapper";

const getMissingGraphDbEnvironmentVariables = (): string[] => {
  const environmentConfig = readGraphDbEnvironmentConfig();
  const missingVariables: string[] = [];

  if (!environmentConfig.baseUrl) {
    missingVariables.push("GRAPHDB_BASE_URL");
  }

  if (!environmentConfig.vocabularyPrefixUrl) {
    missingVariables.push("VOCABULARY_PREFIX_URL");
  }

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    if (!environmentConfig.repositoryIds[definition.id]) {
      missingVariables.push(definition.repositoryEnvVar);
    }
  }

  return missingVariables;
};

const TERM_PLACEHOLDER = /\$\{term\}/g;

const buildRepositoryUrl = (
  baseUrl: string,
  repositoryId: string
): string => `${baseUrl}/repositories/${repositoryId}`;

const formatTermForQueryPlaceholder = (term: string): string =>
  term.replace("#", "/").split("/").pop() || "";

const executeVocabularyQuery = async (
  vocabulary: GraphDbVocabularyConfig,
  sparqlQuery: string
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

  return queryExecutor.executeSparqlQuery<unknown>(sparqlQuery);
};

const main = async () => {
  console.info("[graphdb-smoke] Validating GraphDB configuration and connectivity.");

  const missingVariables = getMissingGraphDbEnvironmentVariables();
  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required GraphDB environment variables: ${missingVariables.join(", ")}`
    );
  }

  const environmentConfig = readGraphDbEnvironmentConfig();
  const vocabulariesConfig = buildGraphDbVocabulariesConfig(environmentConfig);
  const vocabulariesData = await fetchVocabulariesData(
    vocabulariesConfig,
    environmentConfig.vocabularyPrefixUrl
  );
  const vocabularyListingLabels = await fetchVocabularyListingLabelsData(
    vocabulariesConfig
  );

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    const results = vocabulariesData[definition.id];
    if (!Array.isArray(results)) {
      throw new Error(`GraphDB query for vocabulary '${definition.id}' did not return an array.`);
    }

    if (results.length === 0) {
      throw new Error(`GraphDB query for vocabulary '${definition.id}' returned no terms.`);
    }

    const schemeLabels = vocabularyListingLabels[definition.id];
    if (!Array.isArray(schemeLabels)) {
      throw new Error(
        `GraphDB vocabulary listing labels for '${definition.id}' did not return an array.`
      );
    }

    if (schemeLabels.length === 0) {
      throw new Error(
        `GraphDB vocabulary listing labels for '${definition.id}' returned no labels.`
      );
    }

    const vocabulary = vocabulariesConfig[definition.id];
    const termStatements = await fetchVocabularyTermsData(
      vocabulary,
      environmentConfig.vocabularyPrefixUrl
    );
    const uniqueTermCount = new Set(termStatements.map((statement) => statement.term)).size;

    if (termStatements.length === 0) {
      throw new Error(
        `GraphDB bulk term query for vocabulary '${definition.id}' returned no statements.`
      );
    }

    if (uniqueTermCount === 0) {
      throw new Error(
        `GraphDB bulk term query for vocabulary '${definition.id}' returned no terms.`
      );
    }

    const sampleTerm = results[0].term;
    const formattedTerm = formatTermForQueryPlaceholder(sampleTerm);
    const { queryBreadcrumbs, queryVocabolo } = getQueryConfig(
      definition.id,
      environmentConfig.vocabularyPrefixUrl
    );
    const breadcrumbsResults = await executeVocabularyQuery(
      vocabulary,
      queryBreadcrumbs.replace(TERM_PLACEHOLDER, formattedTerm)
    );
    const vocaboloResults = await executeVocabularyQuery(
      vocabulary,
      queryVocabolo.replace(TERM_PLACEHOLDER, formattedTerm)
    );

    if (vocaboloResults.length === 0) {
      throw new Error(
        `GraphDB queryVocabolo for vocabulary '${definition.id}' returned no triples for term '${sampleTerm}'.`
      );
    }

    console.info(
      `[graphdb-smoke] ${definition.id} (${vocabulary.repositoryId}): allConcept=${results.length}, bulkStatements=${termStatements.length}, bulkTerms=${uniqueTermCount}, schemeLabels=${schemeLabels.length}, queryBreadcrumbs=${breadcrumbsResults.length}, queryVocabolo=${vocaboloResults.length}, sampleTerm=${sampleTerm}`
    );
  }

  console.info("[graphdb-smoke] GraphDB smoke test completed successfully.");
};

main().catch((error: unknown) => {
  console.error("[graphdb-smoke] GraphDB smoke test failed.", error);
  process.exit(1);
});
