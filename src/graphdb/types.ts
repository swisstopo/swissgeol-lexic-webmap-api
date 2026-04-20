/**
 * @fileoverview Shared GraphDB types used by configuration, query resolution, and smoke checks.
 */

export type { PublicVocabularyId } from "./vocabularyDefinitions";

export interface VocabularyQueryConfig {
  allConcept: string;
  allTermData: string;
  queryBreadcrumbs: string;
  queryVocabolo: string;
}

export interface GraphDbVocabularyTerm {
  term: string;
  label: string;
  language?: string;
}

export interface GraphDbVocabularyLabel {
  label: string;
  language?: string;
}

export interface GraphDbVocabularyTermStatement {
  term: string;
  predicate: string;
  object: string;
  objectLanguage?: string;
  objectIsLiteral: boolean;
}
