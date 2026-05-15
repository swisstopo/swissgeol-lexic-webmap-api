/**
 * @fileoverview Verifies public vocabulary-id helpers exposed by the GraphDB
 * vocabulary definition registry.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  inferVocabularyIdFromTermUri,
  isPublicVocabularyId,
  getGraphDbVocabularyDefinition,
} from "../../src/graphdb/vocabularyDefinitions";

test("recognizes supported public vocabulary ids", () => {
  assert.equal(isPublicVocabularyId("chronostratigraphy"), true);
  assert.equal(isPublicVocabularyId("tectonic-units"), true);
  assert.equal(isPublicVocabularyId("unknown-vocabulary"), false);
});

test("infers supported public vocabulary ids from term URIs", () => {
  assert.equal(
    inferVocabularyIdFromTermUri(
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic"
    ),
    "chronostratigraphy"
  );
  assert.equal(
    inferVocabularyIdFromTermUri(
      "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben"
    ),
    "tectonic-units"
  );
  assert.equal(
    inferVocabularyIdFromTermUri("https://dev-lexic.swissgeol.ch/Unknown/Nope"),
    null
  );
  assert.equal(
    inferVocabularyIdFromTermUri("https://evil.example/Lithology/Amphibolite"),
    null
  );
});

test("prefers the configured vocabulary prefix when validating term URIs", () => {
  assert.equal(
    inferVocabularyIdFromTermUri(
      "https://example.test/lexic/Lithology/CustomLithology",
      "https://example.test/lexic"
    ),
    "lithology"
  );
  assert.equal(
    inferVocabularyIdFromTermUri(
      "https://example.test/Lithology/CustomLithology",
      "https://example.test/lexic"
    ),
    null
  );
});

test("resolves metadata for supported public vocabulary ids", () => {
  if (!isPublicVocabularyId("lithology")) {
    assert.fail("Expected lithology to be recognized as a public vocabulary id.");
  }

  assert.deepEqual(getGraphDbVocabularyDefinition("lithology"), {
    id: "lithology",
    uriSegment: "Lithology",
    repositoryEnvVar: "LITHOLOGY_REPO_ID",
    defaultNameEn: "Lithology",
    vocabularyListingSchemeUri: "https://dev-lexic.swissgeol.ch/Lithology/",
  });
});
