import { buildVocabularyQueryConfig } from "../../configuration/graphdb/catalogs/queryCatalog";
import type { PublicVocabularyId, VocabularyQueryConfig } from "../../types/graphdb/graphDbTypes";
import { getGraphDbVocabularyDefinition } from "./vocabularyDefinitionRegistry";

const PREFIX_PLACEHOLDER = /\$\{prefix\}/g;

/**
 * Resolves the shared vocabulary-base placeholder used by static SPARQL query
 * catalogs. The catalog owns query shape; this registry only adapts it to the
 * deployment-specific GraphDB vocabulary URI prefix.
 */
const resolvePrefixPlaceholder = (
  query: string,
  vocabularyPrefixUrl: string
): string =>
  query.replace(
    PREFIX_PLACEHOLDER,
    vocabularyPrefixUrl.replace(/\/+$/, "")
  );

/**
 * Builds the SPARQL query set for one public vocabulary. This is the bridge
 * between immutable catalog definitions and runtime GraphDB configuration:
 * callers request a supported vocabulary id and receive concrete query strings
 * with the configured vocabulary prefix already applied.
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
