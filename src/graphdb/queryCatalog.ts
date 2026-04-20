/**
 * @fileoverview Stores the SPARQL query templates reused from the original sandbox GraphDB integration.
 */

import { getGraphDbVocabularyDefinition } from "./vocabularyDefinitions";
import type { PublicVocabularyId, VocabularyQueryConfig } from "./types";

const PREFIX_PLACEHOLDER = /\$\{prefix\}/g;

const buildVocabularyQueryConfig = (uriSegment: string): VocabularyQueryConfig => ({
  allConcept:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?term ?prefLabel\n" +
    "WHERE {\n" +
    " ?term a skos:Concept . \n" +
    " ?term skos:prefLabel ?prefLabel . \n" +
    " FILTER(LANG(?prefLabel) = 'en') \n" +
    "}",
  allTermData:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n\n" +
    "SELECT ?term ?predicate ?object\n" +
    "WHERE {\n" +
    "  ?term a skos:Concept .\n" +
    "  ?term ?predicate ?object .\n" +
    "  FILTER(?predicate IN (skos:prefLabel, skos:definition, skos:broader))\n" +
    "}",
  queryBreadcrumbs:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?narrowerConcept\n" +
    "WHERE {\n" +
    "  ex:${term} skos:broader+ ?narrowerConcept.\n" +
    "}",
  queryVocabolo:
    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
    `PREFIX ex: <\${prefix}/${uriSegment}/>\n\n` +
    "SELECT ?predicate ?object\n" +
    "WHERE {\n" +
    "  ex:${term} ?predicate ?object .\n" +
    "}",
});

const resolvePrefixPlaceholder = (
  query: string,
  vocabularyPrefixUrl: string
): string =>
  query.replace(
    PREFIX_PLACEHOLDER,
    vocabularyPrefixUrl.replace(/\/+$/, "")
  );

/**
 * Builds the SPARQL query set for one public vocabulary and resolves the shared
 * `${prefix}` placeholder against the configured vocabulary base URI.
 */
export const resolveGraphDbQueryConfig = (
  vocabulary: PublicVocabularyId,
  vocabularyPrefixUrl: string
): VocabularyQueryConfig => {
  const definition = getGraphDbVocabularyDefinition(vocabulary);
  const queryConfig = buildVocabularyQueryConfig(definition.uriSegment);

  return {
    allConcept: resolvePrefixPlaceholder(queryConfig.allConcept, vocabularyPrefixUrl),
    allTermData: resolvePrefixPlaceholder(
      queryConfig.allTermData,
      vocabularyPrefixUrl
    ),
    queryBreadcrumbs: resolvePrefixPlaceholder(
      queryConfig.queryBreadcrumbs,
      vocabularyPrefixUrl
    ),
    queryVocabolo: resolvePrefixPlaceholder(
      queryConfig.queryVocabolo,
      vocabularyPrefixUrl
    ),
  };
};

/**
 * Builds the scheme-label query used by `/vocabularies` to resolve the public
 * vocabulary name from the configured `skos:ConceptScheme`.
 */
export const buildVocabularyListingSchemeLabelsQuery = (
  schemeUri: string
): string =>
  "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n\n" +
  "SELECT ?prefLabel\n" +
  "WHERE {\n" +
  `  <${schemeUri}> skos:prefLabel ?prefLabel .\n` +
  "}";
