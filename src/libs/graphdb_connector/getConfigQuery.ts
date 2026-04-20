/**
 * @fileoverview Resolves the SPARQL query templates for a GraphDB vocabulary using the configured prefix URL.
 */

import { resolveGraphDbQueryConfig } from "../../graphdb/queryCatalog";
import type { PublicVocabularyId, VocabularyQueryConfig } from "../../graphdb/types";

export const getQueryConfig = (
  vocabulary: PublicVocabularyId,
  vocabularyPrefixUrl: string
): VocabularyQueryConfig =>
  resolveGraphDbQueryConfig(vocabulary, vocabularyPrefixUrl);
