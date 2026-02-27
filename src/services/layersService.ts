/**
 * Layer services for composing mock responses.
 */

import {
  FILTER_CATALOG,
  LAYERS,
  WEBMAP_ID,
  FilterDefinition,
  LayerDefinition,
} from "../data/mockData";

export interface LayerSummary {
  id: string;
  name: string;
  filterable: boolean;
  availableFilters: Array<{ id: string; name: string }>;
}

export interface LayersResponse {
  webmapId: string;
  layers: LayerSummary[];
}

export interface LayerFiltersResponse {
  layerId: string;
  filters: FilterDefinition[];
}

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
