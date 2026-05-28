/**
 * @fileoverview Provides the internal semantic GraphDB resolution helpers that
 * will be reused by future WMS filter execution.
 */

import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../../configuration/graphdb/configuration";
import {
  inferVocabularyIdFromTermUri,
} from "./vocabularyDefinitionRegistry";
import type { PublicVocabularyId } from "../../types/graphdb/vocabularyDefinitionTypes";
import {
  getFilterConfigurationById,
  getTermFilterConfigurationByVocabularyId,
} from "../filters/filterConfigurationRegistry";
import type { TermVocabularyId } from "../../types/filters/filterConfigurationTypes";
import { fetchVocabularyConceptsData } from "../../libs/graphDbWrapper";
import type {
  ChronostratigraphyResolutionRequest,
  SemanticConceptQueryExecutor,
} from "../../types/graphdb/filterSemanticResolverTypes";

const PLACEHOLDER_PATTERN = /\$\{([A-Za-z0-9_]+)\}/g;

const normalizeVocabularyPrefixUrl = (vocabularyPrefixUrl: string): string => {
  const normalized = vocabularyPrefixUrl.trim().replace(/\/+$/, "");

  if (!normalized) {
    throw new Error("Missing GraphDB vocabulary prefix URL for semantic filter resolution.");
  }

  return normalized;
};

/**
 * Converts a full term URI into the identifier expected by the static SPARQL
 * templates after first proving that the URI belongs to the requested
 * vocabulary. This keeps semantic filters from mixing terms across catalogs.
 */
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

/**
 * Applies the small placeholder language used by filter query templates.
 * Missing replacements are treated as configuration errors so malformed SPARQL
 * does not reach GraphDB silently.
 */
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
 * Creates the default GraphDB-backed executor used by the semantic resolver.
 * The resolver itself only builds vocabulary-specific SPARQL; this executor is
 * the boundary that reads environment configuration, selects the target GraphDB
 * repository, and delegates result-shape validation to the wrapper.
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

/**
 * Resolves narrower concepts for a vocabulary-backed term filter.
 *
 * Flow:
 * 1. `getTermFilterConfigurationByVocabularyId` selects the static query
 *    template for the requested vocabulary.
 * 2. `normalizeVocabularyPrefixUrl` trims the runtime GraphDB vocabulary base
 *    URL and fails early if it is missing.
 * 3. `formatTermForQueryPlaceholder` proves that the incoming term URI belongs
 *    to the same vocabulary and extracts the concept id used by the SPARQL
 *    template.
 * 4. `resolveQueryTemplate` fills `${prefix}` and `${term}` placeholders.
 * 5. The injected/default executor sends the final query to GraphDB and returns
 *    concept URIs from the `?concept` binding.
 *
 * The returned URIs are not converted to CQL here; term filter services merge
 * them with the selected term, then WMS constraint generation decides the final
 * GeoServer syntax.
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
 *
 * Flow:
 * - `between` uses the configured between template and validates both older and
 *   younger boundary term URIs;
 * - `younger` uses the younger template and validates the `to` term;
 * - `older` uses the older template and validates the `from` term.
 *
 * All paths normalize the same runtime prefix, expand the selected template, and
 * execute against the chronostratigraphy repository. The result is the expanded
 * set of interval concept URIs that the chronostratigraphy filter service later
 * maps to configured layer `from`/`to` attributes.
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
