/**
 * Response contract for vocabulary listing endpoints.
 */
export interface VocabulariesResponse {
  vocabularies: Array<{ id: string; name: string }>;
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
