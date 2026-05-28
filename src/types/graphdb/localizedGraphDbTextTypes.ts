import type { VocabularyLanguage } from "../vocabularies/vocabularyLanguageTypes";
export type { VocabularyLanguage } from "../vocabularies/vocabularyLanguageTypes";

export type LocalizedGraphDbTextSource =
  | "requested"
  | "en"
  | "untagged"
  | "fallback"
  | "empty";

export interface LocalizedGraphDbTextResolution {
  text: string;
  source: LocalizedGraphDbTextSource;
  resolvedLanguage: VocabularyLanguage;
}
