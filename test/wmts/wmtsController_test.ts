/**
 * @fileoverview Verifies the OpenAPI-registered WMTS configuration endpoint.
 */

/// <reference path="../../src/types/fastify.d.ts" />

import assert from "node:assert/strict";
import test from "node:test";
import fastify, { FastifyInstance } from "fastify";
import { OpenApiRuntime } from "../../src/openapi/runtime";
import { API_ROUTE_PREFIX, loadOpenApiDocument } from "../../src/openapi/specification";
import { registerWmtsRoutes } from "../../src/routes/wmtsRoutes";

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = fastify({ logger: false });
  app.decorate("openApiRuntime", new OpenApiRuntime(await loadOpenApiDocument()));
  await app.register(registerWmtsRoutes, { prefix: API_ROUTE_PREFIX });
  await app.ready();
  return app;
};

const restoreGeoServerBaseUrl = (originalBaseUrl: string | undefined): void => {
  if (originalBaseUrl === undefined) {
    delete process.env.GEOSERVER_BASE_URL;
    return;
  }

  process.env.GEOSERVER_BASE_URL = originalBaseUrl;
};

test("GET /wmts returns WMTS source data for a configured layer", async () => {
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();

  process.env.GEOSERVER_BASE_URL =
    "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo";

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wmts?layerId=gc_bedrock`,
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      layerId: "gc_bedrock",
      source: {
        urlWMTS:
          "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo/gc_bedrock/gwc/service/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities",
        paramsWMTS: {
          layer: "gc_bedrock",
          style: "swisstopo:gc_bedrock",
          matrixSet: "EPSG:2056",
          format: "image/png",
        },
        serverType: "geoserver",
        crossOrigin: "anonymous",
      },
    });
  } finally {
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("GET /wmts maps unknown layers to 404", async () => {
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();

  process.env.GEOSERVER_BASE_URL =
    "https://dev-ogcservices.swissgeol.ch/geoserver/swisstopo";

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wmts?layerId=unknown_layer`,
    });

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.json(), {
      code: 404,
      message: "Layer not found",
    });
  } finally {
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("GET /wmts requires layerId query parameter", async () => {
  const app = await buildTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wmts`,
    });

    assert.equal(response.statusCode, 400);
    assert.match(response.json().message, /layerId/u);
  } finally {
    await app.close();
  }
});
