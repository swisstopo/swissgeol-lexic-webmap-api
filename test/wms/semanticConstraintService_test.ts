/**
 * @fileoverview Verifies semantic constraint to CQL fragment resolution.
 */

import assert from "node:assert/strict";
import test from "node:test";
import type { PublicVocabularyId } from "../../src/types/graphdb/graphDbTypes";
import {
  calculateSemanticConstraint,
  SemanticConstraintInputError,
} from "../../src/services/wms/semanticConstraintService";

const LITHOLOGY_TERM = "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite";
const CHRONOSTRATIGRAPHY_FROM =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic";
const CHRONOSTRATIGRAPHY_TO =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous";

const emptyConceptQuery = async (): Promise<string[]> => [];

const oneChildConceptQuery = async (
  _vocabularyId: PublicVocabularyId,
  _sparqlQuery: string
): Promise<string[]> => ["https://dev-lexic.swissgeol.ch/Lithology/Child"];

test("builds OR-ed CQL for a term filter across all configured target attributes", async () => {
  const result = await calculateSemanticConstraint(
    "gc_bedrock",
    "f-lithology-term",
    [LITHOLOGY_TERM, true],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: oneChildConceptQuery,
    }
  );

  assert.equal(
    result,
    `( "litho_lexic_1" IN ( '${LITHOLOGY_TERM}' , 'https://dev-lexic.swissgeol.ch/Lithology/Child' ) OR "litho_lexic_2" IN ( '${LITHOLOGY_TERM}' , 'https://dev-lexic.swissgeol.ch/Lithology/Child' ) OR "litho_lexic_3" IN ( '${LITHOLOGY_TERM}' , 'https://dev-lexic.swissgeol.ch/Lithology/Child' ) )`
  );
});

test("builds CQL for a chronostratigraphy From-To filter", async () => {
  const result = await calculateSemanticConstraint(
    "gc_bedrock",
    "f-chronostrat-term",
    ["From-To", CHRONOSTRATIGRAPHY_FROM, CHRONOSTRATIGRAPHY_TO],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: emptyConceptQuery,
    }
  );

  assert.equal(
    result,
    `( "chrono_from_lexic" IN ( '${CHRONOSTRATIGRAPHY_FROM}' , '${CHRONOSTRATIGRAPHY_TO}' ) AND "chrono_to_lexic" IN ( '${CHRONOSTRATIGRAPHY_FROM}' , '${CHRONOSTRATIGRAPHY_TO}' ) )`
  );
});

test("builds CQL for a chronostratigraphy Younger filter", async () => {
  const result = await calculateSemanticConstraint(
    "gc_bedrock",
    "f-chronostrat-term",
    ["Younger", CHRONOSTRATIGRAPHY_TO],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: emptyConceptQuery,
    }
  );

  assert.equal(
    result,
    `"chrono_to_lexic" IN ( '${CHRONOSTRATIGRAPHY_TO}' )`
  );
});

test("builds CQL for a chronostratigraphy Older filter", async () => {
  const result = await calculateSemanticConstraint(
    "gc_bedrock",
    "f-chronostrat-term",
    ["Older", CHRONOSTRATIGRAPHY_FROM],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: emptyConceptQuery,
    }
  );

  assert.equal(
    result,
    `"chrono_from_lexic" IN ( '${CHRONOSTRATIGRAPHY_FROM}' )`
  );
});

test("builds CQL for a by-attribute filter", async () => {
  const result = await calculateSemanticConstraint(
    "gc_bedrock",
    "f-byAttribute",
    ["kind", "sedimentary"]
  );

  assert.equal(result, `"kind" = 'sedimentary'`);
});

test("throws an input error when the semantic constraint cannot be validated", async () => {
  await assert.rejects(
    () =>
      calculateSemanticConstraint("gc_bedrock", "f-lithology-term", [true]),
    SemanticConstraintInputError
  );
});
