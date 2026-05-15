/**
 * @fileoverview Resolves vocabulary-backed term filters into internal runtime
 * objects shared by future map-service URL construction.
 */

import {
  getTermFilterConfigurationById,
  isTermFilterId,
  type TermFilterId,
  type TermVocabularyId,
} from "../filters/configuration";
import type { LayerConfiguration } from "../layers/configuration";
import {
  type ValidatedFilter,
  type ValidatedTermFilter,
} from "./filterRequestValidationService";
import {
  resolveTermFilterNarrowers,
  type SemanticConceptQueryExecutor,
} from "./filterSemanticResolverService";

export type TermFilterResolutionConceptExecutor = SemanticConceptQueryExecutor;

export type ResolvedTermFilterId = TermFilterId;

export type ResolvableTermFilter = ValidatedTermFilter & {
  filterId: ResolvedTermFilterId;
};

export interface ResolvedTermFilter {
  filterId: ResolvedTermFilterId;
  type: "term";
  vocabularyId: TermVocabularyId;
  targetAttributes: string[];
  resolvedTerms: string[];
}

export interface TermFilterResolutionOptions {
  vocabularyPrefixUrl?: string;
  executeConceptQuery?: TermFilterResolutionConceptExecutor;
}

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

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
