import type {
  LayerFilterDefinition,
  LayerFilterId,
} from "../../../types/layers/layerFilterTypes";

export const LAYER_FILTER_CATALOG: Record<LayerFilterId, LayerFilterDefinition> = {
  "f-chronostrat-term": {
    id: "f-chronostrat-term",
    name: "Chronostratigraphy",
    title: "Filter by Chronostratigraphy term",
    description: "Filter by chronostratigraphy terms",
  },
  "f-tectonic-term": {
    id: "f-tectonic-term",
    name: "Tectonic Units",
    title: "Filter by Tectonic Units term",
    description: "Filter by tectonic unit terms",
  },
  "f-lithostrat-term": {
    id: "f-lithostrat-term",
    name: "Lithostratigraphy",
    title: "Filter by Lithostratigraphy term",
    description: "Filter by lithostratigraphy terms",
  },
  "f-lithology-term": {
    id: "f-lithology-term",
    name: "Lithology",
    title: "Filter by Lithology term",
    description: "Filter by lithology terms",
  },
  "f-byAttribute": {
    id: "f-byAttribute",
    name: "Attribute",
    title: "Filter by Attribute",
    description: "Filter by attributes",
  },
};
