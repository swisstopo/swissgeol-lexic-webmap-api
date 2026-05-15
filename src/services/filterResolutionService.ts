/**
 * @fileoverview Resolves validated runtime filters into stable internal objects
 * before future map-service URL construction happens.
 */

import type { LayerConfiguration } from "../layers/configuration";
import {
  validateFilterRequest,
  type FilterRequestValidationError,
} from "./filterRequestValidationService";
import {
  isByAttributeFilter,
  resolveByAttributeFilter,
  type ByAttributeFilterResolutionOptions,
  type ResolvedByAttributeFilter,
} from "./filterByAttributeResolutionService";
import {
  isChronostratigraphyFilter,
  resolveChronostratigraphyFilter,
  type ChronostratigraphyFilterResolutionConceptExecutor,
  type ChronostratigraphyFilterResolutionOptions,
  type ResolvedChronostratigraphyFilter,
} from "./filterChronostratigraphyResolutionService";
import {
  isResolvableTermFilter,
  resolveTermFilter,
  type ResolvedTermFilter,
  type TermFilterResolutionConceptExecutor,
  type TermFilterResolutionOptions,
} from "./filterTermResolutionService";

export type FilterResolutionConceptExecutor =
  | TermFilterResolutionConceptExecutor
  | ChronostratigraphyFilterResolutionConceptExecutor;

export type ResolvedFilter =
  | ResolvedTermFilter
  | ResolvedChronostratigraphyFilter
  | ResolvedByAttributeFilter;

export interface FilterResolutionOptions
  extends TermFilterResolutionOptions,
    ChronostratigraphyFilterResolutionOptions,
    ByAttributeFilterResolutionOptions {}

interface FilterResolutionFailure {
  error: FilterRequestValidationError;
  layer?: undefined;
  resolvedFilters?: undefined;
}

export type FilterResolutionResult =
  | {
      layer: LayerConfiguration;
      resolvedFilters: ResolvedFilter[];
      error?: undefined;
    }
  | FilterResolutionFailure;

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
