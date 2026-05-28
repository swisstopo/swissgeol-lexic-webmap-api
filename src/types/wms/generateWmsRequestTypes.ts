import type { components } from "../openapi";

export type WmsResponse = components["schemas"]["WmsResponse"];

export type WmsRequestParameter = readonly [name: string, value: string];
