/**
 * @fileoverview Verifies the `/vocabularies` label fallback rules without calling GraphDB.
 */

import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyBaseLogger } from "fastify";
import { resolveVocabularyListingName } from "../../src/services/vocabService";

const createLoggerSpy = () => {
  const warnings: Array<{
    context: Record<string, unknown>;
    message: string;
  }> = [];

  return {
    logger: {
      warn: (context: Record<string, unknown>, message: string, ..._args: unknown[]) => {
        warnings.push({ context, message });
      },
    },
    warnings,
  };
};

test("uses the requested language when the label exists in GraphDB", () => {
  const { logger, warnings } = createLoggerSpy();
  const name = resolveVocabularyListingName(
    "chronostratigraphy",
    [
      { label: "Cronostratigrafia", language: "it" },
      { label: "Chronostratigraphy", language: "en" },
    ],
    "it",
    logger as unknown as Pick<FastifyBaseLogger, "warn">
  );

  assert.equal(name, "Cronostratigrafia");
  assert.equal(warnings.length, 0);
});

test("falls back to English when the requested language is missing", () => {
  const { logger, warnings } = createLoggerSpy();
  const name = resolveVocabularyListingName(
    "lithology",
    [{ label: "Lithology", language: "en" }],
    "it",
    logger as unknown as Pick<FastifyBaseLogger, "warn">
  );

  assert.equal(name, "Lithology");
  assert.deepEqual(warnings, [
    {
      context: {
        vocabularyId: "lithology",
        requestedLang: "it",
        fallbackSource: "en",
      },
      message: "Falling back while resolving vocabulary listing label.",
    },
  ]);
});

test("falls back to the configured English name when GraphDB has no usable label", () => {
  const { logger, warnings } = createLoggerSpy();
  const name = resolveVocabularyListingName(
    "tectonic-units",
    [],
    "it",
    logger as unknown as Pick<FastifyBaseLogger, "warn">
  );

  assert.equal(name, "Tectonic Units");
  assert.deepEqual(warnings, [
    {
      context: {
        vocabularyId: "tectonic-units",
        requestedLang: "it",
        fallbackSource: "config",
      },
      message: "Falling back while resolving vocabulary listing label.",
    },
  ]);
});
