/**
 * @fileoverview Verifies the internal semantic resolver foundation used by
 * future WMS filter execution.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveChronostratigraphyConcepts,
  resolveTermFilterNarrowers,
} from "../../src/services/graphdb/filterSemanticResolverService";
import type { SemanticConceptQueryExecutor } from "../../src/types/graphdb/filterSemanticResolverTypes";
import type { PublicVocabularyId } from "../../src/types/graphdb/graphDbTypes";

test("resolves narrower terms through the configured term filter query", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute: SemanticConceptQueryExecutor = async (vocabularyId, sparqlQuery) => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return ["urn:concept:narrower-a", "urn:concept:narrower-b"];
  };

  const concepts = await resolveTermFilterNarrowers(
    "lithology",
    "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
    "https://dev-lexic.swissgeol.ch",
    execute
  );

  assert.deepEqual(concepts, ["urn:concept:narrower-a", "urn:concept:narrower-b"]);
  assert.deepEqual(executedQueries, [
    {
      vocabularyId: "lithology",
      sparqlQuery:
        "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
        "PREFIX ex: <https://dev-lexic.swissgeol.ch/Lithology/>\n\n" +
        "SELECT ?concept\n\n" +
        "WHERE { \n" +
        "ex:Amphibolite skos:narrower+ ?concept.\n" +
        "}",
    },
  ]);
});

test("resolves chronostratigraphy concept queries for younger and between modes", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute: SemanticConceptQueryExecutor = async (vocabularyId, sparqlQuery) => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return ["urn:concept:match"];
  };

  const youngerConcepts = await resolveChronostratigraphyConcepts(
    {
      mode: "younger",
      term: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
    },
    "https://dev-lexic.swissgeol.ch",
    execute
  );

  const betweenConcepts = await resolveChronostratigraphyConcepts(
    {
      mode: "between",
      olderTerm: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Triassic",
      youngerTerm: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
    },
    "https://dev-lexic.swissgeol.ch",
    execute
  );

  assert.deepEqual(youngerConcepts, ["urn:concept:match"]);
  assert.deepEqual(betweenConcepts, ["urn:concept:match"]);
  assert.equal(executedQueries[0]?.vocabularyId, "chronostratigraphy");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /PREFIX ex: <https:\/\/dev-lexic\.swissgeol\.ch\/Chronostratigraphy\/>/);
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Jurassic/);
  assert.equal(executedQueries[1]?.vocabularyId, "chronostratigraphy");
  assert.match(executedQueries[1]?.sparqlQuery ?? "", /ex:Triassic/);
  assert.match(executedQueries[1]?.sparqlQuery ?? "", /ex:Jurassic/);
});

test("rejects term filters when the term URI vocabulary does not match the filter vocabulary", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute: SemanticConceptQueryExecutor = async (vocabularyId, sparqlQuery) => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [];
  };

  await assert.rejects(
    () =>
      resolveTermFilterNarrowers(
        "lithology",
        "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben",
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'lithology'/
  );

  await assert.rejects(
    () =>
      resolveTermFilterNarrowers(
        "tectonic-units",
        "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'tectonic-units'/
  );

  await assert.rejects(
    () =>
      resolveTermFilterNarrowers(
        "lithostratigraphy",
        "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic",
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'lithostratigraphy'/
  );

  assert.deepEqual(executedQueries, []);
});

test("rejects term filters when the term URI is outside the supported vocabulary base", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute: SemanticConceptQueryExecutor = async (vocabularyId, sparqlQuery) => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [];
  };

  await assert.rejects(
    () =>
      resolveTermFilterNarrowers(
        "lithostratigraphy",
        "https://evil.example/Lithostratigraphy/Servino",
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'lithostratigraphy'/
  );

  assert.deepEqual(executedQueries, []);
});

test("rejects chronostratigraphy filters when boundary term URIs are not chronostratigraphy terms", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute: SemanticConceptQueryExecutor = async (vocabularyId, sparqlQuery) => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [];
  };

  await assert.rejects(
    () =>
      resolveChronostratigraphyConcepts(
        {
          mode: "younger",
          term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
        },
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'chronostratigraphy'/
  );

  await assert.rejects(
    () =>
      resolveChronostratigraphyConcepts(
        {
          mode: "between",
          olderTerm: "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Triassic",
          youngerTerm: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
        },
        "https://dev-lexic.swissgeol.ch",
        execute
      ),
    /Term URI does not belong to vocabulary 'chronostratigraphy'/
  );

  assert.deepEqual(executedQueries, []);
});
