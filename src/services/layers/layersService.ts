/**
 * @fileoverview Service helpers for layer-related response payloads.
 */

import {
  LAYERS,
} from "../../data/mockData";
import type { LayerDefinition } from "../../types/layers/mockLayerTypes";
import {
  getVocabularyFilterId,
  isTermFilterId,
} from "../filters/filterConfigurationRegistry";
import { readGraphDbEnvironmentConfig } from "../../configuration/graphdb/configuration";
import { inferVocabularyIdFromTermUri } from "../graphdb/vocabularyDefinitionRegistry";
import {
  getFilterableLayerConfigurations,
  getLayerConfigurationById,
} from "./layerConfigurationRegistry";
import type { LayerConfiguration } from "../../types/layers/layerConfigurationTypes";
import {
  LAYER_FILTER_CATALOG,
} from "../../configuration/layers/catalogs/filterCatalog";
import { WEBMAP_ID } from "../../configuration/webmap/configuration";
import type {
  DefaultFiltersResult,
  LayerAttributesResponse,
  LayerFiltersResponse,
  LayersResponse,
  LayerSummary,
} from "../../types/layers/layersServiceTypes";

const UNSUPPORTED_TERM_MESSAGE =
  "Layer does not support the vocabulary inferred from the provided term";

const toConfiguredLayerSummary = (layer: LayerConfiguration): LayerSummary => ({
  id: layer.id,
  name: layer.name,
  filterable: layer.filterable,
  availableFilters: layer.filterIds.map((filterId) => ({
    id: filterId,
    name: LAYER_FILTER_CATALOG[filterId].name,
    title: LAYER_FILTER_CATALOG[filterId].title,
    description: LAYER_FILTER_CATALOG[filterId].description,
  })),
});

/**
 * Builds the public `/layers` response from the configured filterable layer
 * registry.
 *
 * The layer registry defines which layers are exposed by this endpoint; the
 * filter catalog supplies the public metadata for each advertised filter id.
 */
export const getLayersResponse = (): LayersResponse => ({
  webmapId: WEBMAP_ID,
  layers: getFilterableLayerConfigurations().map(toConfiguredLayerSummary),
});

/**
 * Resolves a legacy mock layer definition by id.
 *
 * Newer endpoint builders use the static layer configuration registry, while
 * this helper keeps mock-backed attribute responses available for callers that
 * still depend on the mock data catalog.
 */
export const getMockLayerById = (layerId: string): LayerDefinition | undefined =>
  LAYERS.find((layer) => layer.id === layerId);

/**
 * Resolves the public filter metadata exposed by `/layers/{layerId}/filters`.
 *
 * The layer configuration registry controls membership and filter ordering; the
 * filter catalog provides the response objects returned to clients. Returns
 * `null` when the layer is not part of the configured filterable layer registry.
 */
export const getLayerFiltersResponse = (
  layerId: string
): LayerFiltersResponse | null => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer) return null;

  return {
    layerId: layer.id,
    filters: layer.filterIds.map((filterId) => LAYER_FILTER_CATALOG[filterId]),
  };
};

/**
 * Builds a mock-backed `/layers/{layerId}/attributeList` response.
 *
 * Live GeoServer attribute discovery is handled in the GeoServer service; this
 * function is limited to the mock catalog path and returns `null` when the
 * requested layer is unknown there.
 */
export const getMockLayerAttributesResponse = (
  layerId: string
): LayerAttributesResponse | null => {
  const layer = getMockLayerById(layerId);
  if (!layer) return null;

  return {
    layerId: layer.id,
    attributes: layer.attributes,
  };
};

/**
 * Builds default filter selections for a layer and vocabulary term.
 *
 * The flow is intentionally split across registries: GraphDB configuration
 * provides the vocabulary URI prefix, the vocabulary registry infers the
 * vocabulary id from the term, the filter registry maps that vocabulary to a
 * public filter id, and the layer registry decides whether the target layer
 * supports that filter. The result carries either an endpoint-ready response or
 * the status/message pair the controller should return.
 */
export const getDefaultFiltersResponse = (
  layerId: string,
  term: string
): DefaultFiltersResult => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer) {
    return {
      error: {
        statusCode: 404,
        message: "Layer not found",
      },
    };
  }

  const vocabularyId = inferVocabularyIdFromTermUri(
    term,
    readGraphDbEnvironmentConfig().vocabularyPrefixUrl
  );
  if (!vocabularyId) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  const filterId = getVocabularyFilterId(vocabularyId);
  if (!filterId || !layer.filterIds.includes(filterId)) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  if (vocabularyId === "chronostratigraphy") {
    return {
      response: {
        layerId: layer.id,
        filters: [],
      },
    };
  }

  if (!isTermFilterId(filterId)) {
    return {
      error: {
        statusCode: 400,
        message: UNSUPPORTED_TERM_MESSAGE,
      },
    };
  }

  return {
    response: {
      layerId: layer.id,
      filters: [
        {
          filterId,
          parameters: {
            term,
            includeNarrowers: true,
          },
        },
      ],
    },
  };
};
