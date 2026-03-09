/**
 * OpenAPI route schemas and shared Swagger metadata.
 */

const schemaRef = (schemaId: string) => ({ $ref: `${schemaId}#` } as const);

export const errorResponseSchema = {
  $id: "ErrorResponse",
  type: "object",
  additionalProperties: false,
  required: ["code", "message"],
  properties: {
    code: { type: "integer" },
    message: { type: "string" },
  },
} as const;

const layerFilterSummarySchema = {
  $id: "LayerFilterSummary",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

const layerSummarySchema = {
  $id: "LayerSummary",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "filterable", "availableFilters"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    filterable: { type: "boolean" },
    availableFilters: {
      type: "array",
      items: schemaRef("LayerFilterSummary"),
    },
  },
} as const;

const filterDefinitionSchema = {
  $id: "FilterDefinition",
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "description"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
  },
} as const;

const layerIdParamsSchema = {
  $id: "LayerIdParams",
  type: "object",
  additionalProperties: false,
  required: ["layerId"],
  properties: {
    layerId: { type: "string" },
  },
} as const;

const layersResponseSchema = {
  $id: "LayersResponse",
  type: "object",
  additionalProperties: false,
  required: ["webmapId", "layers"],
  properties: {
    webmapId: { type: "string" },
    layers: {
      type: "array",
      items: schemaRef("LayerSummary"),
    },
  },
} as const;

const layerFiltersResponseSchema = {
  $id: "LayerFiltersResponse",
  type: "object",
  additionalProperties: false,
  required: ["layerId", "filters"],
  properties: {
    layerId: { type: "string" },
    filters: { type: "array", items: schemaRef("FilterDefinition") },
  },
} as const;

const layerAttributesResponseSchema = {
  $id: "LayerAttributesResponse",
  type: "object",
  additionalProperties: false,
  required: ["layerId", "attributes"],
  properties: {
    layerId: { type: "string" },
    attributes: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

const vocabularyDescriptorSchema = {
  $id: "VocabularyDescriptor",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

const vocabulariesResponseSchema = {
  $id: "VocabulariesResponse",
  type: "object",
  additionalProperties: false,
  required: ["vocabularies"],
  properties: {
    vocabularies: {
      type: "array",
      items: schemaRef("VocabularyDescriptor"),
    },
  },
} as const;

const vocabularyTermsResponseSchema = {
  $id: "VocabularyTermsResponse",
  type: "object",
  additionalProperties: false,
  required: ["terms"],
  properties: {
    terms: {
      type: "array",
      items: { type: "string", format: "uri" },
    },
  },
} as const;

const vocabularyLayerRefSchema = {
  $id: "VocabularyLayerRef",
  type: "object",
  additionalProperties: false,
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

const vocabularyLayersResponseSchema = {
  $id: "VocabularyLayersResponse",
  type: "object",
  additionalProperties: false,
  required: ["layers"],
  properties: {
    layers: {
      type: "array",
      items: schemaRef("VocabularyLayerRef"),
    },
  },
} as const;

const wmsFilterInputSchema = {
  $id: "WmsFilterInput",
  type: "object",
  additionalProperties: true,
  description:
    "Filter payload accepted for request compatibility in the mock server.",
  properties: {
    filterId: { type: "string" },
    parameters: {},
  },
} as const;

const wmsRequestBodyDefault = {
  webmapId: "SwissTopoMap",
  layerId: "gc_bedrock",
  filters: [],
} as const;

const wmsRequestBodySchema = {
  $id: "WmsRequestBody",
  type: "object",
  additionalProperties: true,
  required: ["webmapId", "layerId"],
  description:
    "Mock request body. Filters are accepted but not interpreted by business logic.",
  properties: {
    webmapId: { type: "string", default: wmsRequestBodyDefault.webmapId },
    layerId: { type: "string", default: wmsRequestBodyDefault.layerId },
    filters: {
      type: "array",
      default: wmsRequestBodyDefault.filters,
      items: schemaRef("WmsFilterInput"),
    },
  },
} as const;

const wmsResponseSchema = {
  $id: "WmsResponse",
  type: "object",
  additionalProperties: false,
  required: ["url", "mimeType", "note"],
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    mimeType: { type: "string" },
    note: {
      type: "string",
    },
  },
} as const;

export const OPENAPI_COMPONENT_SCHEMAS = [
  errorResponseSchema,
  layerFilterSummarySchema,
  layerSummarySchema,
  filterDefinitionSchema,
  layerIdParamsSchema,
  layersResponseSchema,
  layerFiltersResponseSchema,
  layerAttributesResponseSchema,
  vocabularyDescriptorSchema,
  vocabulariesResponseSchema,
  vocabularyTermsResponseSchema,
  vocabularyLayerRefSchema,
  vocabularyLayersResponseSchema,
  wmsFilterInputSchema,
  wmsRequestBodySchema,
  wmsResponseSchema,
] as const;

export const getLayersRouteSchema = {
  tags: ["Layers"],
  summary: "Get list of filterable layers for a WebMap",
  description: "Returns all available map layers and their supported filters.",
  security: [{ ApiKeyAuth: [] }],
  response: {
    200: schemaRef("LayersResponse"),
    400: schemaRef("ErrorResponse"),
    401: schemaRef("ErrorResponse"),
    404: schemaRef("ErrorResponse"),
    500: schemaRef("ErrorResponse"),
  },
} as const;

export const getLayerFiltersRouteSchema = {
  tags: ["Layers"],
  summary: "Get enabled filters for a specific layer",
  params: schemaRef("LayerIdParams"),
  security: [{ ApiKeyAuth: [] }],
  response: {
    200: schemaRef("LayerFiltersResponse"),
    400: schemaRef("ErrorResponse"),
    401: schemaRef("ErrorResponse"),
    404: schemaRef("ErrorResponse"),
    500: schemaRef("ErrorResponse"),
  },
} as const;

export const getLayerAttributeListRouteSchema = {
  tags: ["Layers"],
  summary: "Get available attributes for filter by attribute on a specific layer",
  params: schemaRef("LayerIdParams"),
  security: [{ ApiKeyAuth: [] }],
  response: {
    200: schemaRef("LayerAttributesResponse"),
    400: schemaRef("ErrorResponse"),
    401: schemaRef("ErrorResponse"),
    404: schemaRef("ErrorResponse"),
    500: schemaRef("ErrorResponse"),
  },
} as const;

export const getVocabulariesRouteSchema = {
  tags: ["Vocabularies"],
  summary: "Get the list of available vocabularies",
  security: [{ ApiKeyAuth: [] }],
  response: {
    200: schemaRef("VocabulariesResponse"),
    400: schemaRef("ErrorResponse"),
    401: schemaRef("ErrorResponse"),
    500: schemaRef("ErrorResponse"),
  },
} as const;

const buildVocabularyTermsRouteSchema = (vocabularyId: string, label: string) =>
  ({
    tags: ["Vocabularies"],
    summary: `Get all ${label} terms`,
    description: `Returns the terms of vocabulary '${vocabularyId}'.`,
    security: [{ ApiKeyAuth: [] }],
    response: {
      200: schemaRef("VocabularyTermsResponse"),
      400: schemaRef("ErrorResponse"),
      401: schemaRef("ErrorResponse"),
      404: schemaRef("ErrorResponse"),
      500: schemaRef("ErrorResponse"),
    },
  } as const);

const buildVocabularyLayersRouteSchema = (
  vocabularyId: string,
  label: string
) =>
  ({
    tags: ["Vocabularies"],
    summary: `Get layers associated with ${label}`,
    description: `Returns layers associated with vocabulary '${vocabularyId}'.`,
    security: [{ ApiKeyAuth: [] }],
    response: {
      200: schemaRef("VocabularyLayersResponse"),
      400: schemaRef("ErrorResponse"),
      401: schemaRef("ErrorResponse"),
      404: schemaRef("ErrorResponse"),
      500: schemaRef("ErrorResponse"),
    },
  } as const);

export const getChronostratigraphyTermsRouteSchema =
  buildVocabularyTermsRouteSchema("chronostratigraphy", "Chronostratigraphy");
export const getChronostratigraphyLayersRouteSchema =
  buildVocabularyLayersRouteSchema(
    "chronostratigraphy",
    "Chronostratigraphy"
  );
export const getTectonicUnitsTermsRouteSchema = buildVocabularyTermsRouteSchema(
  "tectonic-units",
  "Tectonic Units"
);
export const getTectonicUnitsLayersRouteSchema =
  buildVocabularyLayersRouteSchema("tectonic-units", "Tectonic Units");
export const getLithostratigraphyTermsRouteSchema =
  buildVocabularyTermsRouteSchema("lithostratigraphy", "Lithostratigraphy");
export const getLithostratigraphyLayersRouteSchema =
  buildVocabularyLayersRouteSchema(
    "lithostratigraphy",
    "Lithostratigraphy"
  );
export const getLithologyTermsRouteSchema = buildVocabularyTermsRouteSchema(
  "lithology",
  "Lithology"
);
export const getLithologyLayersRouteSchema = buildVocabularyLayersRouteSchema(
  "lithology",
  "Lithology"
);

export const postWmsRouteSchema = {
  tags: ["WMS"],
  summary: "Generate a mock WMS Base URL for a layer",
  description:
    "Returns a mock WMS URL for the selected layer. Filter payload is accepted for compatibility but not applied.",
  body: schemaRef("WmsRequestBody"),
  security: [{ ApiKeyAuth: [] }],
  response: {
    200: schemaRef("WmsResponse"),
    400: schemaRef("ErrorResponse"),
    401: schemaRef("ErrorResponse"),
    404: schemaRef("ErrorResponse"),
    500: schemaRef("ErrorResponse"),
  },
} as const;

/**
 * Shared OpenAPI metadata used by both Swagger JSON and Swagger UI.
 */
export const OPENAPI_INFO = {
  title: "SwissTopo WebMap API",
  description:
    "RESTful mock API to discover filterable layers, inspect vocabularies and filters, and obtain WMS URLs for tests.\nUse Try it out to execute requests against mock endpoints.\n\nOpenAPI JSON endpoint: [OpenAPI JSON](/swagger/json)\n\nPlease note that the endpoints return mock data, so ignore partial or incorrect values when validating integrations.",
  version: "1.3.0",
};

export const OPENAPI_EXTERNAL_DOCS = {
  description: "WebMap semantic filter architecture and usage",
  url: "https://virtserver.swaggerhub.com/epsilonitalia/SwissTopoWebmapAPI/1.0.1",
};

export const OPENAPI_TAGS = [
  {
    name: "Layers",
    description: "Endpoints to list layers and their filters",
  },
  {
    name: "WMS",
    description: "Endpoints to obtain WMS links for filtered layers",
  },
  {
    name: "Vocabularies",
    description: "Endpoints for listing vocabularies and their terms",
  },
];

export const OPENAPI_SECURITY = [{ ApiKeyAuth: [] }];

export const OPENAPI_SERVERS = [
  {
    url: "/",
    description: "Runtime mock server",
  },
];

export const OPENAPI_COMPONENTS = {
  securitySchemes: {
    ApiKeyAuth: {
      type: "apiKey",
      name: "X-API-Key",
      in: "header",
      description:
        "Documentation-only in this mock server. Runtime API key enforcement is not enabled.",
    },
  },
};

/**
 * Utility to safely duplicate JSON-compatible objects before mutation.
 */
export const createDeepClone = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;
