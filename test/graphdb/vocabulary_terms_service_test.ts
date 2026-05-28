/**
 * @fileoverview Verifies GraphDB-backed `/vocabularies/{vocabulary}/terms` mapping rules without calling GraphDB.
 */

import assert from "node:assert/strict";
import test from "node:test";
import type {
  GraphDbVocabularyLabel,
  GraphDbVocabularyTermStatement,
} from "../../src/types/graphdb/graphDbTypes";
import {
  buildGraphDbVocabularyTermsResponse,
  buildVocabularyTermBreadcrumbs,
} from "../../src/services/vocabularies/vocabularyTermsService";
import { resolveLocalizedGraphDbText } from "../../src/services/shared/languageParametersService";

const createTermIndex = (
  entries: Array<{
    term: string;
    labels?: GraphDbVocabularyLabel[];
    definitions?: GraphDbVocabularyLabel[];
    broaderTerms?: string[];
  }>
) =>
  new Map(
    entries.map((entry) => [
      entry.term,
      {
        term: entry.term,
        labels: entry.labels ?? [],
        definitions: entry.definitions ?? [],
        broaderTerms: entry.broaderTerms ?? [],
      },
    ])
  );

test("falls back from requested language to English for labels", () => {
  const resolved = resolveLocalizedGraphDbText(
    [
      { label: "Chronostratigraphy", language: "en" },
      { label: "Chronostratigrafia", language: "it" },
    ],
    "fr"
  );

  assert.equal(resolved.text, "Chronostratigraphy");
  assert.equal(resolved.source, "en");
});

test("falls back from requested language to untagged definition", () => {
  const resolved = resolveLocalizedGraphDbText(
    [{ label: "definition without language", language: "" }],
    "it",
    { allowUntaggedFallback: true }
  );

  assert.equal(resolved.text, "definition without language");
  assert.equal(resolved.source, "untagged");
});

test("returns an empty breadcrumb map for root terms", () => {
  const breadcrumbs = buildVocabularyTermBreadcrumbs(
    "urn:term:root",
    createTermIndex([
      {
        term: "urn:term:root",
        labels: [{ label: "Root", language: "en" }],
      },
    ]),
    "en"
  );

  assert.deepEqual(breadcrumbs, {});
});

test("builds a linear breadcrumb chain without the current term", () => {
  const breadcrumbs = buildVocabularyTermBreadcrumbs(
    "urn:term:child",
    createTermIndex([
      {
        term: "urn:term:root",
        labels: [{ label: "Root", language: "en" }],
      },
      {
        term: "urn:term:parent",
        labels: [{ label: "Parent", language: "en" }],
        broaderTerms: ["urn:term:root"],
      },
      {
        term: "urn:term:child",
        labels: [{ label: "Child", language: "en" }],
        broaderTerms: ["urn:term:parent"],
      },
    ]),
    "en"
  );

  assert.deepEqual(breadcrumbs, { 0: "Root", 1: "Parent" });
});

test("keeps same-level parents one below the other using stable URI order", () => {
  const breadcrumbs = buildVocabularyTermBreadcrumbs(
    "urn:term:child",
    createTermIndex([
      {
        term: "urn:term:parent-a",
        labels: [{ label: "Parent A", language: "en" }],
      },
      {
        term: "urn:term:parent-b",
        labels: [{ label: "Parent B", language: "en" }],
      },
      {
        term: "urn:term:child",
        labels: [{ label: "Child", language: "en" }],
        broaderTerms: ["urn:term:parent-b", "urn:term:parent-a"],
      },
    ]),
    "en"
  );

  assert.deepEqual(breadcrumbs, { 0: "Parent A", 1: "Parent B" });
});

test("deduplicates converging ancestors in multi-parent breadcrumbs", () => {
  const breadcrumbs = buildVocabularyTermBreadcrumbs(
    "urn:term:child",
    createTermIndex([
      {
        term: "urn:term:root",
        labels: [{ label: "Root", language: "en" }],
      },
      {
        term: "urn:term:parent-a",
        labels: [{ label: "Parent A", language: "en" }],
        broaderTerms: ["urn:term:root"],
      },
      {
        term: "urn:term:parent-b",
        labels: [{ label: "Parent B", language: "en" }],
        broaderTerms: ["urn:term:root"],
      },
      {
        term: "urn:term:child",
        labels: [{ label: "Child", language: "en" }],
        broaderTerms: ["urn:term:parent-b", "urn:term:parent-a"],
      },
    ]),
    "en"
  );

  assert.deepEqual(breadcrumbs, {
    0: "Root",
    1: "Parent A",
    2: "Parent B",
  });
});

test("builds the final terms response ordered by term URI", () => {
  const statements: GraphDbVocabularyTermStatement[] = [
    {
      term: "urn:term:b",
      predicate: "http://www.w3.org/2004/02/skos/core#prefLabel",
      object: "Bravo",
      objectLanguage: "en",
      objectIsLiteral: true,
    },
    {
      term: "urn:term:a",
      predicate: "http://www.w3.org/2004/02/skos/core#prefLabel",
      object: "Alfa",
      objectLanguage: "it",
      objectIsLiteral: true,
    },
    {
      term: "urn:term:a",
      predicate: "http://www.w3.org/2004/02/skos/core#prefLabel",
      object: "Alpha",
      objectLanguage: "en",
      objectIsLiteral: true,
    },
    {
      term: "urn:term:a",
      predicate: "http://www.w3.org/2004/02/skos/core#definition",
      object: "Definition without language",
      objectLanguage: "",
      objectIsLiteral: true,
    },
  ];

  const response = buildGraphDbVocabularyTermsResponse(statements, "it");

  assert.deepEqual(response, {
    terms: [
      {
        term: "urn:term:a",
        label: "Alfa",
        description: "Definition without language",
        breadcrumbs: {},
      },
      {
        term: "urn:term:b",
        label: "Bravo",
        description: "",
        breadcrumbs: {},
      },
    ],
  });
});
