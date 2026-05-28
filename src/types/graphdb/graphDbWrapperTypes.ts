import type {
  GraphDbVocabularyTerm,
  PublicVocabularyId,
} from "./graphDbTypes";

export interface NamedNodeBinding {
  id?: string;
  value?: string;
}

export interface LiteralBinding {
  value: string;
  language?: string;
}

export interface VocabularyQueryResult {
  term: NamedNodeBinding;
  prefLabel: LiteralBinding;
}

export interface VocabularyTermStatementQueryResult {
  term: NamedNodeBinding;
  predicate: NamedNodeBinding;
  object: unknown;
}

export interface VocabularyConceptQueryResult {
  concept: NamedNodeBinding;
}

export type GraphDbVocabulariesResult = Record<
  PublicVocabularyId,
  GraphDbVocabularyTerm[]
>;
