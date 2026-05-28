/**
 * @fileoverview Verifies generateWmsRequest controller behavior against the
 * configured backend layer registry.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { postGenerateWmsRequestHandler } from "../../src/controllers/wmsController";
import type { OpenApiRequest } from "../../src/types/openapi/openApiRouteTypes";
import { getGenerateWmsRequestResponse } from "../../src/services/wms/generateWmsRequestService";
import { WEBMAP_ID } from "../../src/configuration/webmap/configuration";

type GenerateWmsRequest = OpenApiRequest<"/generateWmsRequest", "post">;
type GenerateWmsRequestBody = GenerateWmsRequest["body"];

const buildRequest = (
  body: GenerateWmsRequestBody
): GenerateWmsRequest =>
  ({
    body,
  }) as GenerateWmsRequest;

test("returns Webmap not found when the webmap id is unknown", async () => {
  const response = await postGenerateWmsRequestHandler(
    buildRequest({
      webmapId: "unknown-webmap",
      layerId: "tecto_units_augm",
    })
  );

  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      code: 404,
      message: "Webmap not found",
    },
  });
});

test("returns Layer not found when the layer id is not configured", async () => {
  const response = await postGenerateWmsRequestHandler(
    buildRequest({
      webmapId: WEBMAP_ID,
      layerId: "Tecto_Lines",
    })
  );

  assert.deepEqual(response, {
    statusCode: 404,
    body: {
      code: 404,
      message: "Layer not found",
    },
  });
});

test("returns generated semantic constraints for accepted filters", async () => {
  const response = await postGenerateWmsRequestHandler(
    buildRequest({
      webmapId: WEBMAP_ID,
      layerId: "gc_bedrock",
      filters: [
        {
          filterId: "f-byAttribute",
          parameters: {
            attribute: "kind",
            value: "ignored",
          },
        },
      ],
    })
  );

  assert.deepEqual(response, {
    statusCode: 200,
    body: getGenerateWmsRequestResponse("gc_bedrock", [
      {
        filterId: "f-byAttribute",
        parameters: {
          attribute: "kind",
          value: "ignored",
        },
      },
    ]),
  });
});

test("returns validation errors for unsupported layer filters", async () => {
  const response = await postGenerateWmsRequestHandler(
    buildRequest({
      webmapId: WEBMAP_ID,
      layerId: "tecto_units_augm",
      filters: [
        {
          filterId: "f-lithology-term",
          parameters: {
            term: "https://dev-lexic.swissgeol.ch/Lithology/Amphibolite",
            includeNarrowers: true,
          },
        },
      ],
    })
  );

  assert.deepEqual(response, {
    statusCode: 400,
    body: {
      code: 400,
      message: "Layer does not support filter 'f-lithology-term'",
    },
  });
});

test("returns a WMS response for a configured layer without filters", async () => {
  const response = await postGenerateWmsRequestHandler(
    buildRequest({
      webmapId: WEBMAP_ID,
      layerId: "gc_bedrock",
    })
  );

  assert.deepEqual(response, {
    statusCode: 200,
    body: getGenerateWmsRequestResponse("gc_bedrock"),
  });
});
