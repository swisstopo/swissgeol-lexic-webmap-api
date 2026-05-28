/**
 * @fileoverview Verifies vocabulary-layer mappings are derived from the
 * backend layer/filter configuration instead of the legacy mock dataset.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getVocabularyLayers } from "../../src/services/vocabularies/vocabService";

test("builds vocabulary layers from configured filter support", () => {
  assert.deepEqual(getVocabularyLayers("chronostratigraphy"), {
    layers: [
      { id: "tecto_units_augm", name: "Tectonic Units" },
      { id: "gc_bedrock", name: "GC_BEDROCK" },
      { id: "gc_unco_deposits", name: "GC_UNCO_DEPOSITS" },
    ],
  });

  assert.deepEqual(getVocabularyLayers("tectonic-units"), {
    layers: [
      { id: "tecto_units_augm", name: "Tectonic Units" },
      { id: "gc_bedrock", name: "GC_BEDROCK" },
    ],
  });

  assert.deepEqual(getVocabularyLayers("lithology"), {
    layers: [{ id: "gc_bedrock", name: "GC_BEDROCK" }],
  });
});

test("returns null for unknown vocabulary ids", () => {
  assert.equal(getVocabularyLayers("unknown-vocabulary"), null);
});
