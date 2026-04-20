/**
 * @fileoverview Builds GraphDB-backed `/vocabularies/{vocabulary}/terms`
 * responses while keeping the OpenAPI contract unchanged.
 */

import {
  buildGraphDbVocabulariesConfig,
  readGraphDbEnvironmentConfig,
} from "../graphdb/configuration";
import type {
  GraphDbVocabularyLabel,
  GraphDbVocabularyTermStatement,
  PublicVocabularyId,
} from "../graphdb/types";
import { fetchVocabularyTermsData } from "../libs/graphDbWrapper";
import { resolveLocalizedGraphDbText } from "./shared/localizedGraphDbText";

export interface VocabularyTermsResponse {
  terms: VocabularyTermSummary[];
}

export interface VocabularyTermSummary {
  term: string;
  label: string;
  description: string;
  breadcrumbs: Record<number, string>;
}

interface GraphDbVocabularyTermNode {
  term: string;
  labels: GraphDbVocabularyLabel[];
  definitions: GraphDbVocabularyLabel[];
  broaderTerms: string[];
}

const compareGraphDbStrings = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
};

const resolveGraphDbVocabularyText = (
  values: GraphDbVocabularyLabel[],
  language?: string,
  allowUntaggedFallback = false
): string =>
  resolveLocalizedGraphDbText(values, language, {
    allowUntaggedFallback,
  }).text;

/**
 * Groups the flat GraphDB statement list by term so the response builder can
 * resolve label, description and hierarchy from a single in-memory structure.
 */
const buildGraphDbVocabularyTermIndex = (
  statements: GraphDbVocabularyTermStatement[]
): Map<string, GraphDbVocabularyTermNode> => {
  const termIndex = new Map<string, GraphDbVocabularyTermNode>();

  for (const statement of statements) {
    const existingNode = termIndex.get(statement.term) ?? {
      term: statement.term,
      labels: [],
      definitions: [],
      broaderTerms: [],
    };

    if (
      statement.predicate === "http://www.w3.org/2004/02/skos/core#prefLabel" &&
      statement.objectIsLiteral
    ) {
      existingNode.labels.push({
        label: statement.object,
        language: statement.objectLanguage,
      });
    } else if (
      statement.predicate === "http://www.w3.org/2004/02/skos/core#definition" &&
      statement.objectIsLiteral
    ) {
      existingNode.definitions.push({
        label: statement.object,
        language: statement.objectLanguage,
      });
    } else if (
      statement.predicate === "http://www.w3.org/2004/02/skos/core#broader" &&
      !statement.objectIsLiteral
    ) {
      existingNode.broaderTerms.push(statement.object);
    }

    termIndex.set(statement.term, existingNode);
  }

  return termIndex;
};

/**
 * Builds the Swagger `breadcrumbs` object from the broader-term graph.
 * The current term is excluded, multiple parents are merged in a stable order,
 * and converging ancestors are emitted only once.
 */
export const buildVocabularyTermBreadcrumbs = (
  termUri: string,
  termIndex: Map<string, GraphDbVocabularyTermNode>,
  language?: string
): Record<number, string> => {
  const orderedAncestors: string[] = [];
  const seenAncestors = new Set<string>();

  const appendAncestors = (
    currentTermUri: string,
    activePath: Set<string>
  ): void => {
    const currentNode = termIndex.get(currentTermUri);
    if (!currentNode) {
      return;
    }

    const broaderTerms = [...new Set(currentNode.broaderTerms)].sort(
      compareGraphDbStrings
    );

    for (const broaderTerm of broaderTerms) {
      if (activePath.has(broaderTerm)) {
        continue;
      }

      activePath.add(broaderTerm);
      appendAncestors(broaderTerm, activePath);
      activePath.delete(broaderTerm);

      if (seenAncestors.has(broaderTerm)) {
        continue;
      }

      seenAncestors.add(broaderTerm);
      orderedAncestors.push(broaderTerm);
    }
  };

  appendAncestors(termUri, new Set([termUri]));

  return Object.fromEntries(
    orderedAncestors.map((ancestorTerm, index) => {
      const ancestorNode = termIndex.get(ancestorTerm);
      const label = ancestorNode
        ? resolveGraphDbVocabularyText(ancestorNode.labels, language)
        : "";

      return [index, label];
    })
  );
};

/**
 * Converts raw GraphDB term statements into the `/terms` response contract,
 * preserving the requested language fallback rules and the fixed breadcrumb shape.
 */
export const buildGraphDbVocabularyTermsResponse = (
  statements: GraphDbVocabularyTermStatement[],
  language?: string
): VocabularyTermsResponse => {
  const termIndex = buildGraphDbVocabularyTermIndex(statements);
  const orderedTerms = [...termIndex.keys()].sort(compareGraphDbStrings);

  return {
    terms: orderedTerms.map((term) => {
      const termNode = termIndex.get(term);
      if (!termNode) {
        throw new Error(`Missing GraphDB term node for '${term}'.`);
      }

      return {
        term,
        label: resolveGraphDbVocabularyText(termNode.labels, language),
        description: resolveGraphDbVocabularyText(
          termNode.definitions,
          language,
          true
        ),
        breadcrumbs: buildVocabularyTermBreadcrumbs(term, termIndex, language),
      };
    }),
  };
};

/**
 * Loads one vocabulary from GraphDB and returns the final `/terms` payload
 * expected by the public API contract.
 */
export const getGraphDbVocabularyTermsResponse = async (
  vocabularyId: PublicVocabularyId,
  language?: string
): Promise<VocabularyTermsResponse> => {
  const environmentConfig = readGraphDbEnvironmentConfig();
  const vocabulariesConfig = buildGraphDbVocabulariesConfig(environmentConfig);
  const vocabulary = vocabulariesConfig[vocabularyId];

  if (!vocabulary) {
    throw new Error(`Missing GraphDB configuration for vocabulary '${vocabularyId}'.`);
  }

  const statements = await fetchVocabularyTermsData(
    vocabulary,
    environmentConfig.vocabularyPrefixUrl
  );

  return buildGraphDbVocabularyTermsResponse(statements, language);
};
