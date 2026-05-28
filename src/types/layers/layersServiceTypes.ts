import type { TermFilterId } from "../filters/filterConfigurationTypes";
import type { LayerFilterDefinition } from "./layerFilterTypes";

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
