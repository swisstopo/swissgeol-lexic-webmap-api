/**
 * @fileoverview Verifies SEMANTIC_FILTER parser integration and resolver
 * adaptation.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  createSemanticFilterSolver,
  SemanticFilterInputError,
} from "../../src/services/wms/semanticFilterParameterService";

type ResolverCall = {
  layerName: string;
  filterType: string;
  params: unknown;
};

const createRecordingSolver = (responses: string[]) => {
  const calls: ResolverCall[] = [];
  let responseIndex = 0;

  const solver = createSemanticFilterSolver({
    calculateSemanticConstraint: async (
      layerName: string,
      filterType: string,
      params: unknown
    ): Promise<string> => {
      calls.push({ layerName, filterType, params });
      const response = responses[responseIndex];
      responseIndex += 1;
      return response ?? "fallback";
    },
  });

  return { calls, solver };
};

test("resolves one semantic constraint to CQL", async () => {
  const { calls, solver } = createRecordingSolver(['"kind" = \'sedimentary\'']);

  const result = await solver(
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" )'
  );

  assert.equal(result, '"kind" = \'sedimentary\'');
  assert.deepEqual(calls, [
    {
      layerName: "gc_bedrock",
      filterType: "f-byAttribute",
      params: ["kind", "sedimentary"],
    },
  ]);
});

test("resolves multiple constraints and preserves AND", async () => {
  const { calls, solver } = createRecordingSolver([
    '"kind" = \'sedimentary\'',
    '"rank" = \'primary\'',
  ]);

  const result = await solver(
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" ) AND calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "rank" , "primary" )'
  );

  assert.equal(result, '"kind" = \'sedimentary\' AND "rank" = \'primary\'');
  assert.equal(calls.length, 2);
});

test("converts term includeNarrowers false to a boolean", async () => {
  const { calls, solver } = createRecordingSolver(['"litho_lexic_1" IN ( \'uri\' )']);

  await solver(
    'calculate_semantic_constraint( "gc_bedrock" , "f-lithology-term" , "uri" , "false" )'
  );

  assert.deepEqual(calls, [
    {
      layerName: "gc_bedrock",
      filterType: "f-lithology-term",
      params: ["uri", false],
    },
  ]);
});

test("rejects invalid includeNarrowers values before constraint resolution", async () => {
  const { calls, solver } = createRecordingSolver(["unused"]);

  await assert.rejects(
    () =>
      solver(
        'calculate_semantic_constraint( "gc_bedrock" , "f-lithology-term" , "uri" , "invalid" )'
      ),
    SemanticFilterInputError
  );
  assert.equal(calls.length, 0);
});

test("uses the cache for repeated identical constraints", async () => {
  const { calls, solver } = createRecordingSolver(['"kind" = \'sedimentary\'']);

  const result = await solver(
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" ) AND calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" )'
  );

  assert.equal(result, '"kind" = \'sedimentary\' AND "kind" = \'sedimentary\'');
  assert.equal(calls.length, 1);
});

test("expires cached semantic constraints after the configured TTL", async () => {
  const calls: ResolverCall[] = [];
  let currentTime = 1000;
  const solver = createSemanticFilterSolver({
    cacheTtlMs: 10,
    now: () => currentTime,
    calculateSemanticConstraint: async (
      layerName: string,
      filterType: string,
      params: unknown
    ): Promise<string> => {
      calls.push({ layerName, filterType, params });
      return `"kind" = 'sedimentary-${calls.length}'`;
    },
  });
  const expression =
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" )';

  assert.equal(await solver(expression), `"kind" = 'sedimentary-1'`);
  currentTime = 1005;
  assert.equal(await solver(expression), `"kind" = 'sedimentary-1'`);
  currentTime = 1011;
  assert.equal(await solver(expression), `"kind" = 'sedimentary-2'`);
  assert.equal(calls.length, 2);
});

test("evicts the oldest semantic constraint when the cache is full", async () => {
  const calls: ResolverCall[] = [];
  const solver = createSemanticFilterSolver({
    cacheMaxEntries: 1,
    calculateSemanticConstraint: async (
      layerName: string,
      filterType: string,
      params: unknown
    ): Promise<string> => {
      calls.push({ layerName, filterType, params });
      return `"${String((params as string[])[1])}"`;
    },
  });
  const firstExpression =
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "first" )';
  const secondExpression =
    'calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "second" )';

  assert.equal(await solver(firstExpression), '"first"');
  assert.equal(await solver(secondExpression), '"second"');
  assert.equal(await solver(firstExpression), '"first"');
  assert.equal(calls.length, 3);
});

test("preserves non-constraint text inside SEMANTIC_FILTER", async () => {
  const { solver } = createRecordingSolver(['"kind" = \'sedimentary\'']);

  const result = await solver(
    'status = \'active\' AND calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" )'
  );

  assert.equal(result, 'status = \'active\' AND "kind" = \'sedimentary\'');
});
