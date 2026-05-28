export type FilterId =
  | "f-chronostrat-term"
  | "f-tectonic-term"
  | "f-lithostrat-term"
  | "f-lithology-term"
  | "f-byAttribute";

export interface FilterDefinition {
  id: FilterId;
  name: string;
  title: string;
  description: string;
}
