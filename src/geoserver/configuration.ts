/**
 * @fileoverview Resolves GeoServer runtime configuration for live layer metadata.
 */

const readEnvValue = (name: string): string => process.env[name]?.trim() || "";

export interface GeoServerEnvironmentConfig {
  baseUrl: string;
}

export const readGeoServerEnvironmentConfig = (): GeoServerEnvironmentConfig => ({
  baseUrl: readEnvValue("GEOSERVER_BASE_URL"),
});

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

  return configuration;
};
