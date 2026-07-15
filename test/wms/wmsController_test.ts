/**
 * @fileoverview Verifies the OpenAPI-registered WMS proxy controller behavior.
 */

/// <reference path="../../src/types/fastify.d.ts" />

import assert from "node:assert/strict";
import test from "node:test";
import fastify, { FastifyInstance } from "fastify";
import { OpenApiRuntime } from "../../src/openapi/runtime";
import { loadOpenApiDocument, API_ROUTE_PREFIX } from "../../src/openapi/specification";
import { registerWmsRoutes } from "../../src/routes/wmsRoutes";

const buildTestApp = async (): Promise<FastifyInstance> => {
  const app = fastify({ logger: false });
  app.decorate("openApiRuntime", new OpenApiRuntime(await loadOpenApiDocument()));
  await app.register(registerWmsRoutes, { prefix: API_ROUTE_PREFIX });
  await app.ready();
  return app;
};

const buildWmsQuery = (overrides: Partial<Record<string, string>> = {}): string => {
  const query = new URLSearchParams({
    REQUEST: "GetMap",
    SERVICE: "WMS",
    VERSION: "1.3.0",
    FORMAT: "image/png",
    LAYERS: "tecto_units_augm",
    BBOX: "1,2,3,4",
    WIDTH: "256",
    HEIGHT: "256",
    ...overrides,
  });

  return query.toString();
};

const restoreGeoServerBaseUrl = (originalBaseUrl: string | undefined): void => {
  if (originalBaseUrl === undefined) {
    delete process.env.GEOSERVER_BASE_URL;
    return;
  }

  process.env.GEOSERVER_BASE_URL = originalBaseUrl;
};

test("GET /wms returns proxied image/png bytes", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();
  const imageBytes = Buffer.from([137, 80, 78, 71]);

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.equal(
      input.toString(),
      "https://geoserver.example/geoserver/swisstopo/wms"
    );
    assert.equal(init?.method, "POST");
    assert.deepEqual(init?.headers, {
      "content-type": "application/x-www-form-urlencoded",
      accept: "image/png",
    });
    assert.equal(init?.body, buildWmsQuery());

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wms?${buildWmsQuery()}`,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["content-type"], "image/png");
    assert.deepEqual(response.rawPayload, imageBytes);
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("GET /wms maps service input validation errors to 400", async () => {
  const app = await buildTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wms`,
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), {
      code: 400,
      message: "Invalid WMS request",
    });
  } finally {
    await app.close();
  }
});

test("GET /wms strips client CQL before calling GeoServer", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();
  const imageBytes = Buffer.from([137, 80, 78, 71]);

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.doesNotMatch(input.toString(), /CQL_FILTER/u);
    assert.doesNotMatch(String(init?.body), /CQL_FILTER/u);

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wms?${buildWmsQuery({
        CQL_FILTER: "client_filter",
      })}`,
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.rawPayload, imageBytes);
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("GET /wms maps upstream failures to 500", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (): Promise<Response> =>
    new Response("service unavailable", {
      status: 503,
      headers: { "content-type": "text/plain" },
    });

  try {
    const response = await app.inject({
      method: "GET",
      url: `${API_ROUTE_PREFIX}/wms?${buildWmsQuery()}`,
    });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.json(), {
      code: 500,
      message: "Internal server error",
    });
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("POST /wms returns proxied image/png bytes", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();
  const imageBytes = Buffer.from([137, 80, 78, 71]);

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.equal(
      input.toString(),
      "https://geoserver.example/geoserver/swisstopo/wms"
    );
    assert.equal(init?.method, "POST");
    assert.deepEqual(init?.headers, {
      "content-type": "application/x-www-form-urlencoded",
      accept: "image/png",
    });
    assert.equal(init?.body, buildWmsQuery());

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const response = await app.inject({
      method: "POST",
      url: `${API_ROUTE_PREFIX}/wms`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: buildWmsQuery(),
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["content-type"], "image/png");
    assert.deepEqual(response.rawPayload, imageBytes);
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("POST /wms maps service input validation errors to 400", async () => {
  const app = await buildTestApp();

  try {
    const response = await app.inject({
      method: "POST",
      url: `${API_ROUTE_PREFIX}/wms`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: "",
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), {
      code: 400,
      message: "Invalid WMS request",
    });
  } finally {
    await app.close();
  }
});

test("POST /wms maps upstream failures to 500", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (): Promise<Response> =>
    new Response("service unavailable", {
      status: 503,
      headers: { "content-type": "text/plain" },
    });

  try {
    const response = await app.inject({
      method: "POST",
      url: `${API_ROUTE_PREFIX}/wms`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: buildWmsQuery(),
    });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.json(), {
      code: 500,
      message: "Internal server error",
    });
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});

test("POST /wms maps upstream responses without image/png content type to 500", async () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.GEOSERVER_BASE_URL;
  const app = await buildTestApp();

  process.env.GEOSERVER_BASE_URL = "https://geoserver.example/geoserver/swisstopo";
  global.fetch = async (): Promise<Response> =>
    new Response("not an image", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

  try {
    const response = await app.inject({
      method: "POST",
      url: `${API_ROUTE_PREFIX}/wms`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      payload: buildWmsQuery(),
    });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.json(), {
      code: 500,
      message: "Internal server error",
    });
  } finally {
    global.fetch = originalFetch;
    restoreGeoServerBaseUrl(originalBaseUrl);
    await app.close();
  }
});
