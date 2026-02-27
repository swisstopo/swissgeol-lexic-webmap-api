/**
 * Vocabulary services for mock responses.
 */

import {
  LAYERS,
  VOCABULARIES,
  VOCABULARY_FILTER_MAP,
  VOCABULARY_TERMS,
} from "../data/mockData";

export interface VocabulariesResponse {
  vocabularies: Array<{ id: string; name: string }>;
}

export interface VocabularyTermsResponse {
  terms: string[];
}

export interface VocabularyLayerRef {
  id: string;
  name: string;
}

export interface VocabularyLayersResponse {
  layers: VocabularyLayerRef[];
}

export const getVocabulariesResponse = (): VocabulariesResponse => ({
  vocabularies: VOCABULARIES,
});

export const getVocabularyTerms = (
  vocabularyId: string
): VocabularyTermsResponse | null => {
  const terms = VOCABULARY_TERMS[vocabularyId];
  if (!terms) return null;

  return { terms };
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
