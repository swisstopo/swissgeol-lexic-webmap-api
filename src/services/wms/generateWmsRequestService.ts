/**
 * @fileoverview Deterministic WMS request builder for generateWmsRequest responses.
 */

import type { ValidatedFilter } from "../../types/filters/filterRequestValidationTypes";
import { buildSemanticFilterExpression } from "./semanticFilterParameterService";
import type {
  WmsRequestParameter,
  WmsResponse,
} from "../../types/wms/generateWmsRequestTypes";

const WMS_PROXY_URL = "https://dev-webmap-api.swissgeol.ch/v1/wms";
const WMS_MIME_TYPE = "image/png";
const WMS_NOTE = "The WMS URL includes encoded semantic query parameters.";

/*
 * Builds the form body that clients send to the `/wms` proxy. Semantic filters
 * are emitted as SEMANTIC_FILTER expressions instead of CQL_FILTER values so
 * the proxy can perform semantic resolution and sanitization immediately before
 * forwarding the request to GeoServer.
 */
const buildWmsRequestBody = (
  layerId: string,
  filters: ValidatedFilter[]
): string => {
  const semanticFilter = buildSemanticFilterExpression(layerId, filters);
  const parameters: WmsRequestParameter[] = [
    ["REQUEST", "GetMap"],
    ["SERVICE", "WMS"],
    ["VERSION", "1.3.0"],
    ["FORMAT", WMS_MIME_TYPE],
    ["STYLES", "swisstopo:filtered"],
    ["TRANSPARENT", "true"],
    ["LAYERS", layerId],
    ["TILED", "true"],
    ...(semanticFilter ? [["SEMANTIC_FILTER", semanticFilter] as const] : []),
    ["CRS", "EPSG:2056"],
  ];

  return parameters
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
};

/**
 * Builds the `/generateWmsRequest` response consumed by clients before they
 * call the `/wms` proxy endpoint.
 *
 * Flow:
 * 1. Receives the already validated layer id and filter list from the controller.
 * 2. Calls `buildSemanticFilterExpression` to serialize filters as
 *    `calculate_semantic_constraint(...)` calls when filters are present.
 * 3. Builds the WMS form body expected by the proxy. The body intentionally uses
 *    `SEMANTIC_FILTER`, not `CQL_FILTER`, so `/wms` can resolve vocabularies,
 *    sanitize duplicate filtering parameters, and generate backend CQL at the
 *    last possible moment.
 *
 * @returns OpenAPI `WmsResponse` with proxy URL, form body, MIME type, and note.
 */
export const getGenerateWmsRequestResponse = (
  layerId: string,
  filters: ValidatedFilter[] = []
): WmsResponse => ({
  url: WMS_PROXY_URL,
  body: buildWmsRequestBody(layerId, filters),
  mimeType: WMS_MIME_TYPE,
  note: WMS_NOTE,
});
