import { LAYER_CONFIGURATIONS } from "../../configuration/layers/catalogs/layerConfigurationCatalog";
import type { LayerConfiguration } from "../../types/layers/layerConfigurationTypes";
import type { LayerFilterId } from "../../types/layers/layerFilterTypes";

/**
 * Returns the full static backend layer catalog.
 *
 * This registry is the service boundary over layer configuration data: endpoint
 * services ask it which layers exist and which capabilities each layer exposes
 * instead of reading the catalog directly.
 */
export const getAllLayerConfigurations = (): LayerConfiguration[] =>
  LAYER_CONFIGURATIONS;

/**
 * Returns the layer configurations that should be advertised by filter-focused
 * layer endpoints.
 */
export const getFilterableLayerConfigurations = (): LayerConfiguration[] =>
  LAYER_CONFIGURATIONS.filter((configuration) => configuration.filterable);

/**
 * Resolves one configured layer by id from the static backend layer registry.
 */
export const getLayerConfigurationById = (
  layerId: string
): LayerConfiguration | undefined =>
  LAYER_CONFIGURATIONS.find((entry) => entry.id === layerId);

/**
 * Backward-compatible alias for services that still use the older configuration
 * layer naming.
 */
export const getConfigurationLayerById = getLayerConfigurationById;

/**
 * Reports whether the configured layer has a live attribute source.
 *
 * The GeoServer attribute-list service uses the actual source details; this
 * helper only exposes the capability check to callers that need a boolean.
 */
export const supportsAttributeList = (layerId: string): boolean =>
  Boolean(getLayerConfigurationById(layerId)?.attributeSource);

/**
 * Lists all configured layers that support the provided public filter id.
 *
 * Filter ownership stays on the static layer catalog: callers provide a filter
 * id and this registry returns the layer ids that advertise it.
 */
export const getLayerIdsSupportingFilterId = (
  filterId: LayerFilterId
): string[] =>
  LAYER_CONFIGURATIONS.filter((configuration) =>
    configuration.filterIds.includes(filterId)
  ).map((configuration) => configuration.id);
