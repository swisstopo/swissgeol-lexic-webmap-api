/**
 * @fileoverview Defines the supported vocabularies and their GraphDB-specific metadata in a single place.
 */

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

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

const buildFallbackVocabularyBaseUrl = (
  vocabularyListingSchemeUri: string,
  uriSegment: string
): URL => {
  const listingSchemeUrl = new URL(vocabularyListingSchemeUri);
  return new URL(`/${uriSegment}/`, listingSchemeUrl.origin);
};

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

export const GRAPHDB_VOCABULARY_DEFINITIONS = [
  {
    id: "chronostratigraphy",
    uriSegment: "Chronostratigraphy",
    repositoryEnvVar: "CHRONOSTRATIGRAPHY_REPO_ID",
    defaultNameEn: "Chronostratigraphy",
    vocabularyListingSchemeUri:
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy",
  },
  {
    id: "tectonic-units",
    uriSegment: "TectonicUnits",
    repositoryEnvVar: "TECTONICUNITS_REPO_ID",
    defaultNameEn: "Tectonic Units",
    vocabularyListingSchemeUri: "https://dev-lexic.swissgeol.ch/TectonicUnits",
  },
  {
    id: "lithostratigraphy",
    uriSegment: "Lithostratigraphy",
    repositoryEnvVar: "LITHOSTRATIGRAPHY_REPO_ID",
    defaultNameEn: "Lithostratigraphy",
    vocabularyListingSchemeUri:
      "https://dev-lexic.swissgeol.ch/Lithostratigraphy/LithostratigraphicUnits",
  },
  {
    id: "lithology",
    uriSegment: "Lithology",
    repositoryEnvVar: "LITHOLOGY_REPO_ID",
    defaultNameEn: "Lithology",
    vocabularyListingSchemeUri: "https://dev-lexic.swissgeol.ch/Lithology/",
  },
] as const;

export type GraphDbVocabularyDefinition =
  (typeof GRAPHDB_VOCABULARY_DEFINITIONS)[number];

export type PublicVocabularyId = GraphDbVocabularyDefinition["id"];

/**
 * Checks whether an arbitrary string matches one of the public vocabulary ids
 * exposed by the API and supported by the backend.
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
 * GraphDB prefix URL is provided, it is used as the primary accepted URI base.
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
