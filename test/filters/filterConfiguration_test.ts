/**
 * @fileoverview Verifies the backend filter-type configuration and the
 * layer-owned filter bindings extracted from the current WebMap Sandbox.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTermFilterNarrowersQuery,
  CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
  CHRONOSTRATIGRAPHY_QUERY_OLDER,
  CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
} from "../../src/graphdb/queryCatalog";
import {
  getAllLayerConfigurations,
  getLayerConfigurationById,
  getLayerIdsSupportingFilterId,
} from "../../src/layers/configuration";
import {
  getAllFilterConfigurations,
  getFilterConfigurationById,
  getTermFilterConfigurationByVocabularyId,
  getVocabularyFilterId,
  getVocabularyIdByFilterId,
} from "../../src/filters/configuration";

test("contains standalone backend configuration for the supported public filters", () => {
  assert.deepEqual(getAllFilterConfigurations(), [
    {
      filterId: "f-chronostrat-term",
      vocabularyId: "chronostratigraphy",
      queryYounger: CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
      queryOlder: CHRONOSTRATIGRAPHY_QUERY_OLDER,
      queryBetween: CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
    },
    {
      filterId: "f-tectonic-term",
      vocabularyId: "tectonic-units",
      queryNarrower: buildTermFilterNarrowersQuery("tectonic-units"),
    },
    {
      filterId: "f-lithostrat-term",
      vocabularyId: "lithostratigraphy",
      queryNarrower: buildTermFilterNarrowersQuery("lithostratigraphy"),
    },
    {
      filterId: "f-lithology-term",
      vocabularyId: "lithology",
      queryNarrower: buildTermFilterNarrowersQuery("lithology"),
    },
    {
      filterId: "f-byAttribute",
    },
  ]);
});

test("keeps filter support ownership on the public layer registry", () => {
  for (const layerConfiguration of getAllLayerConfigurations()) {
    for (const filterId of layerConfiguration.filterIds) {
      assert.ok(
        getFilterConfigurationById(filterId),
        `Missing filter config for ${filterId}.`
      );
    }
  }
});

test("maps vocabularies to public filter ids and back", () => {
  assert.equal(getVocabularyFilterId("chronostratigraphy"), "f-chronostrat-term");
  assert.equal(getVocabularyFilterId("tectonic-units"), "f-tectonic-term");
  assert.equal(getVocabularyFilterId("lithostratigraphy"), "f-lithostrat-term");
  assert.equal(getVocabularyFilterId("lithology"), "f-lithology-term");

  assert.equal(getVocabularyIdByFilterId("f-chronostrat-term"), "chronostratigraphy");
  assert.equal(getVocabularyIdByFilterId("f-tectonic-term"), "tectonic-units");
  assert.equal(getVocabularyIdByFilterId("f-lithostrat-term"), "lithostratigraphy");
  assert.equal(getVocabularyIdByFilterId("f-lithology-term"), "lithology");
  assert.equal(getVocabularyIdByFilterId("f-byAttribute"), null);
});

test("exposes reusable semantic filter behavior without layer knowledge", () => {
  const chronostrat = getFilterConfigurationById("f-chronostrat-term");
  const tectonic = getFilterConfigurationById("f-tectonic-term");
  const lithostrat = getFilterConfigurationById("f-lithostrat-term");
  const lithology = getFilterConfigurationById("f-lithology-term");
  const byAttribute = getFilterConfigurationById("f-byAttribute");

  assert.deepEqual(chronostrat, {
    filterId: "f-chronostrat-term",
    vocabularyId: "chronostratigraphy",
    queryYounger: CHRONOSTRATIGRAPHY_QUERY_YOUNGER,
    queryOlder: CHRONOSTRATIGRAPHY_QUERY_OLDER,
    queryBetween: CHRONOSTRATIGRAPHY_QUERY_BETWEEN,
  });
  assert.deepEqual(tectonic, {
    filterId: "f-tectonic-term",
    vocabularyId: "tectonic-units",
    queryNarrower: buildTermFilterNarrowersQuery("tectonic-units"),
  });
  assert.deepEqual(lithostrat, {
    filterId: "f-lithostrat-term",
    vocabularyId: "lithostratigraphy",
    queryNarrower: buildTermFilterNarrowersQuery("lithostratigraphy"),
  });
  assert.deepEqual(lithology, {
    filterId: "f-lithology-term",
    vocabularyId: "lithology",
    queryNarrower: buildTermFilterNarrowersQuery("lithology"),
  });
  assert.deepEqual(byAttribute, {
    filterId: "f-byAttribute",
  });
});

test("resolves term filter configuration from vocabulary ids", () => {
  assert.deepEqual(
    getTermFilterConfigurationByVocabularyId("tectonic-units"),
    getFilterConfigurationById("f-tectonic-term")
  );
  assert.deepEqual(
    getTermFilterConfigurationByVocabularyId("lithostratigraphy"),
    getFilterConfigurationById("f-lithostrat-term")
  );
  assert.deepEqual(
    getTermFilterConfigurationByVocabularyId("lithology"),
    getFilterConfigurationById("f-lithology-term")
  );
});

test("stores layer-specific filter configuration on the layer registry", () => {
  const tectoUnits = getLayerConfigurationById("tecto_units_augm");
  const bedrock = getLayerConfigurationById("gc_bedrock");
  const unconsolidated = getLayerConfigurationById("gc_unco_deposits");

  assert.deepEqual(tectoUnits?.filterConfiguration?.["f-tectonic-term"], {
    attributeToFilter: ["tecto_lexic"],
  });
  assert.deepEqual(tectoUnits?.filterConfiguration?.["f-byAttribute"], {
    excludedAttributes: [
      "chrono_from_lexic",
      "chrono_to_lexic",
      "tecto_lexic",
    ],
  });

  assert.deepEqual(bedrock?.filterConfiguration?.["f-lithostrat-term"], {
    attributeToFilter: ["litstrat_lexic"],
  });
  assert.deepEqual(bedrock?.filterConfiguration?.["f-lithology-term"], {
    attributeToFilter: [
      "litho_lexic_1",
      "litho_lexic_2",
      "litho_lexic_3",
    ],
  });

  assert.deepEqual(unconsolidated?.filterConfiguration?.["f-chronostrat-term"], {
    columnToFilterOld: "chrono_from_lexic",
    columnToFilterYon: "chrono_to_lexic",
  });
  assert.deepEqual(unconsolidated?.filterConfiguration?.["f-byAttribute"], {
    excludedAttributes: [
      "chrono_from_lexic",
      "chrono_to_lexic",
    ],
  });
});

test("tracks which configured layers support each vocabulary-backed filter", () => {
  assert.deepEqual(
    getLayerIdsSupportingFilterId(getVocabularyFilterId("chronostratigraphy")),
    [
      "tecto_units_augm",
      "gc_bedrock",
      "gc_unco_deposits",
    ]
  );
  assert.deepEqual(
    getLayerIdsSupportingFilterId(getVocabularyFilterId("tectonic-units")),
    [
      "tecto_units_augm",
      "gc_bedrock",
    ]
  );
  assert.deepEqual(
    getLayerIdsSupportingFilterId(getVocabularyFilterId("lithostratigraphy")),
    ["gc_bedrock"]
  );
  assert.deepEqual(
    getLayerIdsSupportingFilterId(getVocabularyFilterId("lithology")),
    ["gc_bedrock"]
  );
});

test("stores reusable GraphDB query templates for semantic filters", () => {
  const chrono = getFilterConfigurationById("f-chronostrat-term");
  const lithology = getFilterConfigurationById("f-lithology-term");

  assert.equal(chrono.queryYounger, CHRONOSTRATIGRAPHY_QUERY_YOUNGER);
  assert.equal(chrono.queryOlder, CHRONOSTRATIGRAPHY_QUERY_OLDER);
  assert.equal(chrono.queryBetween, CHRONOSTRATIGRAPHY_QUERY_BETWEEN);

  assert.equal(
    lithology.queryNarrower,
    buildTermFilterNarrowersQuery("lithology")
  );
});
