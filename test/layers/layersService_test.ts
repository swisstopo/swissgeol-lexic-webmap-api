/**
 * @fileoverview Verifies the `/layers` service response is derived from the
 * backend layer configuration instead of the legacy mock dataset.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getFilterableLayerConfigurations } from "../../src/layers/configuration";
import { LAYER_FILTER_CATALOG } from "../../src/layers/filterCatalog";
import {
  getLayerFiltersResponse,
  getLayersResponse,
} from "../../src/services/layersService";

test("builds the /layers payload from filterable configured layers only", () => {
  const response = getLayersResponse();

  const expectedLayers = getFilterableLayerConfigurations().map((layer) => ({
    id: layer.id,
    name: layer.name,
    filterable: layer.filterable,
    availableFilters: layer.filterIds.map((filterId) => ({
      id: filterId,
      name: LAYER_FILTER_CATALOG[filterId].name,
      title: LAYER_FILTER_CATALOG[filterId].title,
      description: LAYER_FILTER_CATALOG[filterId].description,
    })),
  }));

  assert.deepEqual(response, {
    webmapId: "SwissTopoMap",
    layers: expectedLayers,
  });
});

test("builds the /layers/{layerId}/filters payload from configured layer filters only", () => {
  assert.deepEqual(getLayerFiltersResponse("gc_bedrock"), {
    layerId: "gc_bedrock",
    filters: [
      LAYER_FILTER_CATALOG["f-chronostrat-term"],
      LAYER_FILTER_CATALOG["f-tectonic-term"],
      LAYER_FILTER_CATALOG["f-lithostrat-term"],
      LAYER_FILTER_CATALOG["f-lithology-term"],
      LAYER_FILTER_CATALOG["f-byAttribute"],
    ],
  });
});

test("returns null for /layers/{layerId}/filters when the layer is not configured", () => {
  assert.equal(getLayerFiltersResponse("TK500"), null);
});
