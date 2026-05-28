/**
 * @fileoverview Resolves vocabulary-backed term filters into internal runtime
 * objects shared by future map-service URL construction.
 */
import {
  getTermFilterConfigurationById,
  isTermFilterId,
} from "../filterConfigurationRegistry";

import type {
  TermFilterId,
  TermVocabularyId,
} from "../../../types/filters/filterConfigurationTypes";
import type { LayerConfiguration } from "../../../types/layers/layerConfigurationTypes";

import {
  type ValidatedFilter,
  type ValidatedTermFilter,
} from "../../../types/filters/filterRequestValidationTypes";

import {
  resolveTermFilterNarrowers,
} from "../../graphdb/filterSemanticResolverService";
import type {
  ResolvableTermFilter,
  ResolvedTermFilter,
  ResolvedTermFilterId,
  TermFilterResolutionOptions,
} from "../../../types/filters/termFilterTypes";

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

/**
 * Narrows a validated request filter to the reusable vocabulary-backed term
 * family. Chronostratigraphy is handled separately because its request shape
 * and target attributes are interval-oriented rather than a single term list.
 */
export const isResolvableTermFilter = (
  filter: ValidatedFilter
): filter is ResolvableTermFilter => isTermFilterId(filter.filterId);

const getTermTargetAttributes = (
  layer: LayerConfiguration,
  filterId: ResolvedTermFilterId
): string[] => {
  const configuration = layer.filterConfiguration?.[filterId];

  if (!configuration) {
    throw new Error(
      `Missing layer filter configuration for '${filterId}' on layer '${layer.id}'.`
    );
  }

  return [...configuration.attributeToFilter];
};

/**
 * Resolves a vocabulary-backed term filter, including narrower concepts when
 * requested by the validated filter payload.
 *
 * The resolved object captures the vocabulary, all accepted concept URIs, and
 * the layer attributes that should be tested. It is intentionally not CQL yet:
 * callers such as `calculateSemanticConstraint` own the final GeoServer syntax.
 */
export const resolveTermFilter = async (
  layer: LayerConfiguration,
  filter: ResolvableTermFilter,
  options: TermFilterResolutionOptions
): Promise<ResolvedTermFilter> => {
  const filterConfiguration = getTermFilterConfigurationById(filter.filterId);
  const narrowerTerms =
    filter.parameters.includeNarrowers === false
      ? []
      : await resolveTermFilterNarrowers(
          filterConfiguration.vocabularyId,
          filter.parameters.term,
          options.vocabularyPrefixUrl,
          options.executeConceptQuery
        );

  return {
    filterId: filter.filterId,
    type: "term",
    vocabularyId: filterConfiguration.vocabularyId,
    targetAttributes: getTermTargetAttributes(layer, filter.filterId),
    resolvedTerms: uniqueStrings([filter.parameters.term, ...narrowerTerms]),
  };
};
