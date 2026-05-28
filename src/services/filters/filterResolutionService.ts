/**
 * @fileoverview Resolves validated runtime filters into stable internal objects
 * before future map-service URL construction happens.
 */

import type { LayerConfiguration } from "../../types/layers/layerConfigurationTypes";
import { validateFilterRequest } from "./validation/filterRequestValidationService";
import {
  isByAttributeFilter,
  resolveByAttributeFilter,
} from "./filter-types/byAttributeFilterService";
import {
  isChronostratigraphyFilter,
  resolveChronostratigraphyFilter,
} from "./filter-types/chronostratigraphyFilterService";
import {
  isResolvableTermFilter,
  resolveTermFilter,
} from "./filter-types/termFilterService";
import type {
  FilterResolutionOptions,
  FilterResolutionResult,
  ResolvedFilter,
} from "../../types/filters/filterResolutionTypes";

/**
 * Converts raw API filter payloads for one layer into resolved, transport-neutral
 * filter objects.
 *
 * Flow:
 * 1. `validateFilterRequest` checks that the layer exists, the request is an
 *    array, every `filterId` is supported by that layer, and parameters match
 *    the public filter type.
 * 2. The validated filter is dispatched by behavior, not by concrete id:
 *    term filters go to `resolveTermFilter`, chronostratigraphy goes to
 *    `resolveChronostratigraphyFilter`, and by-attribute goes to
 *    `resolveByAttributeFilter`.
 * 3. Each filter-type service returns a resolved object with the exact layer
 *    attributes and values needed by downstream CQL generation.
 *
 * This service deliberately does not build WMS or CQL syntax. WMS-specific
 * serialization starts later in `calculateSemanticConstraint`.
 *
 * @param layerId Public layer id from the endpoint or semantic constraint call.
 * @param filters Raw request filter payloads.
 * @param options Optional test/runtime adapters used by filter-type resolvers.
 * @returns Either the layer plus resolved filters, or the validation error that
 * should be mapped to the HTTP/client error contract by the caller.
 */
export const resolveFiltersForLayer = async (
  layerId: string,
  filters: unknown = [],
  options: FilterResolutionOptions = {}
): Promise<FilterResolutionResult> => {
  const validation = validateFilterRequest(layerId, filters);
  if (validation.error) {
    return { error: validation.error };
  }

  const resolvedFilters: ResolvedFilter[] = [];
  for (const filter of validation.filters) {
    if (isResolvableTermFilter(filter)) {
      resolvedFilters.push(await resolveTermFilter(validation.layer, filter, options));
      continue;
    }

    if (isChronostratigraphyFilter(filter)) {
      resolvedFilters.push(
        await resolveChronostratigraphyFilter(validation.layer, filter, options)
      );
      continue;
    }

    if (isByAttributeFilter(filter)) {
      const byAttributeResult = await resolveByAttributeFilter(
        validation.layer,
        filter,
        options
      );
      if (byAttributeResult.error) {
        return { error: byAttributeResult.error };
      }

      resolvedFilters.push(byAttributeResult.resolvedFilter);
      continue;
    }

    const exhaustiveFilter: never = filter;
    throw new Error(`Unsupported validated filter '${String(exhaustiveFilter)}'.`);
  }

  return {
    layer: validation.layer,
    resolvedFilters,
  };
};
