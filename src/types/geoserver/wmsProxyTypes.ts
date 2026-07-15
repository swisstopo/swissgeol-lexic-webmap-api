import type { FastifyBaseLogger } from "fastify";

export type WmsProxyLogger = Pick<FastifyBaseLogger, "info" | "warn" | "error">;

/**
 * Normalized GeoServer WMS request ready to be sent through fetch.
 */
export interface GeoServerWmsRequest {
  endpointUrl: string;
  body: string;
  mimeType: "image/png";
  headers: {
    "content-type": "application/x-www-form-urlencoded";
    accept: "image/png";
  };
}
