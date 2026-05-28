/**
 * @fileoverview Shared helpers for resolving GraphDB localized text values with
 * fallback rules used by vocabulary-related services.
 */

import type { GraphDbVocabularyLabel } from "../../types/graphdb/graphDbTypes";
import type {
  LocalizedGraphDbTextResolution,
  VocabularyLanguage,
} from "../../types/graphdb/localizedGraphDbTextTypes";

export const DEFAULT_VOCABULARY_LANGUAGE: VocabularyLanguage = "en";

/**
 * Normalizes the public `lang` query parameter to one of the supported
 * vocabulary languages, defaulting to English for missing or unsupported values.
 */
export const resolveVocabularyLanguage = (
  language?: string
): VocabularyLanguage => {
  if (language === "it" || language === "de" || language === "fr") {
    return language;
  }

  return DEFAULT_VOCABULARY_LANGUAGE;
};

/**
 * Resolves a localized GraphDB text value using the shared fallback policy:
 * requested language, then English, then optional untagged or configured
 * fallback. The returned `source` lets endpoint services log when GraphDB data
 * did not contain the requested language without duplicating the fallback rules.
 */
export const resolveLocalizedGraphDbText = (
  values: GraphDbVocabularyLabel[],
  language?: string,
  options: {
    allowUntaggedFallback?: boolean;
    fallbackText?: string;
  } = {}
): LocalizedGraphDbTextResolution => {
  const resolvedLanguage = resolveVocabularyLanguage(language);
  const requestedValue = values.find(
    (value) => value.language === resolvedLanguage
  );
  if (requestedValue) {
    return {
      text: requestedValue.label,
      source: "requested",
      resolvedLanguage,
    };
  }

  const englishValue = values.find(
    (value) => value.language === DEFAULT_VOCABULARY_LANGUAGE
  );
  if (englishValue) {
    return {
      text: englishValue.label,
      source: "en",
      resolvedLanguage,
    };
  }

  if (options.allowUntaggedFallback) {
    const untaggedValue = values.find((value) => !value.language);
    if (untaggedValue) {
      return {
        text: untaggedValue.label,
        source: "untagged",
        resolvedLanguage,
      };
    }
  }

  if (options.fallbackText !== undefined) {
    return {
      text: options.fallbackText,
      source: "fallback",
      resolvedLanguage,
    };
  }

  return {
    text: "",
    source: "empty",
    resolvedLanguage,
  };
};
