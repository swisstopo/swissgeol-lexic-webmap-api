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
