/**
 * @fileoverview Service helpers for vocabulary-related response payloads.
 */

import type { FastifyBaseLogger } from "fastify";
import {
  LAYERS,
  VOCABULARY_FILTER_MAP,
  VOCABULARY_TERM_DETAILS,
} from "../data/mockData";
import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../graphdb/configuration";
import {
  GRAPHDB_VOCABULARY_DEFINITIONS,
  getGraphDbVocabularyDefinition,
} from "../graphdb/vocabularyDefinitions";
import type { GraphDbVocabularyLabel, PublicVocabularyId } from "../graphdb/types";
import { fetchVocabularyListingLabelsData } from "../libs/graphDbWrapper";
import {
  DEFAULT_VOCABULARY_LANGUAGE,
  resolveLocalizedGraphDbText,
  resolveVocabularyLanguage,
} from "./shared/localizedGraphDbText";
import type {
  VocabularyTermSummary,
  VocabularyTermsResponse,
} from "./vocabularyTermsService";
export type {
  VocabularyTermSummary,
  VocabularyTermsResponse,
} from "./vocabularyTermsService";
type VocabularyWarningLogger = {
  warn: FastifyBaseLogger["warn"];
};

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

export const resolveVocabularyListingName = (
  vocabularyId: PublicVocabularyId,
  labels: GraphDbVocabularyLabel[],
  language?: string,
  logger?: VocabularyWarningLogger
): string => {
  const definition = getGraphDbVocabularyDefinition(vocabularyId);
  const resolution = resolveLocalizedGraphDbText(labels, language, {
    fallbackText: definition.defaultNameEn,
  });

  if (resolution.source === "en") {
    logger?.warn(
      {
        vocabularyId,
        requestedLang: resolution.resolvedLanguage,
        fallbackSource: "en",
      },
      "Falling back while resolving vocabulary listing label."
    );
  } else if (resolution.source === "fallback") {
    logger?.warn(
      {
        vocabularyId,
        requestedLang: resolution.resolvedLanguage,
        fallbackSource: "config",
      },
      "Falling back while resolving vocabulary listing label."
    );
  }

  return resolution.text;
};

export const getVocabulariesResponse = (): VocabulariesResponse => ({
  vocabularies: GRAPHDB_VOCABULARY_DEFINITIONS.map((definition) => ({
    id: definition.id,
    name: definition.defaultNameEn,
  })),
});

export const getGraphDbVocabulariesResponse = async (
  language?: string,
  logger?: VocabularyWarningLogger
): Promise<VocabulariesResponse> => {
  const environmentConfig = readGraphDbEnvironmentConfig();
  const vocabulariesConfig = buildGraphDbVocabulariesConfig(environmentConfig);
  const vocabularyLabels = await fetchVocabularyListingLabelsData(vocabulariesConfig);

  return {
    vocabularies: GRAPHDB_VOCABULARY_DEFINITIONS.map((definition) => {
      const labels = vocabularyLabels[definition.id];
      if (!labels) {
        throw new Error(
          `Missing GraphDB vocabulary labels for '${definition.id}'.`
        );
      }

      return {
        id: definition.id,
        name: resolveVocabularyListingName(
          definition.id,
          labels,
          language,
          logger
        ),
      };
    }),
  };
};

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
      if (!translation) {
        throw new Error(
          `Missing mock translation for term '${termDefinition.term}' in vocabulary '${vocabularyId}'.`
        );
      }

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
