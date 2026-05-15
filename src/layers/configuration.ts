/**
 * @fileoverview Minimal backend layer configuration derived from the current
 * WebMap Sandbox baseline. The shape intentionally excludes hierarchy and
 * filter-layer overlays, but keeps the layer-specific filter bindings required
 * by filter discovery/defaulting and the future WMS implementation.
 */

import type { LayerFilterId } from "./filterCatalog";

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
}

const LAYER_CONFIGURATIONS: LayerConfiguration[] = [
  {
    id: "tecto_units_augm",
    name: "Tectonic Units",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-tectonic-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "tecto_units_augm",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-tectonic-term": {
        attributeToFilter: ["tecto_lexic"],
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
          "tecto_lexic",
        ],
      },
    },
  },
  {
    id: "gc_bedrock",
    name: "GC_BEDROCK",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-tectonic-term",
      "f-lithostrat-term",
      "f-lithology-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "gc_bedrock",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-tectonic-term": {
        attributeToFilter: ["tecto_lexic"],
      },
      "f-lithostrat-term": {
        attributeToFilter: ["litstrat_lexic"],
      },
      "f-lithology-term": {
        attributeToFilter: [
          "litho_lexic_1",
          "litho_lexic_2",
          "litho_lexic_3",
        ],
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
          "tecto_lexic",
          "litstrat_lexic",
          "litho_lexic_1",
          "litho_lexic_2",
          "litho_lexic_3",
        ],
      },
    },
  },
  {
    id: "gc_unco_deposits",
    name: "GC_UNCO_DEPOSITS",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "gc_unco_deposits",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
        ],
      },
    },
  },
];

export const getAllLayerConfigurations = (): LayerConfiguration[] =>
  LAYER_CONFIGURATIONS;

export const getFilterableLayerConfigurations = (): LayerConfiguration[] =>
  LAYER_CONFIGURATIONS.filter((configuration) => configuration.filterable);

/**
 * Resolves one configured layer by id from the static backend layer registry.
 */
export const getLayerConfigurationById = (
  layerId: string
): LayerConfiguration | undefined =>
  LAYER_CONFIGURATIONS.find((entry) => entry.id === layerId);

export const getConfigurationLayerById = getLayerConfigurationById;

export const supportsAttributeList = (layerId: string): boolean =>
  Boolean(getLayerConfigurationById(layerId)?.attributeSource);

/**
 * Lists all configured layers that support the provided public filter id.
 */
export const getLayerIdsSupportingFilterId = (
  filterId: LayerFilterId
): string[] =>
  LAYER_CONFIGURATIONS.filter((configuration) =>
    configuration.filterIds.includes(filterId)
  ).map((configuration) => configuration.id);
