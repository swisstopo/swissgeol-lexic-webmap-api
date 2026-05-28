/**
 * @fileoverview Resolves generic by-attribute filters into internal runtime
 * objects shared by future map-service URL construction.
 */

import type { LayerConfiguration } from "../../../types/layers/layerConfigurationTypes";
import type {
  ValidatedByAttributeFilter,
  ValidatedFilter,
} from "../../../types/filters/filterRequestValidationTypes";
import type {
  ByAttributeFilterResolutionOptions,
  ByAttributeFilterResolutionResult,
} from "../../../types/filters/byAttributeFilterTypes";

/**
 * Identifies the generic attribute/value filter after request validation. The
 * resolver handles it separately because it does not require vocabulary lookup.
 */
export const isByAttributeFilter = (
  filter: ValidatedFilter
): filter is ValidatedByAttributeFilter => filter.filterId === "f-byAttribute";

/**
 * Resolves an attribute filter and optionally verifies the selected attribute
 * against live layer metadata when an attribute provider is supplied.
 *
 * The output is already specific enough for CQL generation: a layer id, one
 * attribute name, and one scalar value. Vocabulary and narrower-term resolution
 * are intentionally outside this filter type's responsibility.
 */
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
