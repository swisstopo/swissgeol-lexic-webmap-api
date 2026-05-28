import type { LayerConfiguration } from "../../../types/layers/layerConfigurationTypes";

/**
 * Builds the WMTS source block shared by layer catalog entries that are served
 * by GeoServer with the standard WebMap tile configuration.
 */
const buildWmtsSource = (
  layerId: string
): NonNullable<LayerConfiguration["wmtsSource"]> => ({
  capabilitiesPath: `${layerId}/gwc/service/wmts`,
  paramsWMTS: {
    layer: layerId,
    style: `swisstopo:${layerId}`,
    matrixSet: "EPSG:2056",
    format: "image/png",
  },
  serverType: "geoserver",
  crossOrigin: "anonymous",
});

/**
 * Layer catalog exposed through the HTTP layer endpoints and reused by WMTS,
 * WMS request generation, and semantic filter validation.
 */
export const LAYER_CONFIGURATIONS: LayerConfiguration[] = [
  {
    id: "tecto_units_augm",
    name: "Tectonic Units",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-tectonic-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "tecto_units_augm",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-tectonic-term": {
        attributeToFilter: ["tecto_lexic"],
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
          "tecto_lexic",
        ],
      },
    },
    wmtsSource: buildWmtsSource("tecto_units_augm"),
  },
  {
    id: "gc_bedrock",
    name: "GC_BEDROCK",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-tectonic-term",
      "f-lithostrat-term",
      "f-lithology-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "gc_bedrock",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-tectonic-term": {
        attributeToFilter: ["tecto_lexic"],
      },
      "f-lithostrat-term": {
        attributeToFilter: ["litstrat_lexic"],
      },
      "f-lithology-term": {
        attributeToFilter: [
          "litho_lexic_1",
          "litho_lexic_2",
          "litho_lexic_3",
        ],
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
          "tecto_lexic",
          "litstrat_lexic",
          "litho_lexic_1",
          "litho_lexic_2",
          "litho_lexic_3",
        ],
      },
    },
    wmtsSource: buildWmtsSource("gc_bedrock"),
  },
  {
    id: "gc_unco_deposits",
    name: "GC_UNCO_DEPOSITS",
    filterable: true,
    filterIds: [
      "f-chronostrat-term",
      "f-byAttribute",
    ],
    attributeSource: {
      typeName: "gc_unco_deposits",
    },
    filterConfiguration: {
      "f-chronostrat-term": {
        columnToFilterOld: "chrono_from_lexic",
        columnToFilterYon: "chrono_to_lexic",
      },
      "f-byAttribute": {
        excludedAttributes: [
          "chrono_from_lexic",
          "chrono_to_lexic",
        ],
      },
    },
    wmtsSource: buildWmtsSource("gc_unco_deposits"),
  },
];
