/**
 * @fileoverview Resolves GeoServer runtime configuration for live layer
 * metadata and WMS proxy requests.
 */

import type { GeoServerEnvironmentConfig } from "../../types/geoserver/geoserverConfigurationTypes";

const readEnvValue = (name: string): string => process.env[name]?.trim() || "";
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

const readPositiveIntegerEnvValue = (
  name: string,
  defaultValue: number
): number => {
  const rawValue = readEnvValue(name);
  if (!rawValue) {
    return defaultValue;
  }

  return Number(rawValue);
};

/**
 * Reads GeoServer connection settings from environment variables.
 */
export const readGeoServerEnvironmentConfig = (): GeoServerEnvironmentConfig => ({
  baseUrl: readEnvValue("GEOSERVER_BASE_URL"),
  requestTimeoutMs: readPositiveIntegerEnvValue(
    "GEOSERVER_REQUEST_TIMEOUT_MS",
    DEFAULT_REQUEST_TIMEOUT_MS
  ),
});

/**
 * Validates GeoServer settings before routes that depend on upstream GeoServer
 * access are used.
 */
export const validateGeoServerEnvironmentConfig = (
  configuration: GeoServerEnvironmentConfig
): GeoServerEnvironmentConfig => {
  if (!configuration.baseUrl) {
    throw new Error("Missing required GEOSERVER_BASE_URL environment variable.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuration.baseUrl);
  } catch {
    throw new Error(
      "Invalid GEOSERVER_BASE_URL environment variable: expected a valid absolute http(s) URL."
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new Error(
      "Invalid GEOSERVER_BASE_URL environment variable: expected a valid absolute http(s) URL."
    );
  }

  if (
    !Number.isInteger(configuration.requestTimeoutMs) ||
    configuration.requestTimeoutMs <= 0
  ) {
    throw new Error(
      "Invalid GEOSERVER_REQUEST_TIMEOUT_MS environment variable: expected a positive integer."
    );
  }

  return configuration;
};
