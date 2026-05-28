import type {
  ChronostratigraphyResolutionRequest,
  SemanticConceptQueryExecutor,
} from "../graphdb/filterSemanticResolverTypes";

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

export type { ChronostratigraphyResolutionRequest };
