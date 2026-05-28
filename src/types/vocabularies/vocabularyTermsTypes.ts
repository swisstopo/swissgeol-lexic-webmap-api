export interface VocabularyTermsResponse {
  terms: VocabularyTermSummary[];
}

export interface VocabularyTermSummary {
  term: string;
  label: string;
  description: string;
  breadcrumbs: Record<number, string>;
}
