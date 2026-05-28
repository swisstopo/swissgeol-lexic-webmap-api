import type { components } from "../openapi";

export type WmtsResponse = components["schemas"]["WmtsResponse"];
export type WmtsSource = components["schemas"]["WmtsSource"];
export type WmtsParameters = components["schemas"]["WmtsParameters"];

export interface LayerWmtsSourceConfig {
  capabilitiesPath: string;
  paramsWMTS: WmtsParameters;
  serverType: WmtsSource["serverType"];
  crossOrigin: WmtsSource["crossOrigin"];
}
