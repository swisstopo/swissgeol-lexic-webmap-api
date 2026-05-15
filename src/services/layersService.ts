/**
 * @fileoverview Service helpers for layer-related response payloads.
 */

import {
  LAYERS,
  LayerDefinition,
} from "../data/mockData";
import {
  getVocabularyFilterId,
  isTermFilterId,
  type TermFilterId,
} from "../filters/configuration";
import { readGraphDbEnvironmentConfig } from "../graphdb/configuration";
import { inferVocabularyIdFromTermUri } from "../graphdb/vocabularyDefinitions";
import {
  getFilterableLayerConfigurations,
  getLayerConfigurationById,
  type LayerConfiguration,
} from "../layers/configuration";
import {
  LAYER_FILTER_CATALOG,
  type LayerFilterDefinition,
} from "../layers/filterCatalog";
import { WEBMAP_ID } from "../webmap/constants";

/**
 * Public layer representation exposed by layer listing endpoints.
 */
export interface LayerAvailableFilterSummary {
  id: string;
  name: string;
  title: string;
  description: string;
}

export interface LayerSummary {
  id: string;
  name: string;
  filterable: boolean;
  availableFilters: LayerAvailableFilterSummary[];
}

/**
 * Response contract for layer listing endpoints.
 */
export interface LayersResponse {
  webmapId: string;
  layers: LayerSummary[];
}

/**
 * Response contract for layer filter endpoints.
 */
export interface LayerFiltersResponse {
  layerId: string;
  filters: LayerFilterDefinition[];
}

/**
 * Response contract for layer attribute endpoints.
 */
export interface LayerAttributesResponse {
  layerId: string;
  attributes: string[];
}

export interface DefaultByTermsFilter {
  filterId: TermFilterId;
  parameters: {
    term: string;
    includeNarrowers: true;
  };
}

export interface DefaultFiltersResponse {
  layerId: string;
  filters: DefaultByTermsFilter[];
}

export interface LayerServiceError {
  statusCode: number;
  message: string;
}

export type DefaultFiltersResult =
  | { response: DefaultFiltersResponse; error?: undefined }
  | { response?: undefined; error: LayerServiceError };

const UNSUPPORTED_TERM_MESSAGE =
  "Layer does not support the vocabulary inferred from the provided term";

const toConfiguredLayerSummary = (layer: LayerConfiguration): LayerSummary => ({
  id: layer.id,
  name: layer.name,
  filterable: layer.filterable,
  availableFilters: layer.filterIds.map((filterId) => ({
    id: filterId,
    name: LAYER_FILTER_CATALOG[filterId].name,
    title: LAYER_FILTER_CATALOG[filterId].title,
    description: LAYER_FILTER_CATALOG[filterId].description,
  })),
});

export const getLayersResponse = (): LayersResponse => ({
  webmapId: WEBMAP_ID,
  layers: getFilterableLayerConfigurations().map(toConfiguredLayerSummary),
});

export const getMockLayerById = (layerId: string): LayerDefinition | undefined =>
  LAYERS.find((layer) => layer.id === layerId);

/**
 * Resolves the public filter metadata exposed by `/layers/{layerId}/filters`.
 * Returns `null` when the layer is not part of the configured filterable layer registry.
 */
export const getLayerFiltersResponse = (
  layerId: string
): LayerFiltersResponse | null => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer) return null;

  return {
    layerId: layer.id,
    filters: layer.filterIds.map((filterId) => LAYER_FILTER_CATALOG[filterId]),
  };
};

export const getMockLayerAttributesResponse = (
  layerId: string
): LayerAttributesResponse | null => {
  const layer = getMockLayerById(layerId);
  if (!layer) return null;

  return {
    layerId: layer.id,
    attributes: layer.attributes,
  };
};

export const getDefaultFiltersResponse = (
  layerId: string,
  term: string
): DefaultFiltersResult => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer) {
    return {
      error: {
        statusCode: 404,
        message: "Layer not found",
      },
    };
  }

  const vocabularyId = inferVocabularyIdFromTermUri(
    term,
    readGraphDbEnvironmentConfig().vocabularyPrefixUrl
  );
  if (!vocabularyId) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  const filterId = getVocabularyFilterId(vocabularyId);
  if (!filterId || !layer.filterIds.includes(filterId)) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  if (vocabularyId === "chronostratigraphy") {
    return {
      response: {
        layerId: layer.id,
        filters: [],
      },
    };
  }

  if (!isTermFilterId(filterId)) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  return {
    response: {
      layerId: layer.id,
      filters: [
        {
          filterId,
          parameters: {
            term,
            includeNarrowers: true,
          },
        },
      ],
    },
  };
};
