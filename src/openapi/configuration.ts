/**
 * @fileoverview Resolves OpenAPI specification configuration shared by build-time and runtime flows.
 */

import fs from "fs";
import path from "path";

/**
 * OpenAPI specification filename.
 * Update this constant when changing the specification version.
 * This is the ONLY place that needs modification on spec version update.
 */
export const OPENAPI_SPEC_FILENAME = "SwissTopoWebmapAPI-1.6.0.yaml";

const APP_ROOT = path.resolve(__dirname, "..", "..");

const formatSpecNotFoundMessage = (specPath: string): string =>
  `OpenAPI specification not found at '${specPath}'. Ensure the specification file is placed next to the application bundle.`;

/**
 * Returns the application root used to resolve bundled files.
 */
export const getAppRoot = (): string => APP_ROOT;

/**
 * Returns the OpenAPI specification file name.
 */
export const getConfiguredOpenApiSpecFile = (): string => {
  return OPENAPI_SPEC_FILENAME;
};

/**
 * Resolves the bundled OpenAPI specification path.
 */
export const getBundledOpenApiSpecPath = (): string =>
  path.resolve(getAppRoot(), getConfiguredOpenApiSpecFile());

/**
 * Resolves the active OpenAPI specification path.
 */
export const getConfiguredOpenApiSpecPath = (): string =>
  getBundledOpenApiSpecPath();

/**
 * Ensures that the configured OpenAPI specification exists before use.
 */
export const assertOpenApiSpecExists = (): string => {
  const specPath = getConfiguredOpenApiSpecPath();
  if (fs.existsSync(specPath)) {
    return specPath;
  }

  throw new Error(formatSpecNotFoundMessage(specPath));
};
