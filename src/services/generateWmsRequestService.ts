/**
 * @fileoverview Service helper for generateWmsRequest response payloads.
 */

import { WMS_RESPONSE_TEMPLATE, WmsResponse } from "../data/mockData";

export const getGenerateWmsRequestResponse = (layerId: string): WmsResponse => ({
  ...WMS_RESPONSE_TEMPLATE,
  url: WMS_RESPONSE_TEMPLATE.url.replace("{{LAYER_ID}}", layerId),
  body: WMS_RESPONSE_TEMPLATE.body.replace("{{LAYER_ID}}", layerId),
});
