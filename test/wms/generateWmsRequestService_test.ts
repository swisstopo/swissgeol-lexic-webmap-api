/**
 * @fileoverview Verifies deterministic WMS request construction for
 * generateWmsRequest responses.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getGenerateWmsRequestResponse } from "../../src/services/wms/generateWmsRequestService";
import type { ValidatedFilter } from "../../src/types/filters/filterRequestValidationTypes";

const LITHOLOGY_TERM = "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite";
const TECTONIC_TERM =
  "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben";
const CHRONOSTRATIGRAPHY_FROM =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic";
const CHRONOSTRATIGRAPHY_TO =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous";

test("builds the WMS response body from ordered constants and the requested layer id", () => {
  assert.deepEqual(getGenerateWmsRequestResponse("tecto_units_augm"), {
    url: "https://dev-webmap-api.swissgeol.ch/wms",
    body: "REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=tecto_units_augm&TILED=true&CRS=EPSG:2056",
    mimeType: "image/png",
    note: "The WMS URL includes encoded semantic query parameters.",
  });
});

test("changes only the LAYERS parameter when a different layer id is requested", () => {
  assert.deepEqual(getGenerateWmsRequestResponse("gc_bedrock"), {
    url: "https://dev-webmap-api.swissgeol.ch/wms",
    body: "REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=gc_bedrock&TILED=true&CRS=EPSG:2056",
    mimeType: "image/png",
    note: "The WMS URL includes encoded semantic query parameters.",
  });
});

test("adds one semantic constraint for a term filter", () => {
  const filters: ValidatedFilter[] = [
    {
      filterId: "f-lithology-term",
      parameters: {
        term: LITHOLOGY_TERM,
        includeNarrowers: true,
      },
    },
  ];

  assert.equal(
    getGenerateWmsRequestResponse("gc_bedrock", filters).body,
    `REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=gc_bedrock&TILED=true&SEMANTIC_FILTER=calculate_semantic_constraint( "gc_bedrock" , "f-lithology-term" , "${LITHOLOGY_TERM}" , "true" )&CRS=EPSG:2056`
  );
});

test("defaults missing includeNarrowers to true in generated term constraints", () => {
  const filters: ValidatedFilter[] = [
    {
      filterId: "f-tectonic-term",
      parameters: {
        term: TECTONIC_TERM,
      },
    },
  ];

  assert.match(
    getGenerateWmsRequestResponse("tecto_units_augm", filters).body,
    /calculate_semantic_constraint\( "tecto_units_augm" , "f-tectonic-term" , "https:\/\/dev-lexic\.swissgeol\.ch\/TectonicUnits\/UpperRhineGraben" , "true" \)/u
  );
});

test("preserves includeNarrowers false in generated term constraints", () => {
  const filters: ValidatedFilter[] = [
    {
      filterId: "f-lithology-term",
      parameters: {
        term: LITHOLOGY_TERM,
        includeNarrowers: false,
      },
    },
  ];

  assert.match(
    getGenerateWmsRequestResponse("gc_bedrock", filters).body,
    /calculate_semantic_constraint\( "gc_bedrock" , "f-lithology-term" , "https:\/\/dev-lexic\.swissgeol\.ch\/Lithology\/Amphibolite" , "false" \)/u
  );
});

test("generates chronostratigraphy and by-attribute constraint params", () => {
  const filters: ValidatedFilter[] = [
    {
      filterId: "f-chronostrat-term",
      parameters: {
        type: "From-To",
        from: CHRONOSTRATIGRAPHY_FROM,
        to: CHRONOSTRATIGRAPHY_TO,
      },
    },
    {
      filterId: "f-byAttribute",
      parameters: {
        attribute: "kind",
        value: "sedimentary",
      },
    },
  ];

  assert.equal(
    getGenerateWmsRequestResponse("gc_bedrock", filters).body,
    `REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=swisstopo:filtered&TRANSPARENT=true&LAYERS=gc_bedrock&TILED=true&SEMANTIC_FILTER=calculate_semantic_constraint( "gc_bedrock" , "f-chronostrat-term" , "From-To" , "${CHRONOSTRATIGRAPHY_FROM}" , "${CHRONOSTRATIGRAPHY_TO}" ) AND calculate_semantic_constraint( "gc_bedrock" , "f-byAttribute" , "kind" , "sedimentary" )&CRS=EPSG:2056`
  );
});
