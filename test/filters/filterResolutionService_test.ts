/**
 * @fileoverview Verifies runtime filter resolution before map-service URL
 * construction happens.
 */

import assert from "node:assert/strict";
import test from "node:test";
import type { PublicVocabularyId } from "../../src/types/graphdb/graphDbTypes";
import { resolveFiltersForLayer } from "../../src/services/filters/filterResolutionService";

const TECTONIC_TERM =
  "https://dev-lexic.swissgeol.ch/TectonicUnits/UpperRhineGraben";
const LITHOSTRATIGRAPHY_TERM =
  "https://dev-lexic.swissgeol.ch/Lithostratigraphy/Servino";
const LITHOLOGY_TERM = "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite";
const CHRONOSTRATIGRAPHY_OLDER_TERM =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Triassic";
const CHRONOSTRATIGRAPHY_YOUNGER_TERM =
  "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Jurassic";

test("resolves a tectonic filter without narrower concepts", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return ["urn:unexpected:narrower"];
  };

  const result = await resolveFiltersForLayer(
    "tecto_units_augm",
    [
      {
        filterId: "f-tectonic-term",
        parameters: {
          term: TECTONIC_TERM,
          includeNarrowers: false,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.equal(result.layer?.id, "tecto_units_augm");
  assert.deepEqual(result.resolvedFilters, [
    {
      filterId: "f-tectonic-term",
      type: "term",
      vocabularyId: "tectonic-units",
      targetAttributes: ["tecto_lexic"],
      resolvedTerms: [TECTONIC_TERM],
    },
  ]);
  assert.deepEqual(executedQueries, []);
});

test("resolves a tectonic filter with selected and narrower concepts once", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [
      "https://dev-lexic.swissgeol.ch/TectonicUnits/ChildA",
      TECTONIC_TERM,
      "https://dev-lexic.swissgeol.ch/TectonicUnits/ChildB",
    ];
  };

  const result = await resolveFiltersForLayer(
    "tecto_units_augm",
    [
      {
        filterId: "f-tectonic-term",
        parameters: {
          term: TECTONIC_TERM,
          includeNarrowers: true,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-tectonic-term",
    type: "term",
    vocabularyId: "tectonic-units",
    targetAttributes: ["tecto_lexic"],
    resolvedTerms: [
      TECTONIC_TERM,
      "https://dev-lexic.swissgeol.ch/TectonicUnits/ChildA",
      "https://dev-lexic.swissgeol.ch/TectonicUnits/ChildB",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "tectonic-units");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:UpperRhineGraben/);
});

test("resolves tectonic filter attributes from each configured layer", async () => {
  const execute = async (): Promise<string[]> => [];

  const tectoUnitsResult = await resolveFiltersForLayer(
    "tecto_units_augm",
    [
      {
        filterId: "f-tectonic-term",
        parameters: {
          term: TECTONIC_TERM,
          includeNarrowers: false,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );
  const bedrockResult = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-tectonic-term",
        parameters: {
          term: TECTONIC_TERM,
          includeNarrowers: false,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  const tectoUnitsFilter = tectoUnitsResult.resolvedFilters?.[0];
  const bedrockFilter = bedrockResult.resolvedFilters?.[0];
  if (tectoUnitsFilter?.type !== "term" || bedrockFilter?.type !== "term") {
    assert.fail("Expected term filter resolution results");
  }

  assert.deepEqual(tectoUnitsFilter.targetAttributes, ["tecto_lexic"]);
  assert.deepEqual(bedrockFilter.targetAttributes, ["tecto_lexic"]);
});

test("resolves a lithostratigraphy filter for the bedrock layer", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return ["https://dev-lexic.swissgeol.ch/Lithostratigraphy/ChildUnit"];
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-lithostrat-term",
        parameters: {
          term: LITHOSTRATIGRAPHY_TERM,
          includeNarrowers: true,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-lithostrat-term",
    type: "term",
    vocabularyId: "lithostratigraphy",
    targetAttributes: ["litstrat_lexic"],
    resolvedTerms: [
      LITHOSTRATIGRAPHY_TERM,
      "https://dev-lexic.swissgeol.ch/Lithostratigraphy/ChildUnit",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "lithostratigraphy");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Servino/);
});

test("returns validation error before resolving unsupported lithostratigraphy filters", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [];
  };

  const result = await resolveFiltersForLayer(
    "tecto_units_augm",
    [
      {
        filterId: "f-lithostrat-term",
        parameters: {
          term: LITHOSTRATIGRAPHY_TERM,
          includeNarrowers: true,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.deepEqual(result, {
    error: {
      statusCode: 400,
      message: "Layer does not support filter 'f-lithostrat-term'",
    },
  });
  assert.deepEqual(executedQueries, []);
});

test("resolves a lithology filter for the bedrock layer", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [
      "https://dev-lexic.swissgeol.ch/Lithology/ChildLithologyA",
      LITHOLOGY_TERM,
      "https://dev-lexic.swissgeol.ch/Lithology/ChildLithologyB",
    ];
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-lithology-term",
        parameters: {
          term: LITHOLOGY_TERM,
          includeNarrowers: true,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-lithology-term",
    type: "term",
    vocabularyId: "lithology",
    targetAttributes: ["litho_lexic_1", "litho_lexic_2", "litho_lexic_3"],
    resolvedTerms: [
      LITHOLOGY_TERM,
      "https://dev-lexic.swissgeol.ch/Lithology/ChildLithologyA",
      "https://dev-lexic.swissgeol.ch/Lithology/ChildLithologyB",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "lithology");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Amphibolite/);
});

test("resolves a younger chronostratigraphy filter from the to boundary", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
      CHRONOSTRATIGRAPHY_YOUNGER_TERM,
    ];
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "Younger",
          to: CHRONOSTRATIGRAPHY_YOUNGER_TERM,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-chronostrat-term",
    type: "chronostratigraphy",
    mode: "younger",
    vocabularyId: "chronostratigraphy",
    targetAttributes: {
      from: "chrono_from_lexic",
      to: "chrono_to_lexic",
    },
    boundaryTerms: {
      to: CHRONOSTRATIGRAPHY_YOUNGER_TERM,
    },
    resolvedTerms: [
      CHRONOSTRATIGRAPHY_YOUNGER_TERM,
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Cretaceous",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "chronostratigraphy");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Jurassic/);
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /intervalMeets/);
});

test("resolves an older chronostratigraphy filter from the from boundary", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Permian",
      CHRONOSTRATIGRAPHY_OLDER_TERM,
    ];
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "Older",
          from: CHRONOSTRATIGRAPHY_OLDER_TERM,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-chronostrat-term",
    type: "chronostratigraphy",
    mode: "older",
    vocabularyId: "chronostratigraphy",
    targetAttributes: {
      from: "chrono_from_lexic",
      to: "chrono_to_lexic",
    },
    boundaryTerms: {
      from: CHRONOSTRATIGRAPHY_OLDER_TERM,
    },
    resolvedTerms: [
      CHRONOSTRATIGRAPHY_OLDER_TERM,
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/Permian",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "chronostratigraphy");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Triassic/);
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /intervalMetBy/);
});

test("resolves a from-to chronostratigraphy filter from both boundaries", async () => {
  const executedQueries: Array<{
    vocabularyId: PublicVocabularyId;
    sparqlQuery: string;
  }> = [];
  const execute = async (
    vocabularyId: PublicVocabularyId,
    sparqlQuery: string
  ): Promise<string[]> => {
    executedQueries.push({ vocabularyId, sparqlQuery });
    return [
      CHRONOSTRATIGRAPHY_OLDER_TERM,
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/BetweenStage",
      CHRONOSTRATIGRAPHY_YOUNGER_TERM,
    ];
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-chronostrat-term",
        parameters: {
          type: "From-To",
          from: CHRONOSTRATIGRAPHY_OLDER_TERM,
          to: CHRONOSTRATIGRAPHY_YOUNGER_TERM,
        },
      },
    ],
    {
      vocabularyPrefixUrl: "https://dev-lexic.swissgeol.ch",
      executeConceptQuery: execute,
    }
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters?.[0], {
    filterId: "f-chronostrat-term",
    type: "chronostratigraphy",
    mode: "between",
    vocabularyId: "chronostratigraphy",
    targetAttributes: {
      from: "chrono_from_lexic",
      to: "chrono_to_lexic",
    },
    boundaryTerms: {
      from: CHRONOSTRATIGRAPHY_OLDER_TERM,
      to: CHRONOSTRATIGRAPHY_YOUNGER_TERM,
    },
    resolvedTerms: [
      CHRONOSTRATIGRAPHY_OLDER_TERM,
      CHRONOSTRATIGRAPHY_YOUNGER_TERM,
      "https://dev-lexic.swissgeol.ch/Chronostratigraphy/BetweenStage",
    ],
  });
  assert.equal(executedQueries.length, 1);
  assert.equal(executedQueries[0]?.vocabularyId, "chronostratigraphy");
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Triassic/);
  assert.match(executedQueries[0]?.sparqlQuery ?? "", /ex:Jurassic/);
});

test("resolves an allowed by-attribute filter with injected layer attributes", async () => {
  const requestedLayerIds: string[] = [];
  const options = {
    getLayerAttributes: async (layerId: string): Promise<string[]> => {
      requestedLayerIds.push(layerId);
      return ["kind", "objectid"];
    },
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "kind",
          value: "sedimentary",
        },
      },
    ],
    options
  );

  assert.equal(result.error, undefined);
  assert.deepEqual(result.resolvedFilters, [
    {
      filterId: "f-byAttribute",
      type: "byAttribute",
      layerId: "gc_bedrock",
      attribute: "kind",
      value: "sedimentary",
    },
  ]);
  assert.deepEqual(requestedLayerIds, ["gc_bedrock"]);
});

test("returns validation error for unknown by-attribute metadata", async () => {
  const options = {
    getLayerAttributes: async (): Promise<string[]> => ["kind", "objectid"],
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "unknown_attribute",
          value: "sedimentary",
        },
      },
    ],
    options
  );

  assert.deepEqual(result, {
    error: {
      statusCode: 400,
      message:
        "Layer attribute 'unknown_attribute' is not available for filter 'f-byAttribute'",
    },
  });
});

test("rejects excluded by-attribute filters before checking injected metadata", async () => {
  const requestedLayerIds: string[] = [];
  const options = {
    getLayerAttributes: async (layerId: string): Promise<string[]> => {
      requestedLayerIds.push(layerId);
      return ["chrono_from_lexic"];
    },
  };

  const result = await resolveFiltersForLayer(
    "gc_bedrock",
    [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: " chrono_from_lexic ",
          value: "Jurassic",
        },
      },
    ],
    options
  );

  assert.deepEqual(result, {
    error: {
      statusCode: 400,
      message:
        "Filter 'f-byAttribute' cannot use excluded attribute 'chrono_from_lexic'",
    },
  });
  assert.deepEqual(requestedLayerIds, []);
});
