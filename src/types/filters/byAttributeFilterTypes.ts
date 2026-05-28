import type { FilterRequestValidationError } from "./filterRequestValidationTypes";

export type LayerAttributeListProvider = (
  layerId: string
) => Promise<string[] | undefined>;

export interface ResolvedByAttributeFilter {
  filterId: "f-byAttribute";
  type: "byAttribute";
  layerId: string;
  attribute: string;
  value: string | number | boolean;
}

export interface ByAttributeFilterResolutionOptions {
  getLayerAttributes?: LayerAttributeListProvider;
}

export type ByAttributeFilterResolutionResult =
  | {
      resolvedFilter: ResolvedByAttributeFilter;
      error?: undefined;
    }
  | {
      error: FilterRequestValidationError;
      resolvedFilter?: undefined;
    };
