/**
 * @fileoverview Verifies `/layers/{layerId}/defaultFilters` is derived from
 * configured layers and term URI inference instead of the legacy mock term set.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultFiltersResponse } from "../../src/services/layersService";

test("returns 404 when the layer is not configured even if the term uses a supported vocabulary", () => {
  assert.deepEqual(
    getDefaultFiltersResponse(
      "TK500",
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Phanerozoic"
    ),
    {
      error: {
        statusCode: 404,
        message: "Layer not found",
      },
    }
  );
});

test("infers chronostratigraphy from the term URI and returns no default filters", () => {
  assert.deepEqual(
    getDefaultFiltersResponse(
      "gc_bedrock",
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/CustomInterval"
    ),
    {
      response: {
        layerId: "gc_bedrock",
        filters: [],
      },
    }
  );
});

test("infers term filters from the term URI even when the term is not part of the mock dataset", () => {
  assert.deepEqual(
    getDefaultFiltersResponse(
      "gc_bedrock",
      "https://dev-lexic.swissgeol.ch/Lithology/CustomLithology"
    ),
    {
      response: {
        layerId: "gc_bedrock",
        filters: [
          {
            filterId: "f-lithology-term",
            parameters: {
              term: "https://dev-lexic.swissgeol.ch/Lithology/CustomLithology",
              includeNarrowers: true,
            },
          },
        ],
      },
    }
  );
});

test("rejects term URIs outside the supported SwissGeol vocabulary base URLs", () => {
  assert.deepEqual(
    getDefaultFiltersResponse(
      "gc_bedrock",
      "https://evil.example/Lithology/CustomLithology"
    ),
    {
      error: {
        statusCode: 400,
        message: "Layer does not support the vocabulary inferred from the provided term",
      },
    }
  );
});
