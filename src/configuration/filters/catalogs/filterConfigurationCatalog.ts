import {
  buildTermFilterNarrowersQuery,
  CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
  CHRONOSTRATIGRAPHY_QUERY_OLDER,
  CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
} from "../../graphdb/catalogs/queryCatalog";
import type { PublicVocabularyId } from "../../../types/graphdb/graphDbTypes";
import type {
  FilterConfigurationById,
  VocabularyBackedFilterId,
} from "../../../types/filters/filterConfigurationTypes";

/**
 * Maps public vocabulary ids to the layer filter ids that consume their terms.
 */
export const VOCABULARY_FILTER_IDS: Record<PublicVocabularyId, VocabularyBackedFilterId> = {
  chronostratigraphy: "f-chronostrat-term",
  "tectonic-units": "f-tectonic-term",
  lithostratigraphy: "f-lithostrat-term",
  lithology: "f-lithology-term",
};

/**
 * High-level semantic filter configuration consumed by request validation and
 * filter serialization services.
 */
export const FILTER_CONFIGURATIONS: FilterConfigurationById = {
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
