/**
 * @fileoverview Verifies GeoServer environment validation for startup fail-fast.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  readGeoServerEnvironmentConfig,
  validateGeoServerEnvironmentConfig,
} from "../../src/geoserver/configuration";

const withGeoServerBaseUrl = (
  baseUrl: string | undefined,
  callback: () => void
): void => {
  const previousValue = process.env.GEOSERVER_BASE_URL;

  if (typeof baseUrl === "string") {
    process.env.GEOSERVER_BASE_URL = baseUrl;
  } else {
    delete process.env.GEOSERVER_BASE_URL;
  }

  try {
    callback();
  } finally {
    if (typeof previousValue === "string") {
      process.env.GEOSERVER_BASE_URL = previousValue;
    } else {
      delete process.env.GEOSERVER_BASE_URL;
    }
  }
};

test("fails fast when GEOSERVER_BASE_URL is missing", () => {
  withGeoServerBaseUrl(undefined, () => {
    assert.throws(
      () => validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig()),
      /GEOSERVER_BASE_URL/
    );
  });
});

test("fails fast when GEOSERVER_BASE_URL is not a valid http(s) URL", () => {
  withGeoServerBaseUrl("https//geoserver.example", () => {
    assert.throws(
      () => validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig()),
      /GEOSERVER_BASE_URL/
    );
  });

  withGeoServerBaseUrl("ftp://geoserver.example/path", () => {
    assert.throws(
      () => validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig()),
      /GEOSERVER_BASE_URL/
    );
  });
});

test("accepts a valid GEOSERVER_BASE_URL", () => {
  withGeoServerBaseUrl("https://geoserver.example/geoserver/swisstopo", () => {
    assert.doesNotThrow(() =>
      validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig())
    );
  });
});
