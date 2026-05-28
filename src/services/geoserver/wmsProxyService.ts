/**
 * @fileoverview Shared WMS proxy request preparation for GeoServer calls.
 */

import type { GeoServerEnvironmentConfig } from "../../types/geoserver/geoserverConfigurationTypes";
import {
  sanitizeWmsRequestBody,
  WmsProxyInputError,
} from "../wms/wmsRequestSanitizerService";
import type { WmsProxyRequestOptions } from "../../types/wms/wmsRequestSanitizerTypes";
import type {
  GeoServerWmsRequest,
  WmsProxyLogger,
  WmsProxyMethod,
} from "../../types/geoserver/wmsProxyTypes";

export { WmsProxyInputError };

const SUPPORTED_WMS_MIME_TYPE = "image/png";
const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";

/**
 * Represents an upstream GeoServer failure that should be hidden behind the
 * public WMS proxy error contract.
 */
export class WmsProxyUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WmsProxyUpstreamError";
  }
}

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/u, "");

/**
 * Normalizes the configured GeoServer base URL to the concrete WMS endpoint.
 */
export const normalizeGeoServerWmsEndpoint = (baseUrl: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("Invalid GeoServer base URL: expected an absolute URL.");
  }

  const normalizedPath = trimTrailingSlashes(parsedUrl.pathname);

  parsedUrl.pathname = /\/wms$/iu.test(normalizedPath)
    ? normalizedPath
    : `${normalizedPath}/wms`;
  parsedUrl.search = "";
  parsedUrl.hash = "";

  return parsedUrl.toString();
};

/**
 * Builds the outbound GeoServer WMS request from raw client parameters.
 *
 * Flow:
 * 1. Delegate WMS parameter parsing and `SEMANTIC_FILTER` -> `CQL_FILTER`
 *    conversion to `sanitizeWmsRequestBody`.
 * 2. Normalize the configured GeoServer base URL to the concrete `/wms`
 *    endpoint.
 * 3. Attach the sanitized body and the fixed proxy headers used by the GET/POST
 *    forwarding functions.
 *
 * This service does not interpret semantic filters directly; it only prepares a
 * GeoServer-ready request after the WMS domain has sanitized it.
 */
export const buildGeoServerWmsRequest = async (
  wmsParameters: string,
  configuration: GeoServerEnvironmentConfig,
  options: WmsProxyRequestOptions = {}
): Promise<GeoServerWmsRequest> => {
  const body = await sanitizeWmsRequestBody(wmsParameters, options);

  return {
    endpointUrl: normalizeGeoServerWmsEndpoint(configuration.baseUrl),
    body,
    mimeType: SUPPORTED_WMS_MIME_TYPE,
    headers: {
      "content-type": FORM_CONTENT_TYPE,
      accept: SUPPORTED_WMS_MIME_TYPE,
    },
  };
};

const buildGeoServerWmsGetUrl = (request: GeoServerWmsRequest): string => {
  const url = new URL(request.endpointUrl);
  url.search = request.body;

  return url.toString();
};

const countWmsParameters = (body: string): number =>
  body.split("&").filter((parameter) => parameter.length > 0).length;

const isPngResponse = (response: Response): boolean =>
  response.headers.get("content-type")?.toLowerCase().startsWith(SUPPORTED_WMS_MIME_TYPE) ??
  false;

const isAbortError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";

const buildGeoServerFetchInput = (
  request: GeoServerWmsRequest,
  method: WmsProxyMethod
): string =>
  method === "GET" ? buildGeoServerWmsGetUrl(request) : request.endpointUrl;

const buildGeoServerFetchInit = (
  request: GeoServerWmsRequest,
  method: WmsProxyMethod
): RequestInit => {
  if (method === "GET") {
    return {
      method,
      headers: {
        accept: request.headers.accept,
      },
    };
  }

  return {
    method,
    headers: request.headers,
    body: request.body,
  };
};

/**
 * Executes the shared GeoServer WMS forwarding flow for both GET and POST.
 *
 * The public entrypoints prepare an already-sanitized request, then this helper:
 * - chooses whether the WMS body is appended to the URL (GET) or sent as form
 *   body (POST);
 * - logs host/path, method, parameter count, timings, and timeout settings;
 * - aborts the upstream fetch after the configured timeout;
 * - hides network failures, timeouts, non-OK statuses, XML errors, and non-PNG
 *   responses behind `WmsProxyUpstreamError`;
 * - returns only accepted PNG bytes to the controller layer.
 */
const fetchGeoServerWmsImage = async (
  request: GeoServerWmsRequest,
  configuration: GeoServerEnvironmentConfig,
  method: WmsProxyMethod,
  logger: WmsProxyLogger
): Promise<Buffer> => {
  const outboundUrl = new URL(request.endpointUrl);
  const operation = `${method} GeoServer WMS image`;
  const parameterCount = countWmsParameters(request.body);
  const startedAt = Date.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    configuration.requestTimeoutMs
  );

  logger.info(
    {
      operation,
      method,
      upstreamHost: outboundUrl.host,
      upstreamPath: outboundUrl.pathname,
      parameterCount,
      timeoutMs: configuration.requestTimeoutMs,
    },
    "Sending outbound GeoServer WMS request"
  );

  let upstreamResponse: Response;
  try {
    const fetchInit = buildGeoServerFetchInit(request, method);
    try {
      upstreamResponse = await fetch(buildGeoServerFetchInput(request, method), {
        ...fetchInit,
        signal: abortController.signal,
      });
    } catch (error) {
      const timedOut = isAbortError(error);
      logger.error(
        {
          err: error,
          operation,
          method,
          upstreamHost: outboundUrl.host,
          upstreamPath: outboundUrl.pathname,
          durationMs: Date.now() - startedAt,
          parameterCount,
          timedOut,
          timeoutMs: configuration.requestTimeoutMs,
        },
        timedOut
          ? "GeoServer WMS request timed out"
          : "GeoServer WMS request failed"
      );
      throw new WmsProxyUpstreamError(
        timedOut
          ? "GeoServer WMS request timed out."
          : "GeoServer WMS request failed."
      );
    }

    logger.info(
      {
        operation,
        method,
        upstreamHost: outboundUrl.host,
        upstreamPath: outboundUrl.pathname,
        statusCode: upstreamResponse.status,
        durationMs: Date.now() - startedAt,
        parameterCount,
      },
      "Received GeoServer WMS response"
    );

    if (!upstreamResponse.ok || !isPngResponse(upstreamResponse)) {
      logger.warn(
        {
          operation,
          method,
          upstreamHost: outboundUrl.host,
          upstreamPath: outboundUrl.pathname,
          statusCode: upstreamResponse.status,
          contentType: upstreamResponse.headers.get("content-type") ?? "",
          parameterCount,
        },
        "GeoServer WMS response was rejected"
      );
      /*
       * Keep GeoServer status codes, XML exception payloads, and non-image
       * responses behind the public proxy error type. Controllers can map this
       * error consistently without leaking upstream implementation details.
       */
      throw new WmsProxyUpstreamError("GeoServer WMS response was rejected.");
    }

    try {
      return Buffer.from(await upstreamResponse.arrayBuffer());
    } catch (error) {
      const timedOut = isAbortError(error);
      logger.error(
        {
          err: error,
          operation,
          method,
          upstreamHost: outboundUrl.host,
          upstreamPath: outboundUrl.pathname,
          statusCode: upstreamResponse.status,
          durationMs: Date.now() - startedAt,
          parameterCount,
          timedOut,
          timeoutMs: configuration.requestTimeoutMs,
        },
        timedOut
          ? "GeoServer WMS response body read timed out"
          : "GeoServer WMS response body read failed"
      );
      throw new WmsProxyUpstreamError(
        timedOut
          ? "GeoServer WMS response body read timed out."
          : "GeoServer WMS response body read failed."
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Sanitizes raw WMS parameters, forwards them as a GeoServer GET request, and
 * returns the accepted PNG image bytes.
 */
export const getGeoServerWmsImage = async (
  wmsParameters: string,
  configuration: GeoServerEnvironmentConfig,
  logger: WmsProxyLogger,
  options: WmsProxyRequestOptions = {}
): Promise<Buffer> =>
  fetchGeoServerWmsImage(
    await buildGeoServerWmsRequest(wmsParameters, configuration, options),
    configuration,
    "GET",
    logger
  );

/**
 * Sanitizes raw WMS parameters, forwards them as a GeoServer POST form request,
 * and returns the accepted PNG image bytes.
 */
export const postGeoServerWmsImage = async (
  wmsParameters: string,
  configuration: GeoServerEnvironmentConfig,
  logger: WmsProxyLogger,
  options: WmsProxyRequestOptions = {}
): Promise<Buffer> =>
  fetchGeoServerWmsImage(
    await buildGeoServerWmsRequest(wmsParameters, configuration, options),
    configuration,
    "POST",
    logger
  );
