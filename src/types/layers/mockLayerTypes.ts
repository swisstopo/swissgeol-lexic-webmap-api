import type { FilterId } from "../filters/mockFilterTypes";

export interface LayerDefinition {
  id: string;
  name: string;
  filterable: boolean;
  filterIds: FilterId[];
  attributes: string[];
}
