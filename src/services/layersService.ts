/**
 * @fileoverview Service helpers for layer-related response payloads.
 */

import {
  FILTER_CATALOG,
  LAYERS,
  WEBMAP_ID,
  FilterDefinition,
  LayerDefinition,
} from "../data/mockData";

/**
 * Public layer representation exposed by layer listing endpoints.
 */
export interface LayerSummary {
  id: string;
  name: string;
  filterable: boolean;
  availableFilters: Array<{ id: string; name: string }>;
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

const toLayerSummary = (layer: LayerDefinition): LayerSummary => ({
  id: layer.id,
  name: layer.name,
  filterable: layer.filterable,
  availableFilters: layer.filterIds.map((filterId) => ({
    id: filterId,
    name: FILTER_CATALOG[filterId].name,
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
