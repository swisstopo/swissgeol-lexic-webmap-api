/**
 * @fileoverview Verifies the phase-1 backend layer configuration extracted from
 * the current WebMap Sandbox baseline.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllLayerConfigurations,
  getFilterableLayerConfigurations,
  getLayerConfigurationById,
  supportsAttributeList,
} from "../../src/services/layers/layerConfigurationRegistry";
import { LAYER_FILTER_CATALOG } from "../../src/configuration/layers/catalogs/filterCatalog";

test("contains only filterable layers from the current sandbox baseline", () => {
  const layerIds = getAllLayerConfigurations().map((layer) => layer.id);

  assert.deepEqual(layerIds, [
    "tecto_units_augm",
    "gc_bedrock",
    "gc_unco_deposits",
  ]);
});

test("returns only filterable layers for the public /layers payload", () => {
  const layerIds = getFilterableLayerConfigurations().map((layer) => layer.id);

  assert.deepEqual(layerIds, [
    "tecto_units_augm",
    "gc_bedrock",
    "gc_unco_deposits",
  ]);
});

test("exposes attribute source only for layers that support attribute list", () => {
  assert.equal(supportsAttributeList("TK500"), false);
  assert.equal(supportsAttributeList("gc_bedrock"), true);
  assert.equal(supportsAttributeList("gc_unco_deposits"), true);
  assert.equal(getLayerConfigurationById("TK500"), undefined);

  assert.deepEqual(getLayerConfigurationById("tecto_units_augm")?.attributeSource, {
    typeName: "tecto_units_augm",
  });
  assert.deepEqual(getLayerConfigurationById("gc_bedrock")?.attributeSource, {
    typeName: "gc_bedrock",
  });
  assert.deepEqual(
    getLayerConfigurationById("gc_unco_deposits")?.attributeSource,
    {
      typeName: "gc_unco_deposits",
    }
  );
});

test("keeps every configured filter id compatible with the public filter catalog", () => {
  for (const layer of getAllLayerConfigurations()) {
    for (const filterId of layer.filterIds) {
      assert.ok(
        LAYER_FILTER_CATALOG[filterId],
        `Missing public filter metadata for '${filterId}'.`
      );
    }
  }
});
