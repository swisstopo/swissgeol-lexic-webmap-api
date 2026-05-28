/**
 * @fileoverview Service helpers for vocabulary-related response payloads.
 */

import {
  VOCABULARY_TERM_DETAILS,
} from "../../data/mockData";
import { getVocabularyFilterId } from "../filters/filterConfigurationRegistry";
import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../../configuration/graphdb/configuration";
import {
  getGraphDbVocabularyDefinition,
  isPublicVocabularyId,
} from "../graphdb/vocabularyDefinitionRegistry";
import { GRAPHDB_VOCABULARY_DEFINITIONS } from "../../configuration/graphdb/catalogs/vocabularyDefinitionsCatalog";
import type { GraphDbVocabularyLabel, PublicVocabularyId } from "../../types/graphdb/graphDbTypes";
import {
  getLayerConfigurationById,
  getLayerIdsSupportingFilterId,
} from "../layers/layerConfigurationRegistry";
import { fetchVocabularyListingLabelsData } from "../../libs/graphDbWrapper";
import {
  DEFAULT_VOCABULARY_LANGUAGE,
  resolveLocalizedGraphDbText,
  resolveVocabularyLanguage,
} from "../shared/languageParametersService";
import type {
  VocabularyTermsResponse,
} from "../../types/vocabularies/vocabularyTermsTypes";
import type {
  VocabulariesResponse,
  VocabularyLayersResponse,
} from "../../types/vocabularies/vocabularyServiceTypes";
import type { VocabularyWarningLogger } from "../../types/vocabularies/vocabularyServiceInternalTypes";

/**
 * Resolves the display name for one vocabulary in the `/vocabularies` response.
 * GraphDB supplies localized concept-scheme labels; this function applies the
 * shared language fallback policy and emits warnings when the API has to fall
 * back to English or the configured catalog name.
 */
export const resolveVocabularyListingName = (
  vocabularyId: PublicVocabularyId,
  labels: GraphDbVocabularyLabel[],
  language?: string,
  logger?: VocabularyWarningLogger
): string => {
  const definition = getGraphDbVocabularyDefinition(vocabularyId);
  const resolution = resolveLocalizedGraphDbText(labels, language, {
    fallbackText: definition.defaultNameEn,
  });

  if (resolution.source === "en") {
    logger?.warn(
      {
        vocabularyId,
        requestedLang: resolution.resolvedLanguage,
        fallbackSource: "en",
      },
      "Falling back while resolving vocabulary listing label."
    );
  } else if (resolution.source === "fallback") {
    logger?.warn(
      {
        vocabularyId,
        requestedLang: resolution.resolvedLanguage,
        fallbackSource: "config",
      },
      "Falling back while resolving vocabulary listing label."
    );
  }

  return resolution.text;
};

/**
 * Builds the static vocabulary listing used by non-GraphDB compatibility paths.
 * It mirrors the public contract of `/vocabularies` but uses catalog defaults
 * instead of remote concept-scheme labels.
 */
export const getVocabulariesResponse = (): VocabulariesResponse => ({
  vocabularies: GRAPHDB_VOCABULARY_DEFINITIONS.map((definition) => ({
    id: definition.id,
    name: definition.defaultNameEn,
  })),
});

/**
 * Builds the GraphDB-backed `/vocabularies` payload.
 *
 * Flow:
 * 1. Read GraphDB runtime configuration from environment variables.
 * 2. Expand that shared configuration into one repository config per public
 *    vocabulary.
 * 3. Fetch localized `skos:prefLabel` values for every configured vocabulary
 *    listing scheme.
 * 4. For each public vocabulary, call `resolveVocabularyListingName` so the
 *    requested language, English fallback, and configured-name fallback all use
 *    the same policy and logging context.
 *
 * The response order is controlled by `GRAPHDB_VOCABULARY_DEFINITIONS`, not by
 * GraphDB result ordering.
 */
export const getGraphDbVocabulariesResponse = async (
  language?: string,
  logger?: VocabularyWarningLogger
): Promise<VocabulariesResponse> => {
  const environmentConfig = readGraphDbEnvironmentConfig();
  const vocabulariesConfig = buildGraphDbVocabulariesConfig(environmentConfig);
  const vocabularyLabels = await fetchVocabularyListingLabelsData(vocabulariesConfig);

  return {
    vocabularies: GRAPHDB_VOCABULARY_DEFINITIONS.map((definition) => {
      const labels = vocabularyLabels[definition.id];
      if (!labels) {
        throw new Error(
          `Missing GraphDB vocabulary labels for '${definition.id}'.`
        );
      }

      return {
        id: definition.id,
        name: resolveVocabularyListingName(
          definition.id,
          labels,
          language,
          logger
        ),
      };
    }),
  };
};

/**
 * Builds the legacy mock `/vocabularies/{vocabulary}/terms` response. This path
 * exists alongside the GraphDB-backed terms service and uses the same language
 * normalization so endpoint behavior stays aligned during migration.
 */
export const getVocabularyTerms = (
  vocabularyId: string,
  language?: string
): VocabularyTermsResponse | null => {
  const terms = VOCABULARY_TERM_DETAILS[vocabularyId];
  if (!terms) return null;

  const resolvedLanguage = resolveVocabularyLanguage(language);

  return {
    terms: terms.map((termDefinition) => {
      const translation =
        termDefinition.translations[resolvedLanguage] ??
        termDefinition.translations[DEFAULT_VOCABULARY_LANGUAGE];
      if (!translation) {
        throw new Error(
          `Missing mock translation for term '${termDefinition.term}' in vocabulary '${vocabularyId}'.`
        );
      }

      return {
        term: termDefinition.term,
        label: translation.label,
        description: translation.description,
        breadcrumbs: translation.breadcrumbs,
      };
    }),
  };
};

/**
 * Resolves the configured layers that support the public vocabulary requested
 * by `/vocabularies/{vocabulary}/layers`.
 *
 * Flow:
 * 1. Reject unknown vocabulary ids with `null`; the controller maps that to 404.
 * 2. Map vocabulary id to public filter id through `getVocabularyFilterId`.
 * 3. Ask the layer registry which configured layers advertise that filter.
 * 4. Read each layer configuration to return the public `{ id, name }` pair.
 *
 * The function does not inspect GraphDB. Vocabulary-to-layer support is a static
 * application catalog concern.
 */
export const getVocabularyLayers = (
  vocabularyId: string
): VocabularyLayersResponse | null => {
  if (!isPublicVocabularyId(vocabularyId)) {
    return null;
  }

  const filterId = getVocabularyFilterId(vocabularyId);
  const layers = getLayerIdsSupportingFilterId(filterId).map((layerId) => {
    const layer = getLayerConfigurationById(layerId);

    if (!layer) {
      throw new Error(
        `Missing layer configuration for vocabulary-layer mapping '${layerId}'.`
      );
    }

    return { id: layer.id, name: layer.name };
  });

  return { layers };
};
