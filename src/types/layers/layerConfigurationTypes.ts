import type { LayerFilterId } from "./layerFilterTypes";
import type { LayerWmtsSourceConfig } from "../wmts/wmtsSourceTypes";

export interface LayerAttributeSourceConfig {
  typeName: string;
}

export interface LayerChronostratigraphyFilterConfiguration {
  columnToFilterOld: string;
  columnToFilterYon: string;
}

export interface LayerTermFilterConfiguration {
  attributeToFilter: string[];
}

export interface LayerByAttributeFilterConfiguration {
  /**
   * Attributes reserved for semantic filters and therefore excluded from the
   * generic "filter by attribute" UI/runtime path.
   */
  excludedAttributes: string[];
}

/**
 * Layer-specific filter configuration derived from the sandbox. This stores the
 * columns and exclusions that depend on the target layer, not on the generic
 * filter type itself.
 */
export interface LayerFilterConfiguration {
  "f-chronostrat-term"?: LayerChronostratigraphyFilterConfiguration;
  "f-tectonic-term"?: LayerTermFilterConfiguration;
  "f-lithostrat-term"?: LayerTermFilterConfiguration;
  "f-lithology-term"?: LayerTermFilterConfiguration;
  "f-byAttribute"?: LayerByAttributeFilterConfiguration;
}

export interface LayerConfiguration {
  id: string;
  name: string;
  filterable: boolean;
  filterIds: LayerFilterId[];
  attributeSource?: LayerAttributeSourceConfig;
  filterConfiguration?: LayerFilterConfiguration;
  wmtsSource?: LayerWmtsSourceConfig;
}
