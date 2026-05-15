/**
 * @fileoverview Backend filter-type configuration derived from the current
 * WebMap Sandbox behavior. This module defines how each filter works, while
 * the layer registry owns which layers support which filters.
 */

import type { PublicVocabularyId } from "../graphdb/types";
import {
  buildTermFilterNarrowersQuery,
  CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
  CHRONOSTRATIGRAPHY_QUERY_OLDER,
  CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
} from "../graphdb/queryCatalog";
import type { LayerFilterId } from "../layers/filterCatalog";

export type TermVocabularyId = Exclude<PublicVocabularyId, "chronostratigraphy">;
export type TermFilterId = Exclude<
  LayerFilterId,
  "f-chronostrat-term" | "f-byAttribute"
>;
type VocabularyBackedFilterId = Exclude<LayerFilterId, "f-byAttribute">;

/**
 * Shared behavior of the chronostratigraphy semantic filter.
 */
export interface ChronostratigraphyFilterConfiguration {
  filterId: "f-chronostrat-term";
  vocabularyId: "chronostratigraphy";
  queryYounger: string;
  queryOlder: string;
  queryBetween: string;
}

/**
 * Shared behavior of the term-based semantic filters.
 */
export interface TermFilterConfiguration<
  TVocabularyId extends TermVocabularyId = TermVocabularyId,
  TFilterId extends TermFilterId = TermFilterId,
> {
  filterId: TFilterId;
  vocabularyId: TVocabularyId;
  queryNarrower: string;
}

/**
 * Shared behavior of the generic key/value filter.
 */
export interface ByAttributeFilterConfiguration {
  filterId: "f-byAttribute";
}

/**
 * Filter configuration indexed by the public filter ids exposed by the API.
 */
export interface FilterConfigurationById {
  "f-chronostrat-term": ChronostratigraphyFilterConfiguration;
  "f-tectonic-term": TermFilterConfiguration<"tectonic-units", "f-tectonic-term">;
  "f-lithostrat-term": TermFilterConfiguration<
    "lithostratigraphy",
    "f-lithostrat-term"
  >;
  "f-lithology-term": TermFilterConfiguration<"lithology", "f-lithology-term">;
  "f-byAttribute": ByAttributeFilterConfiguration;
}

export type FilterConfiguration = FilterConfigurationById[LayerFilterId];
export type AnyTermFilterConfiguration = FilterConfigurationById[TermFilterId];

const VOCABULARY_FILTER_IDS: Record<PublicVocabularyId, VocabularyBackedFilterId> = {
  chronostratigraphy: "f-chronostrat-term",
  "tectonic-units": "f-tectonic-term",
  lithostratigraphy: "f-lithostrat-term",
  lithology: "f-lithology-term",
};

const FILTER_CONFIGURATIONS: FilterConfigurationById = {
  "f-chronostrat-term": {
    filterId: "f-chronostrat-term",
    vocabularyId: "chronostratigraphy",
    queryYounger: CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
    queryOlder: CHRONOSTRATIGRAPHY_QUERY_OLDER,
    queryBetween: CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
  },
  "f-tectonic-term": {
    filterId: "f-tectonic-term",
    vocabularyId: "tectonic-units",
    queryNarrower: buildTermFilterNarrowersQuery("tectonic-units"),
  },
  "f-lithostrat-term": {
    filterId: "f-lithostrat-term",
    vocabularyId: "lithostratigraphy",
    queryNarrower: buildTermFilterNarrowersQuery("lithostratigraphy"),
  },
  "f-lithology-term": {
    filterId: "f-lithology-term",
    vocabularyId: "lithology",
    queryNarrower: buildTermFilterNarrowersQuery("lithology"),
  },
  "f-byAttribute": {
    filterId: "f-byAttribute",
  },
};

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
