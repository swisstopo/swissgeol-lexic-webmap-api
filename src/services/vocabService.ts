/**
 * @fileoverview Service helpers for vocabulary-related response payloads.
 */

import {
  LAYERS,
  VOCABULARIES,
  VOCABULARY_FILTER_MAP,
  VOCABULARY_TERM_DETAILS,
  type VocabularyLanguage,
} from "../data/mockData";

const DEFAULT_VOCABULARY_LANGUAGE: VocabularyLanguage = "en";

const resolveVocabularyLanguage = (language?: string): VocabularyLanguage => {
  if (language === "it" || language === "de" || language === "fr") {
    return language;
  }

  return DEFAULT_VOCABULARY_LANGUAGE;
};

/**
 * Response contract for vocabulary listing endpoints.
 */
export interface VocabulariesResponse {
  vocabularies: Array<{ id: string; name: string }>;
}

/**
 * Response contract for vocabulary terms endpoints.
 */
export interface VocabularyTermsResponse {
  terms: VocabularyTermSummary[];
}

export interface VocabularyTermSummary {
  term: string;
  label: string;
  description: string;
  breadcrumbs: Record<number, string>;
}

/**
 * Layer reference contract returned by vocabulary-layer endpoints.
 */
export interface VocabularyLayerRef {
  id: string;
  name: string;
}

/**
 * Response contract for vocabulary-layer endpoints.
 */
export interface VocabularyLayersResponse {
  layers: VocabularyLayerRef[];
}

export const getVocabulariesResponse = (): VocabulariesResponse => ({
  vocabularies: VOCABULARIES,
});

export const getVocabularyTerms = (
  vocabularyId: string,
  language?: string
): VocabularyTermsResponse | null => {
  const terms = VOCABULARY_TERM_DETAILS[vocabularyId];
  if (!terms) return null;

  const resolvedLanguage = resolveVocabularyLanguage(language);

  return {
    terms: terms.map((termDefinition) => {
      const translation =
        termDefinition.translations[resolvedLanguage] ??
        termDefinition.translations[DEFAULT_VOCABULARY_LANGUAGE];

      return {
        term: termDefinition.term,
        label: translation.label,
        description: translation.description,
        breadcrumbs: translation.breadcrumbs,
      };
    }),
  };
};

export const getVocabularyLayers = (
  vocabularyId: string
): VocabularyLayersResponse | null => {
  const filterId = VOCABULARY_FILTER_MAP[vocabularyId];
  if (!filterId) return null;

  const layers = LAYERS.filter((layer) => layer.filterIds.includes(filterId)).map(
    (layer) => ({ id: layer.id, name: layer.name })
  );

  return { layers };
};
