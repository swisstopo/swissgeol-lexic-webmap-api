/**
 * @fileoverview Verifies WMTS source response construction from configured layers.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getWmtsSourceResponse } from "../../src/services/wmts/wmtsSourceService";

test("builds the WMTS source response for a configured layer", () => {
  const response = getWmtsSourceResponse("gc_bedrock", {
    baseUrl: "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo",
    requestTimeoutMs: 30_000,
  });

  assert.deepEqual(response, {
    layerId: "gc_bedrock",
    source: {
      urlWMTS:
        "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo/gc_bedrock/gwc/service/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities",
      paramsWMTS: {
        layer: "gc_bedrock",
        style: "swisstopo:gc_bedrock",
        matrixSet: "EPSG:2056",
        format: "image/png",
      },
      serverType: "geoserver",
      crossOrigin: "anonymous",
    },
  });
});

test("returns null when the layer is not configured for WMTS", () => {
  const response = getWmtsSourceResponse("unknown_layer", {
    baseUrl: "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo",
    requestTimeoutMs: 30_000,
  });

  assert.equal(response, null);
});
