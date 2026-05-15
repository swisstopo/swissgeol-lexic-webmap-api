/**
 * Compares the served Swagger JSON with the OpenAPI document exposed by the mock server.
 */

import { readOpenApiSourceDocument } from "../src/openapi/specification";
import { buildServedOpenApiDocument } from "../src/openapi/servedDocument";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const sortDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortDeep((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const expectedDocument = buildServedOpenApiDocument(readOpenApiSourceDocument());
  const response = await fetch(`${baseUrl}/swagger/json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Swagger JSON: ${response.status}`);
  }

  const actualDocument = await response.json();
  const expectedCanonical = JSON.stringify(sortDeep(expectedDocument));
  const actualCanonical = JSON.stringify(sortDeep(actualDocument));

  if (expectedCanonical !== actualCanonical) {
    throw new Error("Swagger JSON does not match the served OpenAPI document.");
  }

  assert(
    Array.isArray(actualDocument.servers) &&
      actualDocument.servers.length === 1 &&
      actualDocument.servers[0]?.url === "/v1",
    "Swagger JSON must expose the local mock server under /v1."
  );
  assert(
    actualDocument.paths?.["/generateWmsRequest"]?.post?.requestBody?.content?.[
      "application/json"
    ]?.example?.layerId === "tecto_units_augm",
    "Swagger JSON must expose a WMS request example aligned with the mock dataset."
  );
  assert(
    actualDocument.paths?.["/layers/{layerId}/defaultFilters"]?.get?.responses?.["200"]?.content
      ?.["application/json"]?.examples?.LithologyTerm?.value?.layerId === "gc_bedrock",
    "Swagger JSON must expose defaultFilters examples aligned with the mock dataset."
  );

  console.log("Swagger JSON matches the served OpenAPI document.");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
