/**
 * @fileoverview Verifies GeoServer environment validation for startup fail-fast.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  readGeoServerEnvironmentConfig,
  validateGeoServerEnvironmentConfig,
} from "../../src/configuration/geoserver/configuration";

const withGeoServerBaseUrl = (
  baseUrl: string | undefined,
  callback: () => void
): void => {
  withGeoServerEnvironment(baseUrl, undefined, callback);
};

const withGeoServerEnvironment = (
  baseUrl: string | undefined,
  requestTimeoutMs: string | undefined,
  callback: () => void
): void => {
  const previousValue = process.env.GEOSERVER_BASE_URL;
  const previousTimeoutValue = process.env.GEOSERVER_REQUEST_TIMEOUT_MS;

  if (typeof baseUrl === "string") {
    process.env.GEOSERVER_BASE_URL = baseUrl;
  } else {
    delete process.env.GEOSERVER_BASE_URL;
  }

  if (typeof requestTimeoutMs === "string") {
    process.env.GEOSERVER_REQUEST_TIMEOUT_MS = requestTimeoutMs;
  } else {
    delete process.env.GEOSERVER_REQUEST_TIMEOUT_MS;
  }

  try {
    callback();
  } finally {
    if (typeof previousValue === "string") {
      process.env.GEOSERVER_BASE_URL = previousValue;
    } else {
      delete process.env.GEOSERVER_BASE_URL;
    }

    if (typeof previousTimeoutValue === "string") {
      process.env.GEOSERVER_REQUEST_TIMEOUT_MS = previousTimeoutValue;
    } else {
      delete process.env.GEOSERVER_REQUEST_TIMEOUT_MS;
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

test("uses the default GeoServer request timeout when no timeout is configured", () => {
  withGeoServerBaseUrl("https://geoserver.example/geoserver/swisstopo", () => {
    assert.equal(readGeoServerEnvironmentConfig().requestTimeoutMs, 30_000);
  });
});

test("accepts a positive integer GeoServer request timeout", () => {
  withGeoServerEnvironment(
    "https://geoserver.example/geoserver/swisstopo",
    "1500",
    () => {
      const configuration = validateGeoServerEnvironmentConfig(
        readGeoServerEnvironmentConfig()
      );

      assert.equal(configuration.requestTimeoutMs, 1500);
    }
  );
});

test("fails fast when GEOSERVER_REQUEST_TIMEOUT_MS is invalid", () => {
  for (const timeoutValue of ["0", "-1", "1.5", "abc"]) {
    withGeoServerEnvironment(
      "https://geoserver.example/geoserver/swisstopo",
      timeoutValue,
      () => {
        assert.throws(
          () => validateGeoServerEnvironmentConfig(readGeoServerEnvironmentConfig()),
          /GEOSERVER_REQUEST_TIMEOUT_MS/
        );
      }
    );
  }
});
