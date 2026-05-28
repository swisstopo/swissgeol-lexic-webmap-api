import type { FilterId } from "../filters/mockFilterTypes";
import type { VocabularyLanguage } from "./vocabularyLanguageTypes";

export interface VocabularyDefinition {
  id: string;
  name: string;
}

export type VocabularyBreadcrumbMap = Record<number, string>;

export interface VocabularyTermLocalization {
  label: string;
  description: string;
  breadcrumbs: VocabularyBreadcrumbMap;
}

export interface VocabularyTermTranslations
  extends Partial<Record<VocabularyLanguage, VocabularyTermLocalization>> {
  en: VocabularyTermLocalization;
}

export interface VocabularyTermDefinition {
  term: string;
  translations: VocabularyTermTranslations;
}

export type VocabularyFilterMap = Record<string, FilterId>;
