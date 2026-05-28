/**
 * @fileoverview GeoServer-backed attribute list resolution for `/layers/{layerId}/attributeList`.
 */

import { readGeoServerEnvironmentConfig } from "../../configuration/geoserver/configuration";
import { getConfigurationLayerById } from "../layers/layerConfigurationRegistry";
import type { LayerAttributesResponse } from "../../types/layers/layersServiceTypes";
import type { AttributeListLogger } from "../../types/geoserver/layerAttributeListTypes";

const EXCLUDED_ATTRIBUTE_NAMES = new Set(["geom", "id", "color_id"]);

const buildGeoServerWfsPath = (pathname: string): string => {
  const normalizedPath = pathname.replace(/\/+$/, "");

  if (/\/wfs$/i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (/\/wms$/i.test(normalizedPath)) {
    return normalizedPath.replace(/\/wms$/i, "/wfs");
  }

  return `${normalizedPath}/wfs`;
};

/**
 * Builds the GeoServer WFS DescribeFeatureType URL used for live attribute
 * discovery.
 *
 * The configured GeoServer base URL may point at the server root, WMS, or WFS;
 * this function normalizes that path to WFS and attaches the DescribeFeatureType
 * query expected by GeoServer for the layer type name.
 */
export const buildDescribeFeatureTypeUrl = (
  geoserverBaseUrl: string,
  typeName: string
): string => {
  const url = new URL(geoserverBaseUrl);
  url.pathname = buildGeoServerWfsPath(url.pathname);
  url.search = "";
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "DescribeFeatureType");
  url.searchParams.set("typeName", typeName);

  return url.toString();
};

/**
 * Extracts public attribute names from a GeoServer DescribeFeatureType XML
 * document.
 *
 * GeoServer emits XSD elements inside a sequence for feature properties. This
 * parser keeps the extraction narrow to those element names, removes internal
 * geometry/id/color fields, and de-duplicates the result while preserving the
 * order returned by the schema.
 */
export const extractAttributeNamesFromDescribeFeatureType = (
  xmlText: string
): string[] => {
  const sequenceMatch = xmlText.match(
    /<([A-Za-z_][\w.-]*):sequence\b[^>]*>([\s\S]*?)<\/\1:sequence>/i
  );
  const schemaFragment = sequenceMatch ? sequenceMatch[2] : xmlText;
  const elementMatches = schemaFragment.matchAll(
    /<([A-Za-z_][\w.-]*):element\b[^>]*\bname="([^"]+)"[^>]*\/?>/gi
  );
  const attributeNames = Array.from(elementMatches, (match) => match[2]).filter(
    (attributeName) => !EXCLUDED_ATTRIBUTE_NAMES.has(attributeName)
  );

  return Array.from(new Set(attributeNames));
};

/**
 * Resolves the `/layers/{layerId}/attributeList` payload from live GeoServer
 * metadata when the configured layer has an attribute source.
 *
 * Layer eligibility comes from the static layer registry, GeoServer connection
 * details come from environment configuration, and this service owns the WFS
 * DescribeFeatureType call plus XML-to-attribute translation. Lookup failures,
 * missing attribute sources, and upstream non-OK responses intentionally fall
 * back to an empty attribute list so the endpoint keeps a stable response shape.
 */
export const getLiveLayerAttributesResponse = async (
  layerId: string,
  logger?: AttributeListLogger
): Promise<LayerAttributesResponse | null> => {
  const layerConfiguration = getConfigurationLayerById(layerId);
  if (!layerConfiguration) {
    return null;
  }

  if (!layerConfiguration.attributeSource) {
    return {
      layerId: layerConfiguration.id,
      attributes: [],
    };
  }

  const environmentConfig = readGeoServerEnvironmentConfig();
  const describeUrl = buildDescribeFeatureTypeUrl(
    environmentConfig.baseUrl,
    layerConfiguration.attributeSource.typeName
  );

  logger?.info(
    {
      layerId: layerConfiguration.id,
      typeName: layerConfiguration.attributeSource.typeName,
      url: describeUrl,
    },
    "Fetching GeoServer DescribeFeatureType for layer attribute list."
  );

  try {
    const response = await fetch(describeUrl);
    if (!response.ok) {
      logger?.warn(
        {
          layerId: layerConfiguration.id,
          typeName: layerConfiguration.attributeSource.typeName,
          url: describeUrl,
          statusCode: response.status,
        },
        "GeoServer DescribeFeatureType request failed for layer attribute list."
      );

      return {
        layerId: layerConfiguration.id,
        attributes: [],
      };
    }

    const xmlText = await response.text();
    const attributes = extractAttributeNamesFromDescribeFeatureType(xmlText);

    logger?.info(
      {
        layerId: layerConfiguration.id,
        typeName: layerConfiguration.attributeSource.typeName,
        attributeCount: attributes.length,
      },
      "Resolved layer attribute list from GeoServer DescribeFeatureType."
    );

    return {
      layerId: layerConfiguration.id,
      attributes,
    };
  } catch (error) {
    logger?.error(
      {
        err: error,
        layerId: layerConfiguration.id,
        typeName: layerConfiguration.attributeSource.typeName,
        url: describeUrl,
      },
      "GeoServer DescribeFeatureType lookup failed for layer attribute list."
    );

    return {
      layerId: layerConfiguration.id,
      attributes: [],
    };
  }
};
