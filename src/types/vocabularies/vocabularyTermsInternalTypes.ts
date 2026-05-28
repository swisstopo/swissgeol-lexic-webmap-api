import type { GraphDbVocabularyLabel } from "../graphdb/graphDbTypes";

export interface GraphDbVocabularyTermNode {
  term: string;
  labels: GraphDbVocabularyLabel[];
  definitions: GraphDbVocabularyLabel[];
  broaderTerms: string[];
}
