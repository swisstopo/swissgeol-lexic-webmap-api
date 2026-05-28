import type { LayerConfiguration } from "../layers/layerConfigurationTypes";
import type { TermFilterId } from "./filterConfigurationTypes";

export interface FilterRequestValidationError {
  statusCode: 400 | 404;
  message: string;
}

export interface FilterRequestValidationFailure {
  error: FilterRequestValidationError;
  layer?: undefined;
  filters?: undefined;
}

export interface ValidatedTermFilter {
  filterId: TermFilterId;
  parameters: {
    term: string;
    includeNarrowers?: boolean;
  };
}

export type ValidatedChronostratigraphyFilter =
  | {
      filterId: "f-chronostrat-term";
      parameters: {
        type: "Younger";
        to: string;
      };
    }
  | {
      filterId: "f-chronostrat-term";
      parameters: {
        type: "Older";
        from: string;
      };
    }
  | {
      filterId: "f-chronostrat-term";
      parameters: {
        type: "From-To";
        from: string;
        to: string;
      };
    };

export type ChronostratigraphyType =
  ValidatedChronostratigraphyFilter["parameters"]["type"];

export interface ValidatedByAttributeFilter {
  filterId: "f-byAttribute";
  parameters: {
    attribute: string;
    value: string | number | boolean;
  };
}

export type ValidatedFilter =
  | ValidatedTermFilter
  | ValidatedChronostratigraphyFilter
  | ValidatedByAttributeFilter;

export type FilterRequestValidationResult =
  | {
      layer: LayerConfiguration;
      filters: ValidatedFilter[];
      error?: undefined;
    }
  | FilterRequestValidationFailure;
