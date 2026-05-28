import type { GeoServerEnvironmentConfig } from "../../types/geoserver/geoserverConfigurationTypes";
import type { WmtsResponse } from "../../types/wmts/wmtsSourceTypes";
import { getLayerConfigurationById } from "../layers/layerConfigurationRegistry";

const WMTS_CAPABILITIES_QUERY =
  "SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities";

const joinUrlParts = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/u, "")}/${path.replace(/^\/+/u, "")}`;

const buildWmtsCapabilitiesUrl = (
  baseUrl: string,
  capabilitiesPath: string
): string => `${joinUrlParts(baseUrl, capabilitiesPath)}?${WMTS_CAPABILITIES_QUERY}`;

/**
 * Builds the `/layers/{layerId}/wmtsSource` payload for a configured layer.
 *
 * Layer lookup and WMTS capability metadata come from the static layer
 * registry, while the GeoServer environment supplies the deployment-specific
 * base URL. This service composes those pieces into the client-facing source
 * object and delegates layer eligibility to the registry by returning `null`
 * when no WMTS source is configured.
 */
export const getWmtsSourceResponse = (
  layerId: string,
  geoserverConfiguration: GeoServerEnvironmentConfig
): WmtsResponse | null => {
  const layer = getLayerConfigurationById(layerId);
  if (!layer?.wmtsSource) {
    return null;
  }

  return {
    layerId: layer.id,
    source: {
      urlWMTS: buildWmtsCapabilitiesUrl(
        geoserverConfiguration.baseUrl,
        layer.wmtsSource.capabilitiesPath
      ),
      paramsWMTS: layer.wmtsSource.paramsWMTS,
      serverType: layer.wmtsSource.serverType,
      crossOrigin: layer.wmtsSource.crossOrigin,
    },
  };
};
