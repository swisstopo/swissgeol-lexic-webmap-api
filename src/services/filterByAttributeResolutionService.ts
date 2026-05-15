/**
 * @fileoverview Resolves generic by-attribute filters into internal runtime
 * objects shared by future map-service URL construction.
 */

import type { LayerConfiguration } from "../layers/configuration";
import type {
  FilterRequestValidationError,
  ValidatedByAttributeFilter,
  ValidatedFilter,
} from "./filterRequestValidationService";

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

type ByAttributeFilterResolutionResult =
  | {
      resolvedFilter: ResolvedByAttributeFilter;
      error?: undefined;
    }
  | {
      error: FilterRequestValidationError;
      resolvedFilter?: undefined;
    };

export const isByAttributeFilter = (
  filter: ValidatedFilter
): filter is ValidatedByAttributeFilter => filter.filterId === "f-byAttribute";

export const resolveByAttributeFilter = async (
  layer: LayerConfiguration,
  filter: ValidatedByAttributeFilter,
  options: ByAttributeFilterResolutionOptions
): Promise<ByAttributeFilterResolutionResult> => {
  const availableAttributes = await options.getLayerAttributes?.(layer.id);
  if (
    availableAttributes &&
    !availableAttributes.includes(filter.parameters.attribute)
  ) {
    return {
      error: {
        statusCode: 400,
        message:
          `Layer attribute '${filter.parameters.attribute}' is not available for filter 'f-byAttribute'`,
      },
    };
  }

  return {
    resolvedFilter: {
      filterId: "f-byAttribute",
      type: "byAttribute",
      layerId: layer.id,
      attribute: filter.parameters.attribute,
      value: filter.parameters.value,
    },
  };
};
