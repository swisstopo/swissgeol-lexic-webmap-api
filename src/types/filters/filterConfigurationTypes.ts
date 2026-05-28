import type { PublicVocabularyId } from "../graphdb/graphDbTypes";
import type { LayerFilterId } from "../layers/layerFilterTypes";

export type TermVocabularyId = Exclude<PublicVocabularyId, "chronostratigraphy">;
export type TermFilterId = Exclude<
  LayerFilterId,
  "f-chronostrat-term" | "f-byAttribute"
>;
export type VocabularyBackedFilterId = Exclude<LayerFilterId, "f-byAttribute">;

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
