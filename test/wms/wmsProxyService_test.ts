/**
 * @fileoverview Verifies shared WMS proxy request preparation for GeoServer.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGeoServerWmsRequest,
  getGeoServerWmsImage,
  postGeoServerWmsImage,
  normalizeGeoServerWmsEndpoint,
} from "../../src/services/geoserver/wmsProxyService";

const baseWmsParameters =
  "REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&LAYERS=tecto_units_augm&BBOX=1,2,3,4&WIDTH=256&HEIGHT=256";

const buildGeoServerTestConfiguration = (requestTimeoutMs = 30_000) => ({
  baseUrl: "https://geoserver.example/geoserver/swisstopo",
  requestTimeoutMs,
});

const noopLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

test("normalizes a GeoServer base URL by appending /wms when missing", () => {
  assert.equal(
    normalizeGeoServerWmsEndpoint(
      "https://geoserver.example/geoserver/swisstopo"
    ),
    "https://geoserver.example/geoserver/swisstopo/wms"
  );
});

test("does not duplicate /wms when the GeoServer base URL already ends with it", () => {
  assert.equal(
    normalizeGeoServerWmsEndpoint(
      "https://geoserver.example/geoserver/swisstopo/wms"
    ),
    "https://geoserver.example/geoserver/swisstopo/wms"
  );
});

test("does not duplicate /wms when the GeoServer base URL has a trailing slash", () => {
  assert.equal(
    normalizeGeoServerWmsEndpoint(
      "https://geoserver.example/geoserver/swisstopo/wms/"
    ),
    "https://geoserver.example/geoserver/swisstopo/wms"
  );
});

test("drops query string and hash from the configured GeoServer base URL", () => {
  assert.equal(
    normalizeGeoServerWmsEndpoint(
      "https://geoserver.example/geoserver/swisstopo?debug=true#section"
    ),
    "https://geoserver.example/geoserver/swisstopo/wms"
  );
});

test("builds the GeoServer request with normalized endpoint and sanitized body", async () => {
  assert.deepEqual(
    await buildGeoServerWmsRequest(
      baseWmsParameters,
      buildGeoServerTestConfiguration()
    ),
    {
      endpointUrl: "https://geoserver.example/geoserver/swisstopo/wms",
      body: baseWmsParameters,
      mimeType: "image/png",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "image/png",
      },
    }
  );
});

test("fails explicitly when the WMS response body is empty", async () => {
  await assert.rejects(
    async () =>
      buildGeoServerWmsRequest(
        "   ",
        buildGeoServerTestConfiguration()
      ),
    /WMS request parameters must not be empty/
  );
});

test("loads a GeoServer WMS image with sanitized query parameters", async () => {
  const originalFetch = global.fetch;
  const imageBytes = Buffer.from([137, 80, 78, 71]);

  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.equal(
      input.toString(),
      `https://geoserver.example/geoserver/swisstopo/wms?${baseWmsParameters}`
    );
    assert.equal(init?.method, "GET");
    assert.deepEqual(init?.headers, {
      accept: "image/png",
    });

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const result = await getGeoServerWmsImage(
      `${baseWmsParameters}&CQL_FILTER=client_filter`,
      buildGeoServerTestConfiguration(),
      noopLogger
    );

    assert.deepEqual(result, imageBytes);
  } finally {
    global.fetch = originalFetch;
  }
});

test("loads a GeoServer WMS image with backend-generated CQL from semantic filter", async () => {
  const originalFetch = global.fetch;
  const imageBytes = Buffer.from([137, 80, 78, 71]);
  const expectedCql = "%22tecto_lexic%22%20IN%20(%20%27resolved%27%20)";

  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.equal(
      input.toString(),
      `https://geoserver.example/geoserver/swisstopo/wms?${baseWmsParameters}&CQL_FILTER=${expectedCql}`
    );
    assert.equal(init?.method, "GET");

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const result = await getGeoServerWmsImage(
      `${baseWmsParameters}&SEMANTIC_FILTER=semantic&CQL_FILTER=client_filter`,
      buildGeoServerTestConfiguration(),
      noopLogger,
      {
        solveSemanticFilter: async (filterString: string): Promise<string> => {
          assert.equal(filterString, "semantic");
          return "\"tecto_lexic\" IN ( 'resolved' )";
        },
      }
    );

    assert.deepEqual(result, imageBytes);
  } finally {
    global.fetch = originalFetch;
  }
});

test("posts a GeoServer WMS image request with sanitized form parameters", async () => {
  const originalFetch = global.fetch;
  const imageBytes = Buffer.from([137, 80, 78, 71]);

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
    assert.equal(
      init?.body,
      baseWmsParameters
    );

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const result = await postGeoServerWmsImage(
      `${baseWmsParameters}&CQL_FILTER=client_filter`,
      buildGeoServerTestConfiguration(),
      noopLogger
    );

    assert.deepEqual(result, imageBytes);
  } finally {
    global.fetch = originalFetch;
  }
});

test("posts a GeoServer WMS image request with backend-generated CQL from semantic filter", async () => {
  const originalFetch = global.fetch;
  const imageBytes = Buffer.from([137, 80, 78, 71]);
  const expectedCql = "%22tecto_lexic%22%20IN%20(%20'resolved'%20)";

  global.fetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    assert.equal(
      input.toString(),
      "https://geoserver.example/geoserver/swisstopo/wms"
    );
    assert.equal(init?.method, "POST");
    assert.equal(
      init?.body,
      `${baseWmsParameters}&CQL_FILTER=${expectedCql}`
    );

    return new Response(imageBytes, {
      status: 200,
      headers: { "content-type": "image/png" },
    });
  };

  try {
    const result = await postGeoServerWmsImage(
      `${baseWmsParameters}&SEMANTIC_FILTER=semantic&CQL_FILTER=client_filter`,
      buildGeoServerTestConfiguration(),
      noopLogger,
      {
        solveSemanticFilter: async (filterString: string): Promise<string> => {
          assert.equal(filterString, "semantic");
          return "\"tecto_lexic\" IN ( 'resolved' )";
        },
      }
    );

    assert.deepEqual(result, imageBytes);
  } finally {
    global.fetch = originalFetch;
  }
});

test("rejects successful upstream responses that are not image/png", async () => {
  const originalFetch = global.fetch;

  global.fetch = async (): Promise<Response> =>
    new Response("not an image", {
      status: 200,
      headers: { "content-type": "text/plain; note=image/png" },
    });

  try {
    await assert.rejects(
      () =>
        getGeoServerWmsImage(
          baseWmsParameters,
          buildGeoServerTestConfiguration(),
          noopLogger
        ),
      /GeoServer WMS response was rejected/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("aborts GeoServer WMS requests after the configured timeout", async () => {
  const originalFetch = global.fetch;
  let receivedSignal: AbortSignal | undefined;

  global.fetch = async (
    _input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    receivedSignal = init?.signal ?? undefined;

    if (!receivedSignal) {
      throw new Error("Missing abort signal");
    }

    return new Promise<Response>((_resolve, reject) => {
      receivedSignal?.addEventListener("abort", () => {
        reject(Object.assign(new Error("Request aborted"), { name: "AbortError" }));
      });
    });
  };

  try {
    await assert.rejects(
      () =>
        getGeoServerWmsImage(
          baseWmsParameters,
          buildGeoServerTestConfiguration(1),
          noopLogger
        ),
      /GeoServer WMS request timed out/
    );
    assert.equal(receivedSignal?.aborted, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("aborts GeoServer WMS response body reads after the configured timeout", async () => {
  const originalFetch = global.fetch;

  global.fetch = async (
    _input: string | URL | Request,
    init?: RequestInit
  ): Promise<Response> => {
    const signal = init?.signal;

    if (!signal) {
      throw new Error("Missing abort signal");
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: async () =>
        new Promise<ArrayBuffer>((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(
              Object.assign(new Error("Body read aborted"), {
                name: "AbortError",
              })
            );
          });
        }),
    } as Response;
  };

  try {
    await assert.rejects(
      () =>
        getGeoServerWmsImage(
          baseWmsParameters,
          buildGeoServerTestConfiguration(1),
          noopLogger
        ),
      /GeoServer WMS response body read timed out/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
