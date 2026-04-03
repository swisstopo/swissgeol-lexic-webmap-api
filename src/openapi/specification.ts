/**
 * @fileoverview Loads and validates the OpenAPI specification used as the single source of truth.
 */

import fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import yaml from "js-yaml";
import type { OpenAPIV3 } from "openapi-types";
import {
  assertOpenApiSpecExists,
} from "./configuration";

export const API_ROUTE_PREFIX = "/v1";

/**
 * Reads the active OpenAPI YAML file without dereferencing it.
 */
export const readOpenApiSourceDocument = (): OpenAPIV3.Document => {
  const fileContent = fs.readFileSync(assertOpenApiSpecExists(), "utf8");
  return yaml.load(fileContent) as OpenAPIV3.Document;
};

/**
 * Loads the active OpenAPI specification and validates it before server bootstrap.
 */
export const loadOpenApiDocument = async (): Promise<OpenAPIV3.Document> => {
  const specPath = assertOpenApiSpecExists();
  await SwaggerParser.validate(specPath);
  const document = await SwaggerParser.dereference(specPath);
  return document as OpenAPIV3.Document;
};
