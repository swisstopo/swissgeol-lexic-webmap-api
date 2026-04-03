/**
 * @fileoverview Service helpers for layer-related response payloads.
 */

import {
  FILTER_CATALOG,
  LAYERS,
  VOCABULARY_FILTER_MAP,
  VOCABULARY_TERMS,
  WEBMAP_ID,
  FilterDefinition,
  FilterId,
  LayerDefinition,
} from "../data/mockData";

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
  filters: FilterDefinition[];
}

/**
 * Response contract for layer attribute endpoints.
 */
export interface LayerAttributesResponse {
  layerId: string;
  attributes: string[];
}

type DefaultFilterId = Exclude<FilterId, "f-chronostrat-term" | "f-byAttribute">;

export interface DefaultByTermsFilter {
  filterId: DefaultFilterId;
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

const TERM_FILTER_IDS = new Set<DefaultFilterId>([
  "f-tectonic-term",
  "f-lithostrat-term",
  "f-lithology-term",
]);

const isDefaultFilterId = (filterId: FilterId): filterId is DefaultFilterId =>
  TERM_FILTER_IDS.has(filterId as DefaultFilterId);

const getVocabularyIdForTerm = (term: string): string | null => {
  for (const [vocabularyId, terms] of Object.entries(VOCABULARY_TERMS)) {
    if (terms.includes(term)) {
      return vocabularyId;
    }
  }

  return null;
};

const toLayerSummary = (layer: LayerDefinition): LayerSummary => ({
  id: layer.id,
  name: layer.name,
  filterable: layer.filterable,
  availableFilters: layer.filterIds.map((filterId) => ({
    id: filterId,
    name: FILTER_CATALOG[filterId].name,
    title: FILTER_CATALOG[filterId].title,
    description: FILTER_CATALOG[filterId].description,
  })),
});

export const getLayersResponse = (): LayersResponse => ({
  webmapId: WEBMAP_ID,
  layers: LAYERS.map(toLayerSummary),
});

export const getLayerById = (layerId: string): LayerDefinition | undefined =>
  LAYERS.find((layer) => layer.id === layerId);

export const getLayerFiltersResponse = (
  layerId: string
): LayerFiltersResponse | null => {
  const layer = getLayerById(layerId);
  if (!layer) return null;

  return {
    layerId: layer.id,
    filters: layer.filterIds.map((filterId) => FILTER_CATALOG[filterId]),
  };
};

export const getLayerAttributesResponse = (
  layerId: string
): LayerAttributesResponse | null => {
  const layer = getLayerById(layerId);
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
  const layer = getLayerById(layerId);
  if (!layer) {
    return {
      error: {
        statusCode: 404,
        message: "Layer not found",
      },
    };
  }

  const vocabularyId = getVocabularyIdForTerm(term);
  if (!vocabularyId) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  const filterId = VOCABULARY_FILTER_MAP[vocabularyId];
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

  if (!isDefaultFilterId(filterId)) {
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
