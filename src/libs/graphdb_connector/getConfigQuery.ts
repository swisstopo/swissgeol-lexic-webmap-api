/**
 * @fileoverview Resolves the SPARQL query templates for a GraphDB vocabulary using the configured prefix URL.
 */

import { resolveGraphDbQueryConfig } from "../../services/graphdb/queryConfigRegistry";
import type { PublicVocabularyId, VocabularyQueryConfig } from "../../types/graphdb/graphDbTypes";

export const getQueryConfig = (
  vocabulary: PublicVocabularyId,
  vocabularyPrefixUrl: string
): VocabularyQueryConfig =>
  resolveGraphDbQueryConfig(vocabulary, vocabularyPrefixUrl);
