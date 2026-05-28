import type { GRAPHDB_VOCABULARY_DEFINITIONS } from "../../configuration/graphdb/catalogs/vocabularyDefinitionsCatalog";

export type GraphDbVocabularyDefinition =
  (typeof GRAPHDB_VOCABULARY_DEFINITIONS)[number];

export type PublicVocabularyId = GraphDbVocabularyDefinition["id"];
