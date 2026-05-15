/**
 * @fileoverview Builds the OpenAPI document served by the mock Swagger UI.
 */

import type { OpenAPIV3 } from "openapi-types";
import {
  VOCABULARY_TERMS,
} from "../data/mockData";
import {
  getDefaultFiltersResponse,
  getLayerFiltersResponse,
  getLayersResponse,
  getMockLayerAttributesResponse,
} from "../services/layersService";
import {
  getVocabulariesResponse,
  getVocabularyLayers,
  getVocabularyTerms,
} from "../services/vocabService";
import { API_ROUTE_PREFIX } from "./specification";

type ExampleMap = Record<string, OpenAPIV3.ExampleObject | OpenAPIV3.ReferenceObject>;

const cloneDocument = (document: OpenAPIV3.Document): OpenAPIV3.Document =>
  JSON.parse(JSON.stringify(document)) as OpenAPIV3.Document;

const getOperation = (
  document: OpenAPIV3.Document,
  path: string,
  method: string
): OpenAPIV3.OperationObject | undefined => {
  const pathItem = document.paths?.[path];
  if (!pathItem) {
    return undefined;
  }

  const operation = pathItem[method as keyof OpenAPIV3.PathItemObject];
  if (!operation || typeof operation !== "object" || "$ref" in operation) {
    return undefined;
  }

  return operation as OpenAPIV3.OperationObject;
};

const getJsonMediaType = (
  document: OpenAPIV3.Document,
  path: string,
  method: string,
  statusCode: string
): OpenAPIV3.MediaTypeObject | undefined => {
  const operation = getOperation(document, path, method);
  if (!operation) {
    return undefined;
  }

  const response = operation.responses?.[statusCode];
  if (!response || typeof response !== "object" || "$ref" in response) {
    return undefined;
  }

  return response.content?.["application/json"];
};

const setResponseExample = (
  document: OpenAPIV3.Document,
  path: string,
  method: string,
  statusCode: string,
  example: unknown
): void => {
  const mediaType = getJsonMediaType(document, path, method, statusCode);
  if (!mediaType) {
    return;
  }

  mediaType.example = example;
  delete mediaType.examples;
};

const setResponseExamples = (
  document: OpenAPIV3.Document,
  path: string,
  method: string,
  statusCode: string,
  examples: ExampleMap
): void => {
  const mediaType = getJsonMediaType(document, path, method, statusCode);
  if (!mediaType) {
    return;
  }

  mediaType.examples = examples;
  delete mediaType.example;
};

const createDefaultFilterExamples = (): ExampleMap => {
  const chronostratigraphy = getDefaultFiltersResponse(
    "gc_bedrock",
    VOCABULARY_TERMS["chronostratigraphy"][0]
  );
  const lithology = getDefaultFiltersResponse(
    "gc_bedrock",
    VOCABULARY_TERMS["lithology"][0]
  );
  const tectonicUnits = getDefaultFiltersResponse(
    "tecto_units_augm",
    VOCABULARY_TERMS["tectonic-units"][2]
  );

  if (chronostratigraphy.error || lithology.error || tectonicUnits.error) {
    throw new Error("Failed to build default filter examples from mock data.");
  }

  return {
    ChronostratigraphyTerm: {
      summary: "Example with a Chronostratigraphy term and no default filters",
      value: chronostratigraphy.response,
    },
    LithologyTerm: {
      summary: "Example with a Lithology term and one default filter",
      value: lithology.response,
    },
    TectonicUnitsTerm: {
      summary: "Example with a Tectonic Units term and one default filter",
      value: tectonicUnits.response,
    },
  };
};

/**
 * Applies mock-runtime adjustments to the repository OpenAPI document without changing the contract shape.
 */
export const buildServedOpenApiDocument = (
  sourceDocument: OpenAPIV3.Document
): OpenAPIV3.Document => {
  const document = cloneDocument(sourceDocument);

  document.servers = [
    {
      url: API_ROUTE_PREFIX,
      description: "Current mock server",
    },
  ];

  setResponseExample(document, "/layers", "get", "200", getLayersResponse());
  setResponseExamples(document, "/layers/{layerId}/filters", "get", "200", {
    gc_bedrock: {
      summary: "Filters for gc_bedrock layer",
      value: getLayerFiltersResponse("gc_bedrock"),
    },
  });
  setResponseExamples(
    document,
    "/layers/{layerId}/defaultFilters",
    "get",
    "200",
    createDefaultFilterExamples()
  );
  setResponseExamples(document, "/layers/{layerId}/attributeList", "get", "200", {
    gc_bedrock: {
      summary: "Attributes for gc_bedrock layer",
      value: getMockLayerAttributesResponse("gc_bedrock"),
    },
  });

  setResponseExample(document, "/vocabularies", "get", "200", getVocabulariesResponse());
  setResponseExample(
    document,
    "/vocabularies/chronostratigraphy/terms",
    "get",
    "200",
    getVocabularyTerms("chronostratigraphy")
  );
  setResponseExample(
    document,
    "/vocabularies/tectonic-units/terms",
    "get",
    "200",
    getVocabularyTerms("tectonic-units")
  );
  setResponseExample(
    document,
    "/vocabularies/lithostratigraphy/terms",
    "get",
    "200",
    getVocabularyTerms("lithostratigraphy")
  );
  setResponseExample(
    document,
    "/vocabularies/lithology/terms",
    "get",
    "200",
    getVocabularyTerms("lithology")
  );

  setResponseExample(
    document,
    "/vocabularies/chronostratigraphy/layers",
    "get",
    "200",
    getVocabularyLayers("chronostratigraphy")
  );
  setResponseExample(
    document,
    "/vocabularies/tectonic-units/layers",
    "get",
    "200",
    getVocabularyLayers("tectonic-units")
  );
  setResponseExample(
    document,
    "/vocabularies/lithostratigraphy/layers",
    "get",
    "200",
    getVocabularyLayers("lithostratigraphy")
  );
  setResponseExample(
    document,
    "/vocabularies/lithology/layers",
    "get",
    "200",
    getVocabularyLayers("lithology")
  );

  return document;
};
