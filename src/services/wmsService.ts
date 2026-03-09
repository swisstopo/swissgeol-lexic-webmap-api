/**
 * @fileoverview Service helper for WMS response payloads.
 */

import { WMS_RESPONSE_TEMPLATE, WmsResponse } from "../data/mockData";

export const getWmsResponse = (layerId: string): WmsResponse => ({
  ...WMS_RESPONSE_TEMPLATE,
  url: WMS_RESPONSE_TEMPLATE.url.replace("{{LAYER_ID}}", layerId),
});
