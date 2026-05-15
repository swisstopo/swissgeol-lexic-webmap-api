/**
 * @fileoverview Resolves chronostratigraphy filters into internal runtime
 * objects shared by future map-service URL construction.
 */

import type { LayerConfiguration } from "../layers/configuration";
import type {
  ValidatedChronostratigraphyFilter,
  ValidatedFilter,
} from "./filterRequestValidationService";
import {
  resolveChronostratigraphyConcepts,
  type ChronostratigraphyResolutionRequest,
  type SemanticConceptQueryExecutor,
} from "./filterSemanticResolverService";

export type ChronostratigraphyFilterResolutionConceptExecutor =
  SemanticConceptQueryExecutor;

export type ChronostratigraphyResolutionMode = "younger" | "older" | "between";

export interface ResolvedChronostratigraphyFilter {
  filterId: "f-chronostrat-term";
  type: "chronostratigraphy";
  mode: ChronostratigraphyResolutionMode;
  vocabularyId: "chronostratigraphy";
  targetAttributes: {
    from: string;
    to: string;
  };
  boundaryTerms: {
    from?: string;
    to?: string;
  };
  resolvedTerms: string[];
}

export interface ChronostratigraphyFilterResolutionOptions {
  vocabularyPrefixUrl?: string;
  executeConceptQuery?: ChronostratigraphyFilterResolutionConceptExecutor;
}

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

export const isChronostratigraphyFilter = (
  filter: ValidatedFilter
): filter is ValidatedChronostratigraphyFilter =>
  filter.filterId === "f-chronostrat-term";

const getChronostratigraphyTargetAttributes = (
  layer: LayerConfiguration
): ResolvedChronostratigraphyFilter["targetAttributes"] => {
  const configuration = layer.filterConfiguration?.["f-chronostrat-term"];

  if (!configuration) {
    throw new Error(
      `Missing layer filter configuration for 'f-chronostrat-term' on layer '${layer.id}'.`
    );
  }

  return {
    from: configuration.columnToFilterOld,
    to: configuration.columnToFilterYon,
  };
};

const getResolutionRequest = (
  filter: ValidatedChronostratigraphyFilter
): {
  request: ChronostratigraphyResolutionRequest;
  mode: ChronostratigraphyResolutionMode;
  boundaryTerms: ResolvedChronostratigraphyFilter["boundaryTerms"];
} => {
  if (filter.parameters.type === "Younger") {
    return {
      request: {
        mode: "younger",
        term: filter.parameters.to,
      },
      mode: "younger",
      boundaryTerms: {
        to: filter.parameters.to,
      },
    };
  }

  if (filter.parameters.type === "Older") {
    return {
      request: {
        mode: "older",
        term: filter.parameters.from,
      },
      mode: "older",
      boundaryTerms: {
        from: filter.parameters.from,
      },
    };
  }

  return {
    request: {
      mode: "between",
      olderTerm: filter.parameters.from,
      youngerTerm: filter.parameters.to,
    },
    mode: "between",
    boundaryTerms: {
      from: filter.parameters.from,
      to: filter.parameters.to,
    },
  };
};

export const resolveChronostratigraphyFilter = async (
  layer: LayerConfiguration,
  filter: ValidatedChronostratigraphyFilter,
  options: ChronostratigraphyFilterResolutionOptions
): Promise<ResolvedChronostratigraphyFilter> => {
  const { request, mode, boundaryTerms } = getResolutionRequest(filter);
  const resolvedConcepts = await resolveChronostratigraphyConcepts(
    request,
    options.vocabularyPrefixUrl,
    options.executeConceptQuery
  );

  return {
    filterId: "f-chronostrat-term",
    type: "chronostratigraphy",
    mode,
    vocabularyId: "chronostratigraphy",
    targetAttributes: getChronostratigraphyTargetAttributes(layer),
    boundaryTerms,
    resolvedTerms: uniqueStrings([
      ...Object.values(boundaryTerms).filter(
        (term): term is string => term !== undefined
      ),
      ...resolvedConcepts,
    ]),
  };
};
