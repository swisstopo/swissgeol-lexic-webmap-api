/**
 * @fileoverview Validates runtime filter request payloads against the
 * configured layer/filter registry before semantic resolution happens.
 */

import {
  getLayerConfigurationById,
} from "../../layers/layerConfigurationRegistry";
import type { LayerConfiguration } from "../../../types/layers/layerConfigurationTypes";
import { isTermFilterId } from "../filterConfigurationRegistry";
import type { TermFilterId } from "../../../types/filters/filterConfigurationTypes";
import { LAYER_FILTER_CATALOG } from "../../../configuration/layers/catalogs/filterCatalog";
import type { LayerFilterId } from "../../../types/layers/layerFilterTypes";
import type {
  ChronostratigraphyType,
  FilterRequestValidationError,
  FilterRequestValidationFailure,
  FilterRequestValidationResult,
  ValidatedByAttributeFilter,
  ValidatedChronostratigraphyFilter,
  ValidatedFilter,
  ValidatedTermFilter,
} from "../../../types/filters/filterRequestValidationTypes";

const CHRONOSTRATIGRAPHY_TYPES = new Set<ChronostratigraphyType>([
  "Younger",
  "Older",
  "From-To",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLayerFilterId = (value: unknown): value is LayerFilterId =>
  typeof value === "string" && value in LAYER_FILTER_CATALOG;

const isChronostratigraphyType = (
  value: unknown
): value is ChronostratigraphyType =>
  typeof value === "string" &&
  CHRONOSTRATIGRAPHY_TYPES.has(value as ChronostratigraphyType);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isByAttributeValue = (value: unknown): value is string | number | boolean =>
  ["string", "number", "boolean"].includes(typeof value);

const validationError = (
  statusCode: FilterRequestValidationError["statusCode"],
  message: string
): FilterRequestValidationFailure => ({
  error: {
    statusCode,
    message,
  },
});

const validateTermFilter = (
  filterId: TermFilterId,
  parameters: Record<string, unknown>
): ValidatedTermFilter | FilterRequestValidationFailure => {
  if (!isNonEmptyString(parameters.term)) {
    return validationError(400, `Filter '${filterId}' requires a term parameter`);
  }

  if (
    parameters.includeNarrowers !== undefined &&
    typeof parameters.includeNarrowers !== "boolean"
  ) {
    return validationError(
      400,
      `Filter '${filterId}' includeNarrowers parameter must be boolean`
    );
  }

  return {
    filterId,
    parameters: {
      term: parameters.term,
      includeNarrowers: parameters.includeNarrowers,
    },
  };
};

const validateChronostratigraphyFilter = (
  parameters: Record<string, unknown>
): ValidatedChronostratigraphyFilter | FilterRequestValidationFailure => {
  if (!isChronostratigraphyType(parameters.type)) {
    return validationError(
      400,
      "Chronostratigraphy filter requires type Younger, Older, or From-To"
    );
  }

  if (parameters.type === "Younger") {
    if (!isNonEmptyString(parameters.to)) {
      return validationError(
        400,
        "Chronostratigraphy Younger filter requires a to parameter"
      );
    }

    return {
      filterId: "f-chronostrat-term",
      parameters: {
        type: "Younger",
        to: parameters.to,
      },
    };
  }

  if (parameters.type === "Older") {
    if (!isNonEmptyString(parameters.from)) {
      return validationError(
        400,
        "Chronostratigraphy Older filter requires a from parameter"
      );
    }

    return {
      filterId: "f-chronostrat-term",
      parameters: {
        type: "Older",
        from: parameters.from,
      },
    };
  }

  if (!isNonEmptyString(parameters.from) || !isNonEmptyString(parameters.to)) {
    return validationError(
      400,
      "Chronostratigraphy From-To filter requires from and to parameters"
    );
  }

  return {
    filterId: "f-chronostrat-term",
    parameters: {
      type: "From-To",
      from: parameters.from,
      to: parameters.to,
    },
  };
};

const validateByAttributeFilter = (
  layer: LayerConfiguration,
  parameters: Record<string, unknown>
): ValidatedByAttributeFilter | FilterRequestValidationFailure => {
  if (
    !isNonEmptyString(parameters.attribute) ||
    !isByAttributeValue(parameters.value)
  ) {
    return validationError(
      400,
      "Filter 'f-byAttribute' requires attribute and value parameters"
    );
  }

  const attribute = parameters.attribute.trim();

  const configuration = layer.filterConfiguration?.["f-byAttribute"];
  if (!configuration) {
    return validationError(
      400,
      `Missing layer filter configuration for 'f-byAttribute' on layer '${layer.id}'.`
    );
  }

  if (configuration.excludedAttributes.includes(attribute)) {
    return validationError(
      400,
      `Filter 'f-byAttribute' cannot use excluded attribute '${attribute}'`
    );
  }

  return {
    filterId: "f-byAttribute",
    parameters: {
      attribute,
      value: parameters.value,
    },
  };
};

/*
 * Filter request validation is the boundary between untrusted API input and
 * typed semantic resolution. Helpers above keep parameter-shape checks local to
 * each filter family; `validateOneFilter` also enforces that the selected layer
 * advertises support for the requested public filter id.
 */
const validateOneFilter = (
  layer: LayerConfiguration,
  filter: unknown
): ValidatedFilter | FilterRequestValidationFailure => {
  if (!isRecord(filter) || !isLayerFilterId(filter.filterId)) {
    return validationError(400, "Filter id is required and must be supported");
  }

  if (!layer.filterIds.includes(filter.filterId)) {
    return validationError(
      400,
      `Layer does not support filter '${filter.filterId}'`
    );
  }

  if (!isRecord(filter.parameters)) {
    return validationError(400, `Filter '${filter.filterId}' requires parameters`);
  }

  if (isTermFilterId(filter.filterId)) {
    return validateTermFilter(filter.filterId, filter.parameters);
  }

  if (filter.filterId === "f-chronostrat-term") {
    return validateChronostratigraphyFilter(filter.parameters);
  }

  return validateByAttributeFilter(layer, filter.parameters);
};

/**
 * Validates client-provided filter payloads against layer/filter configuration
 * before any semantic serialization or GraphDB resolution happens.
 *
 * This is the first trust boundary for the filters pipeline:
 * - resolves the target layer from `layerConfigurationRegistry`;
 * - rejects non-array filter payloads;
 * - rejects filter ids not present in the public filter catalog;
 * - rejects filters not enabled on the selected layer;
 * - normalizes each filter family into the corresponding `Validated*` type.
 *
 * A successful result returns the layer configuration together with normalized
 * filter parameters. Downstream services should consume this result instead of
 * accepting raw request payloads directly.
 */
export const validateFilterRequest = (
  layerId: string,
  filters: unknown = []
): FilterRequestValidationResult => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer) {
    return validationError(404, "Layer not found");
  }

  if (!Array.isArray(filters)) {
    return validationError(400, "Filters must be an array");
  }

  const validatedFilters: ValidatedFilter[] = [];
  for (const filter of filters) {
    const validatedFilter = validateOneFilter(layer, filter);
    if ("error" in validatedFilter) {
      return validatedFilter;
    }

    validatedFilters.push(validatedFilter);
  }

  return {
    layer,
    filters: validatedFilters,
  };
};
