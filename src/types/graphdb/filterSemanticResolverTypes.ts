import type { PublicVocabularyId } from "./vocabularyDefinitionTypes";

export type SemanticConceptQueryExecutor = (
  vocabularyId: PublicVocabularyId,
  sparqlQuery: string
) => Promise<string[]>;

export type ChronostratigraphyResolutionRequest =
  | {
      mode: "younger" | "older";
      term: string;
    }
  | {
      mode: "between";
      olderTerm: string;
      youngerTerm: string;
    };
