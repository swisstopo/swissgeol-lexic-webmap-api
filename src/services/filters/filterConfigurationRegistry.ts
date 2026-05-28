import type { PublicVocabularyId } from "../../types/graphdb/graphDbTypes";
import type { LayerFilterId } from "../../types/layers/layerFilterTypes";
import {
  FILTER_CONFIGURATIONS,
  VOCABULARY_FILTER_IDS,
} from "../../configuration/filters/catalogs/filterConfigurationCatalog";
import type {
  AnyTermFilterConfiguration,
  ByAttributeFilterConfiguration,
  ChronostratigraphyFilterConfiguration,
  FilterConfiguration,
  TermFilterConfiguration,
  TermFilterId,
  TermVocabularyId,
  VocabularyBackedFilterId,
} from "../../types/filters/filterConfigurationTypes";

/**
 * Returns the complete static filter configuration catalog keyed by the public
 * filter ids exposed by the API.
 */
export const getAllFilterConfigurations = (): FilterConfiguration[] =>
  Object.values(FILTER_CONFIGURATIONS);

/**
 * Resolves one filter configuration by its public API id.
 */
export function getFilterConfigurationById(
  filterId: "f-chronostrat-term"
): ChronostratigraphyFilterConfiguration;
export function getFilterConfigurationById(
  filterId: "f-tectonic-term"
): TermFilterConfiguration<"tectonic-units", "f-tectonic-term">;
export function getFilterConfigurationById(
  filterId: "f-lithostrat-term"
): TermFilterConfiguration<"lithostratigraphy", "f-lithostrat-term">;
export function getFilterConfigurationById(
  filterId: "f-lithology-term"
): TermFilterConfiguration<"lithology", "f-lithology-term">;
export function getFilterConfigurationById(
  filterId: "f-byAttribute"
): ByAttributeFilterConfiguration;
export function getFilterConfigurationById(
  filterId: LayerFilterId
): FilterConfiguration;
export function getFilterConfigurationById(
  filterId: LayerFilterId
): FilterConfiguration {
  const configuration = FILTER_CONFIGURATIONS[filterId];

  if (!configuration) {
    throw new Error(`Missing backend filter configuration for '${filterId}'.`);
  }

  return configuration;
};

/**
 * Maps a public vocabulary id to the filter id that uses that vocabulary.
 */
export const getVocabularyFilterId = (
  vocabularyId: PublicVocabularyId
): VocabularyBackedFilterId => VOCABULARY_FILTER_IDS[vocabularyId];

export const isTermFilterId = (filterId: LayerFilterId): filterId is TermFilterId =>
  "queryNarrower" in FILTER_CONFIGURATIONS[filterId];

/**
 * Resolves one reusable term-filter configuration by its public API id.
 */
export const getTermFilterConfigurationById = (
  filterId: TermFilterId
): AnyTermFilterConfiguration => FILTER_CONFIGURATIONS[filterId];

/**
 * Resolves the reusable term-filter configuration behind one term vocabulary.
 */
export const getTermFilterConfigurationByVocabularyId = (
  vocabularyId: TermVocabularyId
): AnyTermFilterConfiguration => {
  const filterId = getVocabularyFilterId(vocabularyId);

  if (!isTermFilterId(filterId)) {
    throw new Error(`Vocabulary '${vocabularyId}' does not use a term filter.`);
  }

  return getTermFilterConfigurationById(filterId);
};

/**
 * Infers the vocabulary behind a public filter id when that filter is backed
 * by a vocabulary. Returns `null` for non-vocabulary filters like by-attribute.
 */
export const getVocabularyIdByFilterId = (
  filterId: LayerFilterId
): PublicVocabularyId | null => {
  for (const [vocabularyId, configuredFilterId] of Object.entries(
    VOCABULARY_FILTER_IDS
  ) as Array<[PublicVocabularyId, VocabularyBackedFilterId]>) {
    if (configuredFilterId === filterId) {
      return vocabularyId;
    }
  }

  return null;
};
