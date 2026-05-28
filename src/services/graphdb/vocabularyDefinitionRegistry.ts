import { GRAPHDB_VOCABULARY_DEFINITIONS } from "../../configuration/graphdb/catalogs/vocabularyDefinitionsCatalog";
import type {
  GraphDbVocabularyDefinition,
  PublicVocabularyId,
} from "../../types/graphdb/vocabularyDefinitionTypes";

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

/**
 * Builds the preferred base URL for term URI validation from the active GraphDB
 * prefix configuration. Invalid or missing runtime prefixes are ignored so the
 * registry can still fall back to the static catalog scheme URIs.
 */
const buildConfiguredVocabularyBaseUrl = (
  vocabularyPrefixUrl: string,
  uriSegment: string
): URL | null => {
  const normalizedPrefixUrl = trimTrailingSlashes(vocabularyPrefixUrl.trim());
  if (!normalizedPrefixUrl) {
    return null;
  }

  try {
    return new URL(`${normalizedPrefixUrl}/${uriSegment}/`);
  } catch {
    return null;
  }
};

/**
 * Derives a vocabulary base URL from the catalog listing scheme. This fallback
 * keeps URI inference stable for tests and data that uses the canonical
 * SwissGeol origins instead of the configured GraphDB prefix.
 */
const buildFallbackVocabularyBaseUrl = (
  vocabularyListingSchemeUri: string,
  uriSegment: string
): URL => {
  const listingSchemeUrl = new URL(vocabularyListingSchemeUri);
  return new URL(`/${uriSegment}/`, listingSchemeUrl.origin);
};

/**
 * Checks whether a term URL is a direct concept URI below a vocabulary base.
 * Query strings, hash fragments, the base URL itself, and nested paths are
 * rejected because semantic filters expect one concrete concept identifier.
 */
const matchesVocabularyBaseUrl = (termUrl: URL, vocabularyBaseUrl: URL): boolean => {
  if (
    termUrl.origin !== vocabularyBaseUrl.origin ||
    termUrl.search ||
    termUrl.hash
  ) {
    return false;
  }

  const normalizedBasePath = trimTrailingSlashes(vocabularyBaseUrl.pathname);
  const normalizedTermPath = trimTrailingSlashes(termUrl.pathname);
  if (
    !normalizedBasePath ||
    normalizedTermPath === normalizedBasePath ||
    !normalizedTermPath.startsWith(`${normalizedBasePath}/`)
  ) {
    return false;
  }

  const conceptPath = normalizedTermPath.slice(normalizedBasePath.length + 1);
  return conceptPath.length > 0 && !conceptPath.includes("/");
};

/**
 * Checks whether an arbitrary string matches one of the public vocabulary ids
 * exposed by the API and supported by the backend. The static definition
 * catalog remains the single source of truth for public vocabulary membership.
 */
export const isPublicVocabularyId = (
  vocabularyId: string
): vocabularyId is PublicVocabularyId =>
  GRAPHDB_VOCABULARY_DEFINITIONS.some(
    (definition) => definition.id === vocabularyId
  );

/**
 * Infers the public vocabulary id from a full SwissGeol term URI when the URI
 * belongs to one of the vocabularies supported by the backend. When a valid
 * GraphDB prefix URL is provided, it is used as the primary accepted URI base;
 * otherwise the catalog scheme URI fallback preserves compatibility with
 * canonical term URLs.
 */
export const inferVocabularyIdFromTermUri = (
  termUri: string,
  vocabularyPrefixUrl = ""
): PublicVocabularyId | null => {
  let parsedTermUrl: URL;
  try {
    parsedTermUrl = new URL(termUri);
  } catch {
    return null;
  }

  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    const configuredBaseUrl = buildConfiguredVocabularyBaseUrl(
      vocabularyPrefixUrl,
      definition.uriSegment
    );
    if (configuredBaseUrl && matchesVocabularyBaseUrl(parsedTermUrl, configuredBaseUrl)) {
      return definition.id;
    }

    const fallbackBaseUrl = buildFallbackVocabularyBaseUrl(
      definition.vocabularyListingSchemeUri,
      definition.uriSegment
    );
    if (matchesVocabularyBaseUrl(parsedTermUrl, fallbackBaseUrl)) {
      return definition.id;
    }
  }

  return null;
};

/**
 * Resolves the full GraphDB metadata for one supported public vocabulary id.
 * Services use this helper instead of reading the catalog directly so unknown
 * ids fail consistently at the GraphDB-domain boundary.
 */
export const getGraphDbVocabularyDefinition = (
  vocabularyId: PublicVocabularyId
): GraphDbVocabularyDefinition => {
  for (const definition of GRAPHDB_VOCABULARY_DEFINITIONS) {
    if (definition.id === vocabularyId) {
      return definition;
    }
  }

  throw new Error(`Unsupported GraphDB vocabulary '${vocabularyId}'.`);
};
