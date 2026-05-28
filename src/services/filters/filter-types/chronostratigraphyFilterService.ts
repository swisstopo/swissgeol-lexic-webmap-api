/**
 * @fileoverview Resolves chronostratigraphy filters into internal runtime
 * objects shared by future map-service URL construction.
 */
import type { LayerConfiguration } from "../../../types/layers/layerConfigurationTypes";
import type {
  ValidatedChronostratigraphyFilter,
  ValidatedFilter,
} from "../../../types/filters/filterRequestValidationTypes";
import {
  resolveChronostratigraphyConcepts,
} from "../../graphdb/filterSemanticResolverService";
import type {
  ChronostratigraphyFilterResolutionOptions,
  ChronostratigraphyResolutionMode,
  ChronostratigraphyResolutionRequest,
  ResolvedChronostratigraphyFilter,
} from "../../../types/filters/chronostratigraphyFilterTypes";

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

/**
 * Identifies the chronostratigraphy filter after request validation. This keeps
 * the generic filter resolver free from chronostratigraphy parameter details.
 */
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

/**
 * Resolves a chronostratigraphy filter into mode-specific terms and layer
 * target attributes used by downstream CQL generation.
 *
 * The request has three public modes, but the resolved model normalizes them
 * into `younger`, `older`, or `between` plus the concrete boundary terms. The
 * semantic resolver expands those boundaries to the concept set that the WMS
 * CQL builder later applies to the configured "from" and "to" attributes.
 */
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
