import type { SemanticConceptQueryExecutor } from "../graphdb/filterSemanticResolverTypes";
import type {
  TermFilterId,
  TermVocabularyId,
} from "./filterConfigurationTypes";
import type { ValidatedTermFilter } from "./filterRequestValidationTypes";

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
