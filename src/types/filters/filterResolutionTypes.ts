import type { LayerConfiguration } from "../layers/layerConfigurationTypes";
import type { FilterRequestValidationError } from "./filterRequestValidationTypes";
import type {
  ByAttributeFilterResolutionOptions,
  ResolvedByAttributeFilter,
} from "./byAttributeFilterTypes";
import type {
  ChronostratigraphyFilterResolutionConceptExecutor,
  ChronostratigraphyFilterResolutionOptions,
  ResolvedChronostratigraphyFilter,
} from "./chronostratigraphyFilterTypes";
import type {
  ResolvedTermFilter,
  TermFilterResolutionConceptExecutor,
  TermFilterResolutionOptions,
} from "./termFilterTypes";

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

export interface FilterResolutionFailure {
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
