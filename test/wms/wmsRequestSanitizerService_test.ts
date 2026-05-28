/**
 * @fileoverview Verifies WMS request filter sanitization before GeoServer
 * forwarding.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeWmsRequestBody } from "../../src/services/wms/wmsRequestSanitizerService";

test("removes client CQL_FILTER when no semantic filter is present", async () => {
  assert.equal(
    await sanitizeWmsRequestBody(
      "REQUEST=GetMap&SERVICE=WMS&CQL_FILTER=stratum=1&VERSION=1.3.0&FORMAT=image/png&LAYERS=tecto_units_augm"
    ),
    "REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&LAYERS=tecto_units_augm"
  );
});

test("uses semantic filter resolution and still strips client CQL_FILTER", async () => {
  const result = await sanitizeWmsRequestBody(
    'REQUEST=GetMap&SEMANTIC_FILTER=calculate_semantic_constraint( "tecto_units_augm" , "f-tectonic-term" , "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben" , "true" )&CQL_FILTER=stratum=1&LAYERS=tecto_units_augm',
    {
      solveSemanticFilter: async (filterString: string): Promise<string> => {
        assert.equal(
          filterString,
          'calculate_semantic_constraint( "tecto_units_augm" , "f-tectonic-term" , "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben" , "true" )'
        );
        return "\"tecto_lexic\" IN ( 'resolved' )";
      },
    }
  );

  assert.equal(
    result,
    "REQUEST=GetMap&LAYERS=tecto_units_augm&CQL_FILTER=%22tecto_lexic%22%20IN%20(%20'resolved'%20)"
  );
});

test("preserves CQL-like semantic text while ignoring direct WMS CQL_FILTER", async () => {
  const result = await sanitizeWmsRequestBody(
    "REQUEST=GetMap&SEMANTIC_FILTER=status%20%3D%20'active'&CQL_FILTER=stratum=1&LAYERS=tecto_units_augm",
    {
      solveSemanticFilter: async (filterString: string): Promise<string> => {
        assert.equal(filterString, "status = 'active'");
        return filterString;
      },
    }
  );

  assert.equal(
    result,
    "REQUEST=GetMap&LAYERS=tecto_units_augm&CQL_FILTER=status%20%3D%20'active'"
  );
});

test("rejects multiple semantic filter parameters", async () => {
  await assert.rejects(
    () =>
      sanitizeWmsRequestBody(
        "REQUEST=GetMap&SEMANTIC_FILTER=one&SEMANTIC_FILTER=two"
      ),
    /must not include multiple SEMANTIC_FILTER/
  );
});

test("fails explicitly when the WMS response body is empty", async () => {
  await assert.rejects(
    () => sanitizeWmsRequestBody("   "),
    /WMS request parameters must not be empty/
  );
});

test("fails explicitly when only semantic filter parameters are provided", async () => {
  await assert.rejects(
    () =>
      sanitizeWmsRequestBody("SEMANTIC_FILTER=hidden", {
        solveSemanticFilter: async (): Promise<string> => "",
      }),
    /WMS request must include at least one forwardable parameter/
  );
});
