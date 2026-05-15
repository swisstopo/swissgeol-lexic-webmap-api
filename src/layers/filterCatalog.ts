/**
 * @fileoverview Public filter catalog shared by the backend layer
 * configuration and later `/layers` response mapping.
 */

export type LayerFilterId =
  | "f-chronostrat-term"
  | "f-tectonic-term"
  | "f-lithostrat-term"
  | "f-lithology-term"
  | "f-byAttribute";

export interface LayerFilterDefinition {
  id: LayerFilterId;
  name: string;
  title: string;
  description: string;
}

export const LAYER_FILTER_CATALOG: Record<LayerFilterId, LayerFilterDefinition> = {
  "f-chronostrat-term": {
    id: "f-chronostrat-term",
    name: "Filter by Chronostratigraphy term",
    title: "Filter by Chronostratigraphy term",
    description: "Filter by chronostratigraphic intervals",
  },
  "f-tectonic-term": {
    id: "f-tectonic-term",
    name: "Filter by Tectonic Units term",
    title: "Filter by Tectonic Units term",
    description: "Filter by tectonic units",
  },
  "f-lithostrat-term": {
    id: "f-lithostrat-term",
    name: "Filter by Lithostratigraphy term",
    title: "Filter by Lithostratigraphy term",
    description: "Filter by lithostratigraphic units",
  },
  "f-lithology-term": {
    id: "f-lithology-term",
    name: "Filter by Lithology term",
    title: "Filter by Lithology term",
    description: "Filter by lithology classes",
  },
  "f-byAttribute": {
    id: "f-byAttribute",
    name: "Filter by Attribute",
    title: "Filter by Attribute",
    description: "Filter by attribute key/value",
  },
};
